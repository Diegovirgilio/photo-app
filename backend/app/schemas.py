from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

"""
FUNDAMENTO: Data Validation com Pydantic

MOTIVO:
- Valida dados automaticamente (ex: email válido)
- Gera documentação automática (Swagger)
- Serializa/deserializa JSON <-> Python
- Separa modelo do banco (SQLAlchemy) do modelo da API (Pydantic)
"""

# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)

class UserCreate(UserBase):
    """Schema para criar usuário"""
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    """Schema para login"""
    email: EmailStr
    password: str

class UserResponse(UserBase):
    """
    Schema para retornar usuário (sem senha!)
    
    MOTIVO: NUNCA retornar password_hash na API
    """
    id: int
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite criar de objetos SQLAlchemy


# ==================== PHOTO SCHEMAS ====================

class PhotoBase(BaseModel):
    pass

class PhotoCreate(BaseModel):
    """
    Schema vazio pois upload será multipart/form-data
    A foto virá como UploadFile do FastAPI
    """
    pass

class PhotoResponse(PhotoBase):
    """Schema para retornar foto"""
    id: int
    user_id: int
    url: str
    thumbnail_url: str
    likes_count: int
    created_at: datetime
    owner: UserResponse  # Nested: inclui dados do dono
    
    class Config:
        from_attributes = True

class PhotoListResponse(BaseModel):
    """Schema para lista de fotos com metadados"""
    total: int
    photos: list[PhotoResponse]


# ==================== LIKE SCHEMAS ====================

class LikeCreate(BaseModel):
    photo_id: int = Field(..., gt=0)

class LikeResponse(BaseModel):
    id: int
    photo_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== AUTH SCHEMAS ====================

class Token(BaseModel):
    """
    Schema para retornar JWT
    
    FUNDAMENTO: OAuth2 Password Bearer
    """
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """
    Dados decodificados do JWT
    
    MOTIVO: Validar estrutura do token
    """
    user_id: Optional[int] = None
    is_admin: Optional[bool] = False


# ==================== ADMIN SCHEMAS ====================

class UserUpdate(BaseModel):
    """Schema para admin atualizar usuário"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None

class PhotoDelete(BaseModel):
    """Schema para confirmar deleção"""
    message: str
    photo_id: int


# ==================== MESSAGE SCHEMAS ====================

class MessageCreate(BaseModel):
    """Schema para criar mensagem"""
    receiver_id: int = Field(..., gt=0)
    content: str = Field(..., min_length=1, max_length=1000)

class MessageResponse(BaseModel):
    """Schema para retornar mensagem"""
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender: UserResponse
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    """
    Schema para listar conversas
    
    MOTIVO:
    - Mostra última mensagem
    - Conta mensagens não lidas
    - Info do outro usuário
    """
    other_user: UserResponse
    last_message: MessageResponse
    unread_count: int
