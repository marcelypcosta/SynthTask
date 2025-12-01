# Módulo: routers/integrations.py
# Seção: Imports e modelos
"""
Router de integrações que fornece endpoints genéricos para provedores plug-and-play.
"""
from fastapi import APIRouter, Depends, HTTPException
import logging
import os
import time
import requests
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.modules.integrations.registry import get_integration
from app.modules.integrations.storage import IntegrationStorage

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])
logger = logging.getLogger("integrations.jira")

@router.post("/{provider}/connect")
async def connect(provider: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Salvar credenciais do usuário para um provedor (ex.: Trello, Jira)."""
    service = get_integration(provider)
    await service.save_credentials(current_user["id"], payload)
    return {"message": f"Credenciais salvas para {provider}"}

@router.delete("/{provider}/connect")
async def disconnect(provider: str, current_user: dict = Depends(get_current_user)):
    """Remover credenciais do usuário para um provedor (desconectar)."""
    # Usa camada de armazenamento diretamente para remover credenciais
    from app.modules.integrations.storage import IntegrationStorage

    storage = IntegrationStorage(provider=provider)
    await storage.delete(current_user["id"])
    return {"message": f"Credenciais removidas para {provider}"}

@router.get("/{provider}/status")
async def status(provider: str, current_user: dict = Depends(get_current_user)):
    service = get_integration(provider)
    try:
        creds = await service.get_user_credentials(current_user["id"])
        return {
            "connected": True,
            "provider": provider,
            "oauth": bool(creds.get("oauth")),
            "account_email": creds.get("user_email") or creds.get("email"),
            "account_id": creds.get("user_account_id") or creds.get("account_id"),
            "site_url": creds.get("site_url") or creds.get("base_url"),
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Credenciais não configuradas")

# Seção: Constantes
ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token"
ATLASSIAN_RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources"

# Seção: Modelos
class JiraOAuthExchangePayload(BaseModel):
    code: str
    redirect_uri: Optional[str] = None

# Seção: Helpers
def _exchange_code_for_token(code: str, redirect_uri: str) -> Dict[str, Any]:
    client_id_raw = os.getenv("JIRA_CLIENT_ID") or ""
    client_secret_raw = os.getenv("JIRA_CLIENT_SECRET") or ""
    client_id = client_id_raw.replace("`", "").strip()
    client_secret = client_secret_raw.replace("`", "").strip()
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Configuração JIRA_CLIENT_ID/JIRA_CLIENT_SECRET ausente")

    payload = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    masked_id = (client_id[:4] + "***") if client_id else ""
    logger.info(f"Jira OAuth token exchange start status=initiated redirect_uri={redirect_uri} client_id={masked_id}")
    resp = requests.post(ATLASSIAN_TOKEN_URL, json=payload, headers={"Content-Type": "application/json", "Accept": "application/json"})
    if resp.status_code >= 400:
        # Tentar fallback com application/x-www-form-urlencoded (alguns ambientes exigem esta forma)
        form_payload = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }
        resp_form = requests.post(
            ATLASSIAN_TOKEN_URL,
            data=form_payload,
            headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        )
        if resp_form.status_code >= 400:
            # Tentar fallback com Basic Auth + form-url-encoded
            resp_basic = requests.post(
                ATLASSIAN_TOKEN_URL,
                data=form_payload,
                headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
                auth=(client_id, client_secret),
            )
            if resp_basic.status_code >= 400:
                try:
                    errb = resp_basic.json() or {}
                    msgb = errb.get("error_description") or errb.get("error") or resp_basic.text
                except Exception:
                    msgb = resp_basic.text
                logger.error(
                    f"Jira OAuth token exchange failed status={resp_basic.status_code} message={msgb} redirect_uri={redirect_uri} client_id={masked_id}"
                )
                raise HTTPException(
                    status_code=resp_basic.status_code,
                    detail=f"{msgb}; verifique JIRA_CLIENT_ID/JIRA_CLIENT_SECRET e JIRA_REDIRECT_URI/JIRA_REDIRECT_URL"
                )
            try:
                err = resp_form.json() or {}
                msg = err.get("error_description") or err.get("error") or resp_form.text
            except Exception:
                msg = resp_form.text
            logger.error(
                f"Jira OAuth token exchange failed status={resp_form.status_code} message={msg} redirect_uri={redirect_uri} client_id={masked_id}"
            )
            raise HTTPException(
                status_code=resp_form.status_code,
                detail=f"{msg}; verifique JIRA_CLIENT_ID/JIRA_CLIENT_SECRET e JIRA_REDIRECT_URI/JIRA_REDIRECT_URL"
            )
        data = resp_form.json()
        if not data.get("access_token"):
            logger.error("Jira OAuth token exchange missing access_token (form)")
            raise HTTPException(status_code=400, detail="Não foi possível obter access_token")
        logger.info("Jira OAuth token exchange success (form)")
        return data
    data = resp.json()
    if not data.get("access_token"):
        logger.error("Jira OAuth token exchange missing access_token")
        raise HTTPException(status_code=400, detail="Não foi possível obter access_token")
    logger.info("Jira OAuth token exchange success")
    return data

def _get_userinfo(access_token: str) -> Dict[str, Any]:
    url1 = "https://api.atlassian.com/oauth/userinfo"
    resp1 = requests.get(url1, headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"})
    if resp1.status_code < 400:
        d = resp1.json() or {}
        return d if isinstance(d, dict) else {}
    url2 = "https://api.atlassian.com/me"
    resp2 = requests.get(url2, headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"})
    if resp2.status_code >= 400:
        return {}
    data = resp2.json() or {}
    if not isinstance(data, dict):
        return {}
    acct = data.get("account_id") or data.get("accountId")
    email = data.get("email") or data.get("emailAddress")
    return {"sub": acct, "email": email}

def _get_accessible_resources(access_token: str) -> List[Dict[str, Any]]:
    resp = requests.get(
        ATLASSIAN_RESOURCES_URL,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
    )
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    resources = resp.json()
    return resources if isinstance(resources, list) else []

def _select_jira_resource(resources: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Preferir recursos Jira (por resourceType ou nome) e escopos relevantes
    jira_resources = [
        r for r in resources
        if str(r.get("resourceType", "")).lower() == "jira" or "jira" in str(r.get("name", "")).lower()
    ]
    candidates = jira_resources or resources
    if not candidates:
        raise HTTPException(status_code=400, detail="Nenhum recurso acessível encontrado para Jira")

    for r in candidates:
        scopes = r.get("scopes", []) or []
        if (
            "read:project:jira" in scopes
            or "read:issue:jira" in scopes
            or any(s.startswith("read:jira") or s.startswith("write:jira") for s in scopes)
        ):
            return r
    return candidates[0]


# Seção: Endpoints Jira OAuth
@router.post("/jira/oauth/exchange")
async def jira_oauth_exchange(payload: JiraOAuthExchangePayload, current_user: dict = Depends(get_current_user)):
    """Trocar authorization code do Jira por tokens e salvar credenciais OAuth."""
    code = payload.code
    redirect_env = payload.redirect_uri or os.getenv("JIRA_REDIRECT_URI") or os.getenv("JIRA_REDIRECT_URL")
    redirect_uri = (redirect_env or "").replace("`", "").strip()
    if not code or not redirect_uri:
        raise HTTPException(status_code=400, detail="code e redirect_uri são obrigatórios")

    tokens = _exchange_code_for_token(code, redirect_uri)
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = int(tokens.get("expires_in") or 0)

    resources = _get_accessible_resources(access_token)
    selected = _select_jira_resource(resources)

    cloud_id = selected.get("id")
    site_url = selected.get("url")
    selected_scopes = selected.get("scopes", []) or []
    if not cloud_id:
        raise HTTPException(status_code=400, detail="Não foi possível determinar o cloud_id do Jira")

    info = _get_userinfo(access_token)
    user_email = info.get("email")
    user_account_id = info.get("sub")
    storage = IntegrationStorage(provider="jira")
    await storage.save(
        current_user["id"],
        {
            "oauth": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": expires_in,
            "obtained_at": int(time.time()),
            "cloud_id": cloud_id,
            "scopes": selected_scopes,
            "site_url": site_url,
            "user_email": user_email,
            "user_account_id": user_account_id,
        },
    )
    logger.info(f"Jira OAuth connected cloud_id={cloud_id} site_url={site_url} user_account_id={user_account_id}")
    return {"message": "Jira conectado via OAuth", "cloud_id": cloud_id, "scopes": selected_scopes, "site_url": site_url, "user_email": user_email, "user_account_id": user_account_id}


@router.get("/{provider}/targets")
async def list_targets(provider: str, current_user: dict = Depends(get_current_user)):
    """Listar alvos genéricos do provedor (boards/projetos)."""
    service = get_integration(provider)
    try:
        boards = await service.get_boards(current_user["id"])  # type: ignore
        return {"boards": boards}
    except NotImplementedError:
        try:
            projects = await service.get_projects(current_user["id"])  # type: ignore
            return {"projects": projects}
        except NotImplementedError:
            raise HTTPException(status_code=400, detail="Provider não possui targets padronizados")

@router.get("/trello/boards/{board_id}/lists")
async def trello_lists(board_id: str, current_user: dict = Depends(get_current_user)):
    """Listar listas do Trello para um board (endpoint de conveniência)."""
    service = get_integration("trello")
    lists = await service.get_lists(current_user["id"], board_id)  # type: ignore
    return {"lists": lists}

@router.get("/trello/boards/{board_id}/members")
async def trello_members(board_id: str, current_user: dict = Depends(get_current_user)):
    """Listar membros do Trello associados a um board."""
    service = get_integration("trello")
    members = await service.get_members(current_user["id"], board_id)  # type: ignore
    return {"members": members}


@router.get("/jira/projects/{project_key}/users")
async def jira_assignable_users(project_key: str, current_user: dict = Depends(get_current_user)):
    """Listar usuários atribuíveis em um projeto do Jira."""
    service = get_integration("jira")
    users = await service.get_assignable_users(current_user["id"], project_key)  # type: ignore
    return {"users": users}

@router.get("/jira/projects/{project_key}/roles")
async def jira_project_roles(project_key: str, current_user: dict = Depends(get_current_user)):
    """Listar roles de um projeto Jira (id e nome)."""
    service = get_integration("jira")
    roles = await service.get_project_roles(current_user["id"], project_key)  # type: ignore
    return {"roles": roles}

@router.get("/jira/projects/{project_key}/roles/{role_id}/actors")
async def jira_project_role_actors(project_key: str, role_id: str, current_user: dict = Depends(get_current_user)):
    """Listar usuários (actors do tipo user) de um role do projeto Jira."""
    service = get_integration("jira")
    users = await service.get_project_role_actors(current_user["id"], project_key, role_id)  # type: ignore
    return {"users": users}

@router.post("/{provider}/tasks")
async def create_task(provider: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Criar uma tarefa/card no container alvo do provedor.

    Payload esperado: {"target_id": "...", "task": { title, description?, priority?, assignee?, due_date? }}
    """
    service = get_integration(provider)
    target_id = payload.get("target_id")
    task = payload.get("task")
    if not target_id or not isinstance(task, dict):
        raise HTTPException(status_code=400, detail="Payload inválido: target_id e task são obrigatórios")
    result = await service.create_task(current_user["id"], target_id, task)
    return {"result": result}
