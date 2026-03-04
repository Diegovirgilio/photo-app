from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, Token
from app.auth import (
    hash_password,
    authenticate_user,
    create_access_token,
    get_current_user
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

"""
FUNDAMENTO: Rotas de Autenticação

ESTRUTURA:
POST /api/auth/register - Criar conta
POST /api/auth/login - Login (retorna JWT)
GET /api/auth/me - Dados do usuário logado
"""

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registra novo usuário
    
    FUNDAMENTO: Validação + Hash de senha
    
    FLUXO:
    1. Pydantic valida email e senha (mínimo 6 caracteres)
    2. Verifica se email já existe
    3. Faz hash da senha com bcrypt
    4. Salva no banco
    5. Retorna dados do usuário (sem senha)
    
    EXEMPLO REQUEST:
    POST /api/auth/register
    {
        "email": "user@example.com",
        "name": "João Silva",
        "password": "senha123"
    }
    
    EXEMPLO RESPONSE:
    {
        "id": 1,
        "email": "user@example.com",
        "name": "João Silva",
        "is_admin": false,
        "created_at": "2024-01-15T10:30:00"
    }
    """
    # Verifica se email já existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Cria novo usuário
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        is_admin=False  # Usuários normais não são admin
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login de usuário
    
    FUNDAMENTO: OAuth2 Password Flow
    
    MOTIVO:
    - Padrão OAuth2 (compatível com Swagger UI)
    - form_data.username recebe o email
    - form_data.password recebe a senha
    
    FLUXO:
    1. Valida credenciais (email + senha)
    2. Se válido, cria JWT com user_id e is_admin
    3. Token expira em 7 dias
    4. Cliente armazena token e envia em cada request
    
    EXEMPLO REQUEST (form-data):
    username=user@example.com
    password=senha123
    
    EXEMPLO RESPONSE:
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer"
    }
    
    COMO USAR O TOKEN:
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    """
    # form_data.username contém o email (padrão OAuth2)
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Cria token com dados do usuário
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),  # "sub" = subject (padrão JWT)
            "is_admin": user.is_admin
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Retorna informações do usuário logado
    
    FUNDAMENTO: JWT Validation
    
    MOTIVO:
    - Frontend pode buscar dados do usuário com token
    - Valida se token ainda é válido
    - Útil após login para pegar dados atualizados
    
    EXEMPLO REQUEST:
    GET /api/auth/me
    Authorization: Bearer <token>
    
    EXEMPLO RESPONSE:
    {
        "id": 1,
        "email": "user@example.com",
        "name": "João Silva",
        "is_admin": false,
        "created_at": "2024-01-15T10:30:00"
    }
    """
    return current_user
