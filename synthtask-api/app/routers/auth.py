"""
Authentication routes for the Sintask API
"""
from fastapi import APIRouter, HTTPException, Depends

from ..models import UserRegister, UserLogin, User, TrelloConfig, AuthResponse, MessageResponse
from ..core.auth import hash_password, verify_password, create_access_token, get_current_user
from ..core.database import database, users_table
from ..core.utils import (
    get_user_by_email, get_user_by_id, format_user_response,
    update_user_field, validate_trello_config
)
from ..services.trello_service import trello_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


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
    """Get current authenticated user data"""
    return format_user_response(current_user)


@router.put("/trello-config", response_model=MessageResponse)
async def update_trello_config(
    config: TrelloConfig,
    current_user: dict = Depends(get_current_user)
):
    """Update Trello configuration for current user"""
    
    await update_user_field(
        current_user["id"],
        trello_api_key=config.trello_api_key,
        trello_token=config.trello_token,
        trello_list_id=config.trello_list_id
    )
    
    return MessageResponse(message="Configurações do Trello atualizadas")


@router.get('/trello-lists')
async def get_trello_lists(current_user: dict = Depends(get_current_user)):
    """Return boards and lists for the current user's stored Trello credentials."""
    if not validate_trello_config(current_user):
        raise HTTPException(status_code=400, detail="Configure suas credenciais do Trello primeiro")

    try:
        lists = trello_service.get_boards_and_lists(current_user["trello_api_key"], current_user["trello_token"])
        return lists
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))