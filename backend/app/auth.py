from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import TokenData

"""
FUNDAMENTO: Autenticação JWT (JSON Web Token)

MOTIVO:
- Stateless: servidor não precisa guardar sessões
- Token contém todas as informações necessárias
- Expira automaticamente (segurança)
- Facilita escalabilidade (múltiplos servidores)
"""

# Context para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme para extrair token do header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def hash_password(password: str) -> str:
    """
    FUNDAMENTO: Hashing com bcrypt
    
    MOTIVO:
    - NUNCA salvar senha em texto puro
    - bcrypt adiciona "salt" automático (previne rainbow tables)
    - Custo computacional alto (dificulta brute force)
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se senha digitada bate com hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    FUNDAMENTO: Criação de JWT
    
    MOTIVO:
    - Token contém: user_id, is_admin, tempo de expiração
    - Assinado com SECRET_KEY (só servidor pode criar/validar)
    - Cliente não pode alterar sem invalidar assinatura
    
    ESTRUTURA DO TOKEN:
    {
        "sub": "user_id",  # subject (padrão JWT)
        "is_admin": true,
        "exp": 1234567890  # timestamp de expiração
    }
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Codifica usando algoritmo HS256 e SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Autentica usuário verificando email e senha
    
    FLUXO:
    1. Busca usuário por email
    2. Se não existe, retorna None
    3. Se existe, verifica hash da senha
    4. Retorna usuário ou None
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    FUNDAMENTO: Dependency Injection + JWT Validation
    
    MOTIVO:
    - Cada rota protegida usa: current_user = Depends(get_current_user)
    - Valida token automaticamente
    - Retorna usuário ou HTTPException 401
    
    USO:
    @app.get("/me")
    def get_me(current_user: User = Depends(get_current_user)):
        return current_user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        
        token_data = TokenData(
            user_id=int(user_id),
            is_admin=payload.get("is_admin", False)
        )
    except JWTError:
        raise credentials_exception
    
    # Busca usuário no banco
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    FUNDAMENTO: Autorização (diferente de Autenticação)
    
    MOTIVO:
    - Autenticação = quem você é (get_current_user)
    - Autorização = o que você pode fazer (is_admin)
    - Rotas de admin usam: admin = Depends(get_current_admin)
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão de administrador"
        )
    return current_user
