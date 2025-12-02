# Classe: JiraService
# Seções: Helpers e métodos reorganizados
"""
Integração Jira implementando o adaptador IntegrationService.
"""
from typing import Any, Dict, List, Tuple, Set
import os
import time
import requests
from fastapi import HTTPException

from app.modules.integrations.base import IntegrationService
from app.modules.integrations.storage import IntegrationStorage

ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token"
ATLASSIAN_RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources"

class JiraService(IntegrationService):
    provider_name = "jira"
    capabilities = ["projects", "users", "create_task"]

    def __init__(self):
        self.storage = IntegrationStorage(provider=self.provider_name)

    async def save_credentials(self, user_id: int, payload: Dict[str, Any]) -> None:
        required = ["base_url", "email", "api_token"]
        for r in required:
            if r not in payload or not payload[r]:
                raise HTTPException(status_code=400, detail=f"Campo ausente: {r}")
        # Normaliza base_url removendo barra final
        payload["base_url"] = str(payload["base_url"]).rstrip("/")
        await self.storage.save(user_id, payload)

    async def get_user_credentials(self, user_id: int) -> Dict[str, Any]:
        creds = await self.storage.get(user_id)
        if not creds:
            raise HTTPException(status_code=400, detail="Credenciais Jira não configuradas")
        # Preferência pelo fluxo OAuth (3LO)
        if creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id"):
            return creds
        # Fallback para credenciais básicas
        if creds.get("base_url") and creds.get("email") and creds.get("api_token"):
            return creds
        raise HTTPException(status_code=400, detail="Credenciais Jira não configuradas")

    async def refresh_oauth_tokens_if_expired(self, user_id: int, creds: Dict[str, Any]) -> Dict[str, Any]:
        if not (creds.get("oauth") and creds.get("access_token")):
            return creds
        obtained_at = int(creds.get("obtained_at") or 0)
        expires_in = int(creds.get("expires_in") or 0)
        now = int(time.time())
        if expires_in and obtained_at and now >= obtained_at + max(0, expires_in - 60):
            client_id = os.getenv("JIRA_CLIENT_ID")
            client_secret = os.getenv("JIRA_CLIENT_SECRET")
            refresh_token = creds.get("refresh_token")
            if client_id and client_secret and refresh_token:
                resp = requests.post(
                    ATLASSIAN_TOKEN_URL,
                    json={
                        "grant_type": "refresh_token",
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "refresh_token": refresh_token,
                    },
                    headers={"Content-Type": "application/json"},
                )
                if resp.status_code < 400:
                    tokens = resp.json()
                    creds["access_token"] = tokens.get("access_token") or creds["access_token"]
                    creds["expires_in"] = tokens.get("expires_in") or creds.get("expires_in")
                    creds["obtained_at"] = now
                    try:
                        r2 = requests.get(
                            ATLASSIAN_RESOURCES_URL,
                            headers={"Authorization": f"Bearer {creds['access_token']}", "Accept": "application/json"},
                        )
                        if r2.status_code < 400:
                            resources = r2.json()
                            if isinstance(resources, list) and resources:
                                if not creds.get("cloud_id"):
                                    jira_resources = [
                                        r for r in resources
                                        if str(r.get("resourceType", "")).lower() == "jira"
                                        or "jira" in str(r.get("name", "")).lower()
                                    ]
                                    candidate = jira_resources[0] if jira_resources else resources[0]
                                    creds["cloud_id"] = candidate.get("id") or creds.get("cloud_id")
                                    creds["scopes"] = candidate.get("scopes", []) or creds.get("scopes", [])
                                    creds["site_url"] = candidate.get("url") or creds.get("site_url")
                    except Exception:
                        pass
                    await self.storage.save(user_id, creds)
        return creds

    async def get_projects(self, user_id: int) -> List[Dict[str, Any]]:
        creds = await self.get_user_credentials(user_id)
        use_oauth = bool(creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id"))
        params = {"startAt": 0, "maxResults": 50}

        if use_oauth:
            creds = await self.refresh_oauth_tokens_if_expired(user_id, creds)
            scopes_set = set(creds.get("scopes") or [])
            if not self.has_required_project_read_scope(scopes_set):
                raise HTTPException(
                    status_code=401,
                    detail="Unauthorized; scope does not match (exige read:project:jira ou read:jira-work)",
                )
            base = self.jira_api_base_url(creds, use_oauth=True)
            url = f"{base}/project/search"
            headers = {"Accept": "application/json", "Authorization": f"Bearer {creds['access_token']}"}
            auth = None
        else:
            base = self.jira_api_base_url(creds, use_oauth=False)
            url = f"{base}/project/search"
            headers = {"Accept": "application/json"}
            auth = self.get_basic_auth(creds)

        try:
            resp = requests.get(url, params=params, auth=auth, headers=headers)
            if resp.status_code >= 400:
                detail = self.parse_jira_error_response(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            data = resp.json()
            projects_raw = data.get("values") if isinstance(data, dict) else data
            projects = projects_raw or []
            return [{"id": p.get("id"), "key": p.get("key"), "name": p.get("name")} for p in projects]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def create_task(self, user_id: int, target_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Criar uma issue no Jira.

        target_id: chave do projeto (ex.: "PROJ")
        task_data: { title, description?, priority?, assignee?, due_date? }
        - title -> summary
        - description -> description (texto simples)
        - priority -> fields.priority.name
        - assignee -> fields.assignee.accountId (se fornecido)
        - due_date -> fields.duedate (YYYY-MM-DD)
        """
        if not target_id:
            raise HTTPException(status_code=400, detail="target_id (project key) é obrigatório")
        title = task_data.get("title")
        if not title:
            raise HTTPException(status_code=400, detail="Título é obrigatório para criar issue")

        creds = await self.get_user_credentials(user_id)
        use_oauth = creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id")

        # Suporta tanto chave (ex.: PROJ) quanto id numérico (ex.: 10000)
        key_or_id = str(target_id)
        resolved_key = key_or_id
        if key_or_id.isdigit():
            resolved_key = await self.resolve_project_key(user_id, key_or_id, creds)
        fields: Dict[str, Any] = {
            "project": {"key": resolved_key},
            "summary": title,
            "issuetype": {"name": "Task"},
        }

        description = task_data.get("description")
        if description is not None:
            if isinstance(description, dict) and str(description.get("type")) == "doc":
                fields["description"] = description
            else:
                fields["description"] = {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {"type": "paragraph", "content": [{"type": "text", "text": str(description)}]}
                    ],
                }

        priority = task_data.get("priority")
        if priority:
            fields["priority"] = {"name": priority}

        assignee = task_data.get("assignee")
        if assignee:
            account_id = None
            s = str(assignee).strip()
            if s:
                if ":" in s or len(s) >= 20:
                    account_id = s
                else:
                    try:
                        users = await self.get_assignable_users(user_id, resolved_key)
                        ns = s.lower()
                        for u in users:
                            dn = str(u.get("displayName") or "").lower()
                            if ns == dn or dn.startswith(ns) or ns in dn:
                                account_id = u.get("accountId")
                                break
                    except Exception:
                        account_id = None
            if account_id:
                fields["assignee"] = {"accountId": account_id}

        due_date = task_data.get("due_date")
        if due_date:
            fields["duedate"] = due_date

        payload = {"fields": fields}
        if use_oauth:
            # Garantir token válido antes de chamar a API
            creds = await self.refresh_oauth_tokens_if_expired(user_id, creds)
            base = f"https://api.atlassian.com/ex/jira/{creds['cloud_id']}/rest/api/3"
            url = f"{base}/issue"
            headers = {"Accept": "application/json", "Content-Type": "application/json", "Authorization": f"Bearer {creds['access_token']}"}
            auth = None
            browse_base = f"https://api.atlassian.com/ex/jira/{creds['cloud_id']}"
        else:
            base_url = creds["base_url"]
            url = f"{base_url}/rest/api/3/issue"
            headers = {"Accept": "application/json", "Content-Type": "application/json"}
            auth = self.get_basic_auth(creds)
            browse_base = base_url
        try:
            resp = requests.post(url, json=payload, auth=auth, headers=headers)
            if resp.status_code >= 400:
                detail = self.parse_jira_error_response(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            data = resp.json()
            return {
                "id": data.get("id"),
                "key": data.get("key"),
                "url": f"{browse_base}/browse/{data.get('key')}" if data.get("key") else None,
                "name": title,
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def search_users(self, user_id: int, query: str) -> List[Dict[str, Any]]:
        """Buscar usuários do Jira pelo parâmetro 'query' (email, nome ou username).

        Endpoint oficial: GET /rest/api/3/user/search?query=...
        """
        creds = await self.get_user_credentials(user_id)
        use_oauth = bool(creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id"))
        params = {"query": query}
        if use_oauth:
            creds = await self.refresh_oauth_tokens_if_expired(user_id, creds)
            base = self.jira_api_base_url(creds, use_oauth=True)
            url = f"{base}/user/search"
            headers = {"Accept": "application/json", "Authorization": f"Bearer {creds['access_token']}"}
            auth = None
        else:
            base = self.jira_api_base_url(creds, use_oauth=False)
            url = f"{base}/user/search"
            headers = {"Accept": "application/json"}
            auth = self.get_basic_auth(creds)
        try:
            resp = requests.get(url, params=params, auth=auth, headers=headers)
            if resp.status_code >= 400:
                detail = self.parse_jira_error_response(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            users = resp.json() or []
            normalized: List[Dict[str, Any]] = []
            for u in users:
                normalized.append({
                    "accountId": u.get("accountId"),
                    "displayName": u.get("displayName"),
                    "emailAddress": u.get("emailAddress"),
                })
            return normalized
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_assignable_users(self, user_id: int, project_key: str) -> List[Dict[str, Any]]:
        creds = await self.get_user_credentials(user_id)
        use_oauth = bool(creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id"))
        # Resolve project key when an ID (numeric) is provided
        key_or_id = str(project_key)
        resolved_key = key_or_id
        if key_or_id.isdigit():
            resolved_key = await self.resolve_project_key(user_id, key_or_id, creds)
        params = {"project": resolved_key, "maxResults": 50}

        if use_oauth:
            creds = await self.refresh_oauth_tokens_if_expired(user_id, creds)
            base = self.jira_api_base_url(creds, use_oauth=True)
            url = f"{base}/user/assignable/search"
            headers = {"Accept": "application/json", "Authorization": f"Bearer {creds['access_token']}"}
            auth = None
        else:
            base = self.jira_api_base_url(creds, use_oauth=False)
            url = f"{base}/user/assignable/search"
            headers = {"Accept": "application/json"}
            auth = self.get_basic_auth(creds)

        try:
            resp = requests.get(url, params=params, auth=auth, headers=headers)
            if resp.status_code >= 400:
                # Fallback: if unauthorized due to scope, aggregate users from project roles
                if resp.status_code in (401, 403):
                    roles = await self.get_project_roles(user_id, resolved_key)
                    aggregated: List[Dict[str, Any]] = []
                    for r in roles:
                        users = await self.get_project_role_actors(user_id, resolved_key, str(r.get("id")))
                        aggregated.extend(users)
                    # Deduplicate by accountId
                    seen: Set[str] = set()
                    result: List[Dict[str, Any]] = []
                    for u in aggregated:
                        acc = str(u.get("accountId"))
                        if acc and acc not in seen:
                            seen.add(acc)
                            result.append(u)
                    return result
                detail = self.parse_jira_error_response(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            users = resp.json() or []
            normalized = []
            for u in users:
                normalized.append({
                    "accountId": u.get("accountId"),
                    "displayName": u.get("displayName"),
                    "emailAddress": u.get("emailAddress"),
                })
            return normalized
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_basic_auth(self, creds: Dict[str, Any]) -> Tuple[str, str]:
        return (creds["email"], creds["api_token"])

    def parse_jira_error_response(self, resp: requests.Response) -> str:
        try:
            j = resp.json()
            msgs = j.get("errorMessages")
            if isinstance(msgs, list) and msgs:
                return "; ".join(msgs)
            errs = j.get("errors")
            if isinstance(errs, dict) and errs:
                return "; ".join([f"{k}: {v}" for k, v in errs.items()])
            return str(j)
        except Exception:
            return resp.text

    def has_required_project_read_scope(self, scopes: Set[str]) -> bool:
        return ("read:project:jira" in scopes) or ("read:jira-work" in scopes)

    def jira_api_base_url(self, creds: Dict[str, Any], use_oauth: bool) -> str:
        if use_oauth:
            return f"https://api.atlassian.com/ex/jira/{creds['cloud_id']}/rest/api/3"
        return f"{creds['base_url'].rstrip('/')}/rest/api/3"

    def has_required_user_read_scope(self, scopes: Set[str]) -> bool:
        return ("read:user:jira" in scopes)

    def has_required_project_roles_scope(self, scopes: Set[str]) -> bool:
        return ("read:project-role:jira" in scopes) or ("read:jira-work" in scopes)

    async def resolve_project_key(self, user_id: int, project_id: str, creds: Dict[str, Any]) -> str:
        """Resolve a project key from a numeric project id."""
        use_oauth = bool(creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id"))
        if use_oauth:
            creds = await self.refresh_oauth_tokens_if_expired(user_id, creds)
            base = self.jira_api_base_url(creds, use_oauth=True)
            url = f"{base}/project/{project_id}"
            headers = {"Accept": "application/json", "Authorization": f"Bearer {creds['access_token']}"}
            auth = None
        else:
            base = self.jira_api_base_url(creds, use_oauth=False)
            url = f"{base}/project/{project_id}"
            headers = {"Accept": "application/json"}
            auth = self.get_basic_auth(creds)
        try:
            resp = requests.get(url, auth=auth, headers=headers)
            if resp.status_code >= 400:
                detail = self.parse_jira_error_response(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            data = resp.json() or {}
            key = data.get("key")
            if not key:
                raise HTTPException(status_code=404, detail="Projeto não encontrado")
            return str(key)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_project_roles(self, user_id: int, project_key_or_id: str) -> List[Dict[str, Any]]:
        """List project roles (name and id) for a project using v2 endpoint."""
        creds = await self.get_user_credentials(user_id)
        use_oauth = bool(creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id"))
        if use_oauth:
            scopes_set = set(creds.get("scopes") or [])
            if not self.has_required_project_roles_scope(scopes_set):
                raise HTTPException(status_code=401, detail="Unauthorized; scope does not match (exige read:project-role:jira ou read:jira-work)")
        # Resolve key if numeric id
        key_or_id = str(project_key_or_id)
        resolved_key = key_or_id
        if key_or_id.isdigit():
            resolved_key = await self.resolve_project_key(user_id, key_or_id, creds)
        if use_oauth:
            creds = await self.refresh_oauth_tokens_if_expired(user_id, creds)
            base = f"https://api.atlassian.com/ex/jira/{creds['cloud_id']}/rest/api/2"
            url = f"{base}/project/{resolved_key}/role"
            headers = {"Accept": "application/json", "Authorization": f"Bearer {creds['access_token']}"}
            auth = None
        else:
            base_url = creds["base_url"].rstrip("/")
            url = f"{base_url}/rest/api/2/project/{resolved_key}/role"
            headers = {"Accept": "application/json"}
            auth = self.get_basic_auth(creds)
        try:
            resp = requests.get(url, auth=auth, headers=headers)
            if resp.status_code >= 400:
                detail = self.parse_jira_error_response(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            data = resp.json() or {}
            roles: List[Dict[str, Any]] = []
            # v2 returns map of name -> role url
            for name, role_url in (data.items() if isinstance(data, dict) else []):
                # Extract id from URL suffix
                try:
                    role_id = str(role_url).rstrip("/").split("/")[-1]
                except Exception:
                    role_id = None
                if role_id:
                    roles.append({"id": role_id, "name": name})
            return roles
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_project_role_actors(self, user_id: int, project_key_or_id: str, role_id: str) -> List[Dict[str, Any]]:
        """Get user actors for a given project role using v2 endpoint."""
        creds = await self.get_user_credentials(user_id)
        use_oauth = bool(creds.get("oauth") and creds.get("access_token") and creds.get("cloud_id"))
        if use_oauth:
            scopes_set = set(creds.get("scopes") or [])
            if not self.has_required_project_roles_scope(scopes_set):
                raise HTTPException(status_code=401, detail="Unauthorized; scope does not match (exige read:project-role:jira ou read:jira-work)")
        key_or_id = str(project_key_or_id)
        resolved_key = key_or_id
        if key_or_id.isdigit():
            resolved_key = await self.resolve_project_key(user_id, key_or_id, creds)
        if use_oauth:
            creds = await self.refresh_oauth_tokens_if_expired(user_id, creds)
            base = f"https://api.atlassian.com/ex/jira/{creds['cloud_id']}/rest/api/2"
            url = f"{base}/project/{resolved_key}/role/{role_id}"
            headers = {"Accept": "application/json", "Authorization": f"Bearer {creds['access_token']}"}
            auth = None
        else:
            base_url = creds["base_url"].rstrip("/")
            url = f"{base_url}/rest/api/2/project/{resolved_key}/role/{role_id}"
            headers = {"Accept": "application/json"}
            auth = self.get_basic_auth(creds)
        try:
            resp = requests.get(url, auth=auth, headers=headers)
            if resp.status_code >= 400:
                detail = self.parse_jira_error_response(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            data = resp.json() or {}
            actors = data.get("actors") or []
            users: List[Dict[str, Any]] = []
            def is_app_actor(display: str, account_id: str) -> bool:
                display_lower = (display or "").lower()
                deny_tokens = [
                    "automation for jira",
                    "slack",
                    "system",
                    "trello",
                    "microsoft teams",
                    "statuspage",
                    "atlas",
                    "atlassian",
                    "proforma",
                    "jira outlook",
                    "spreadsheets",
                ]
                if any(t in display_lower for t in deny_tokens):
                    return True
                if str(account_id).startswith("557058:"):
                    return True
                return False
            for a in actors:
                if str(a.get("type", "")).startswith("atlassian-user"):
                    account_id = (a.get("actorUser") or {}).get("accountId")
                    display = a.get("displayName")
                    if account_id and not is_app_actor(str(display or ""), str(account_id)):
                        users.append({"accountId": account_id, "displayName": display})
            return users
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
