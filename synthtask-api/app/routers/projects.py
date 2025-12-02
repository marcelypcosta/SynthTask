from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime

from ..core.auth import get_current_user
from ..core.database import database, projects_table

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("")
async def list_projects(current_user: dict = Depends(get_current_user)):
    query = projects_table.select().where(projects_table.c.user_id == current_user["id"]).order_by(projects_table.c.created_at.desc())
    rows = await database.fetch_all(query)
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "provider": r["provider"],
            "target_id": r["target_id"],
            "target_name": r["target_name"],
            "created_at": (r["created_at"].isoformat() if isinstance(r["created_at"], datetime) else str(r["created_at"])),
        }
        for r in rows
    ]

@router.post("")
async def create_project(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    name: str = str(payload.get("name", "")).strip()
    provider: str = str(payload.get("provider", "")).strip().lower()
    target_id: str = str(payload.get("target_id", "")).strip()
    target_name: Optional[str] = payload.get("target_name")

    if not name or not provider or not target_id:
        raise HTTPException(status_code=400, detail="Campos obrigatórios: name, provider, target_id")
    if provider not in ("trello", "jira"):
        raise HTTPException(status_code=400, detail="Provider inválido (use 'trello' ou 'jira')")

    dup_q = projects_table.select().where(
        (projects_table.c.user_id == current_user["id"]) &
        (projects_table.c.provider == provider) &
        (projects_table.c.target_id == target_id)
    )
    dup = await database.fetch_one(dup_q)
    if dup:
        raise HTTPException(status_code=409, detail="Já existe projeto associado a este destino")

    insert = projects_table.insert().values(
        user_id=current_user["id"],
        name=name,
        provider=provider,
        target_id=target_id,
        target_name=target_name,
    )
    project_id = await database.execute(insert)

    # Buscar registro recém-criado para montar resposta
    query = projects_table.select().where(projects_table.c.id == project_id)
    r = await database.fetch_one(query)
    return {
        "id": r["id"],
        "name": r["name"],
        "provider": r["provider"],
        "target_id": r["target_id"],
        "target_name": r["target_name"],
        "created_at": (r["created_at"].isoformat() if isinstance(r["created_at"], datetime) else str(r["created_at"])),
    }

@router.get("/{project_id}")
async def get_project(project_id: int, current_user: dict = Depends(get_current_user)):
    query = projects_table.select().where(
        (projects_table.c.id == project_id) & (projects_table.c.user_id == current_user["id"]) 
    )
    r = await database.fetch_one(query)
    if not r:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return {
        "id": r["id"],
        "name": r["name"],
        "provider": r["provider"],
        "target_id": r["target_id"],
        "target_name": r["target_name"],
        "created_at": (r["created_at"].isoformat() if isinstance(r["created_at"], datetime) else str(r["created_at"])),
    }

@router.put("/{project_id}")
async def update_project(project_id: int, payload: dict, current_user: dict = Depends(get_current_user)):
    q = projects_table.select().where(
        (projects_table.c.id == project_id) & (projects_table.c.user_id == current_user["id"]) 
    )
    existing = await database.fetch_one(q)
    if not existing:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    target_id = str(payload.get("target_id", "")).strip()
    target_name = payload.get("target_name")
    provider = payload.get("provider")

    values = {}
    if target_id:
        values["target_id"] = target_id
    if target_name is not None:
        values["target_name"] = target_name
    if provider:
        provider = str(provider).strip().lower()
        if provider not in ("trello", "jira"):
            raise HTTPException(status_code=400, detail="Provider inválido")
        values["provider"] = provider

    if not values:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

    if "target_id" in values or "provider" in values:
        new_provider = values.get("provider", existing["provider"])
        new_target_id = values.get("target_id", existing["target_id"])
        dup_q = projects_table.select().where(
            (projects_table.c.user_id == current_user["id"]) &
            (projects_table.c.provider == new_provider) &
            (projects_table.c.target_id == new_target_id) &
            (projects_table.c.id != project_id)
        )
        dup = await database.fetch_one(dup_q)
        if dup:
            raise HTTPException(status_code=409, detail="Destino já utilizado em outro projeto")

    await database.execute(
        projects_table.update().where(projects_table.c.id == project_id).values(**values)
    )

    r = await database.fetch_one(q)
    return {
        "id": r["id"],
        "name": r["name"],
        "provider": r["provider"],
        "target_id": r["target_id"],
        "target_name": r["target_name"],
        "created_at": (r["created_at"].isoformat() if isinstance(r["created_at"], datetime) else str(r["created_at"])),
    }

@router.delete("/{project_id}")
async def delete_project(project_id: int, current_user: dict = Depends(get_current_user)):
    q = projects_table.select().where(
        (projects_table.c.id == project_id) & (projects_table.c.user_id == current_user["id"])
    )
    existing = await database.fetch_one(q)
    if not existing:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    await database.execute(
        projects_table.delete().where(projects_table.c.id == project_id)
    )
    return {"message": "Projeto removido"}