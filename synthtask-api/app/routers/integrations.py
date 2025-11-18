# Módulo: routers/integrations.py
# Seção: Imports e modelos
"""
Router de integrações que fornece endpoints genéricos para provedores plug-and-play.
"""
from fastapi import APIRouter, Depends, HTTPException
import os
import time
import requests
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.modules.integrations.registry import get_integration
from app.modules.integrations.storage import IntegrationStorage

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])

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
    """Verifica se há credenciais armazenadas para o provedor (sem chamar APIs externas)."""
    service = get_integration(provider)
    try:
        creds = await service.get_user_credentials(current_user["id"])
        return {"connected": True, "provider": provider, "oauth": bool(creds.get("oauth"))}
    except Exception:
        # Sem credenciais ou inválidas
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
    client_id = os.getenv("JIRA_CLIENT_ID")
    client_secret = os.getenv("JIRA_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Configuração JIRA_CLIENT_ID/JIRA_CLIENT_SECRET ausente")

    payload = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    resp = requests.post(ATLASSIAN_TOKEN_URL, json=payload, headers={"Content-Type": "application/json"})
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    if not data.get("access_token"):
        raise HTTPException(status_code=400, detail="Não foi possível obter access_token")
    return data

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
    redirect_uri = payload.redirect_uri or os.getenv("JIRA_REDIRECT_URI")
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
        },
    )
    return {"message": "Jira conectado via OAuth", "cloud_id": cloud_id, "scopes": selected_scopes, "site_url": site_url}


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