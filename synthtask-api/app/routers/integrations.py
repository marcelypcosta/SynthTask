"""
Router de integrações que fornece endpoints genéricos para provedores plug-and-play.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.core.auth import get_current_user
from app.modules.integrations.registry import get_integration

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


@router.post("/{provider}/connect")
async def connect(provider: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Salvar credenciais do usuário para um provedor (ex.: Trello, Jira)."""
    service = get_integration(provider)
    await service.save_credentials(current_user["id"], payload)
    return {"message": f"Credenciais salvas para {provider}"}


@router.get("/{provider}/targets")
async def list_targets(provider: str, current_user: dict = Depends(get_current_user)):
    """Listar alvos genéricos do provedor (boards/projetos)."""
    service = get_integration(provider)
    # Try boards then projects; providers can override
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