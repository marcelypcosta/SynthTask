"""
Rotas de autenticação para a Sintask API
"""
from fastapi import APIRouter, HTTPException, Depends

from ..models import UserRegister, UserLogin, User, AuthResponse, MessageResponse
from pydantic import BaseModel
from ..core.auth import hash_password, verify_password, create_access_token, get_current_user
from ..core.database import database, users_table
from ..core.utils import (
    get_user_by_email, get_user_by_id, format_user_response,
    update_user_field
)
from app.modules.integrations.registry import get_integration

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class TrelloConfigPayload(BaseModel):
    trello_api_key: str
    trello_token: str
    trello_list_id: str


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    
    # Check if email already exists
    existing_user = await get_user_by_email(user_data.email)
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create user
    password_hash = hash_password(user_data.password)
    query = users_table.insert().values(
        email=user_data.email,
        password_hash=password_hash,
        name=user_data.name
    )
    user_id = await database.execute(query)
    
    token = create_access_token(user_id)
    
    return AuthResponse(
        token=token,
        user=User(
            id=user_id,
            email=user_data.email,
            name=user_data.name
        )
    )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login user"""
    
    user = await get_user_by_email(credentials.email)
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    token = create_access_token(user.id)
    
    return AuthResponse(
        token=token,
        user=format_user_response(user)
    )


@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Obter os dados do usuário autenticado atual"""
    return format_user_response(current_user)


@router.put("/trello-config", response_model=MessageResponse)
async def update_trello_config(
    config: TrelloConfigPayload,
    current_user: dict = Depends(get_current_user)
):
    """Update Trello configuration for current user"""
    # Salva nas credenciais do módulo de integrações (apenas storage novo)
    service = get_integration("trello")
    await service.save_credentials(current_user["id"], {
        "api_key": config.trello_api_key,
        "token": config.trello_token,
        "list_id": config.trello_list_id,
    })

    return MessageResponse(message="Configurações do Trello atualizadas")


@router.get('/trello-lists')
async def get_trello_lists(current_user: dict = Depends(get_current_user)):
    """Retorna boards e listas usando o novo adapter Trello com credenciais armazenadas."""
    service = get_integration("trello")
    try:
        # Garante que há credenciais
        await service.get_user_credentials(current_user["id"])  # levanta erro se ausentes

        boards = await service.get_boards(current_user["id"])  # type: ignore
        result = {"boards": []}
        for b in boards:
            lists = await service.get_lists(current_user["id"], b["id"])  # type: ignore
            result["boards"].append({
                "id": b["id"],
                "name": b.get("name"),
                "lists": [{"id": l["id"], "name": l.get("name")} for l in lists]
            })
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
