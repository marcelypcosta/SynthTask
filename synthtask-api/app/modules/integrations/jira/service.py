"""
Integração Jira implementando o adaptador IntegrationService.

Suporta:
- salvar credenciais (base_url, email, api_token, opcional project_key)
- listar projetos
- criar issues (Task) em um projeto alvo
"""
from typing import Any, Dict, List, Optional, Tuple
import requests
from fastapi import HTTPException

from app.modules.integrations.base import IntegrationService
from app.modules.integrations.storage import IntegrationStorage


class JiraService(IntegrationService):
    provider_name = "jira"
    capabilities = ["projects", "create_task"]

    def __init__(self):
        self.storage = IntegrationStorage(provider=self.provider_name)

    # -----------------------
    # Credenciais
    # -----------------------
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
        if not creds or not creds.get("base_url") or not creds.get("email") or not creds.get("api_token"):
            raise HTTPException(status_code=400, detail="Credenciais Jira não configuradas")
        return creds

    # -----------------------
    # Descoberta
    # -----------------------
    async def get_projects(self, user_id: int) -> List[Dict[str, Any]]:
        creds = await self.get_user_credentials(user_id)
        base_url = creds["base_url"]
        auth = self._auth(creds)
        url = f"{base_url}/rest/api/3/project"
        try:
            resp = requests.get(url, auth=auth, headers={"Accept": "application/json"})
            if resp.status_code >= 400:
                detail = self._extract_error(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            projects = resp.json()
            # Formata retorno essencial
            return [{"id": p.get("id"), "key": p.get("key"), "name": p.get("name")} for p in projects]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # -----------------------
    # Operação principal
    # -----------------------
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
        base_url = creds["base_url"]
        auth = self._auth(creds)

        fields: Dict[str, Any] = {
            "project": {"key": target_id},
            "summary": title,
            "issuetype": {"name": "Task"},
        }

        description = task_data.get("description")
        if description:
            # Muitos tenants aceitam string simples; evita complexidade do ADF
            fields["description"] = description

        priority = task_data.get("priority")
        if priority:
            fields["priority"] = {"name": priority}

        assignee = task_data.get("assignee")
        if assignee:
            # Espera-se accountId do usuário no Jira Cloud
            fields["assignee"] = {"accountId": assignee}

        due_date = task_data.get("due_date")
        if due_date:
            fields["duedate"] = due_date

        payload = {"fields": fields}
        url = f"{base_url}/rest/api/3/issue"
        try:
            resp = requests.post(url, json=payload, auth=auth, headers={"Accept": "application/json", "Content-Type": "application/json"})
            if resp.status_code >= 400:
                detail = self._extract_error(resp)
                raise HTTPException(status_code=resp.status_code, detail=detail)
            data = resp.json()
            return {
                "id": data.get("id"),
                "key": data.get("key"),
                "url": f"{base_url}/browse/{data.get('key')}" if data.get("key") else None,
                "name": title,
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # -----------------------
    # Helpers
    # -----------------------
    def _auth(self, creds: Dict[str, Any]) -> Tuple[str, str]:
        return (creds["email"], creds["api_token"])

    def _extract_error(self, resp: requests.Response) -> str:
        try:
            j = resp.json()
            # Jira pode retornar 'errorMessages' ou 'errors'
            msgs = j.get("errorMessages")
            if isinstance(msgs, list) and msgs:
                return "; ".join(msgs)
            errs = j.get("errors")
            if isinstance(errs, dict) and errs:
                return "; ".join([f"{k}: {v}" for k, v in errs.items()])
            return str(j)
        except Exception:
            return resp.text