"""
Authentication routes for the Sintask API
"""
from fastapi import APIRouter, HTTPException, Depends

from ..models import UserRegister, UserLogin, User, TrelloConfig, AuthResponse, MessageResponse
from ..core.auth import hash_password, verify_password, create_access_token, get_current_user
from ..core.database import database, users_table

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    
    # Check if email already exists
    query = users_table.select().where(users_table.c.email == user_data.email)
    existing_user = await database.fetch_one(query)
    
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
    
    query = users_table.select().where(users_table.c.email == credentials.email)
    user = await database.fetch_one(query)
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    token = create_access_token(user.id)
    
    return AuthResponse(
        token=token,
        user=User(
            id=user.id,
            email=user.email,
            name=user.name,
            trello_api_key=user.trello_api_key,
            trello_token=user.trello_token,
            trello_list_id=user.trello_list_id
        )
    )


@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user data"""
    return User(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        trello_api_key=current_user["trello_api_key"],
        trello_token=current_user["trello_token"],
        trello_list_id=current_user["trello_list_id"]
    )


@router.put("/trello-config", response_model=MessageResponse)
async def update_trello_config(
    config: TrelloConfig,
    current_user: dict = Depends(get_current_user)
):
    """Update Trello configuration for current user"""
    
    query = users_table.update().where(
        users_table.c.id == current_user["id"]
    ).values(
        trello_api_key=config.trello_api_key,
        trello_token=config.trello_token,
        trello_list_id=config.trello_list_id
    )
    
    await database.execute(query)
    
    return MessageResponse(message="Configurações do Trello atualizadas")