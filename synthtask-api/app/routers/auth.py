"""
Rotas de autenticação
"""
from fastapi import APIRouter, HTTPException, Depends

from ..models import UserRegister, UserLogin, User, AuthResponse
from ..core.auth import hash_password, verify_password, create_access_token, get_current_user
from ..core.database import database, users_table
from ..core.utils import (
    get_user_by_email, format_user_response,
)

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
    """Obter os dados do usuário autenticado atual"""
    return format_user_response(current_user)
