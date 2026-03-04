from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Photo
from app.schemas import UserResponse, UserUpdate, PhotoDelete
from app.auth import get_current_admin
from app.storage import storage

router = APIRouter(prefix="/api/admin", tags=["Admin"])

"""
FUNDAMENTO: Rotas Administrativas

ESTRUTURA:
GET /api/admin/users - Listar todos os usuários
PUT /api/admin/users/{user_id} - Atualizar usuário
DELETE /api/admin/photos/{photo_id} - Deletar foto
"""

@router.get("/users", response_model=list[UserResponse])
def list_all_users(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Lista todos os usuários
    
    FUNDAMENTO: Autorização de Admin
    
    MOTIVO:
    - Depends(get_current_admin) valida se usuário é admin
    - Se não for admin, retorna 403 Forbidden
    - Admin pode ver todos os usuários
    
    EXEMPLO REQUEST:
    GET /api/admin/users?skip=0&limit=100
    Authorization: Bearer <admin_token>
    
    EXEMPLO RESPONSE:
    [
        {
            "id": 1,
            "email": "user@example.com",
            "name": "João Silva",
            "is_admin": false,
            "created_at": "2024-01-15T10:30:00"
        },
        ...
    ]
    """
    users = db.query(User)\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return users


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza dados de usuário
    
    FUNDAMENTO: Partial Update (PATCH-like)
    
    MOTIVO:
    - Admin pode alterar nome, email, ou tornar alguém admin
    - Apenas campos enviados são atualizados (exclude_unset=True)
    - Não pode alterar senha (segurança)
    
    EXEMPLO REQUEST:
    PUT /api/admin/users/123
    Authorization: Bearer <admin_token>
    {
        "is_admin": true
    }
    
    EXEMPLO RESPONSE:
    {
        "id": 123,
        "email": "user@example.com",
        "name": "João Silva",
        "is_admin": true,
        "created_at": "2024-01-15T10:30:00"
    }
    """
    # Busca usuário
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualiza apenas campos enviados
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/photos/{photo_id}", response_model=PhotoDelete)
def delete_photo(
    photo_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta foto (apenas admin)
    
    FUNDAMENTO: Cascade Delete + Storage Cleanup
    
    MOTIVO:
    - Admin pode deletar qualquer foto
    - Deleta do banco E do Supabase Storage
    - Cascade: likes relacionados são deletados automaticamente
    
    FLUXO:
    1. Busca foto no banco
    2. Deleta arquivos do Supabase (original + thumbnail)
    3. Deleta registro do banco (cascade deleta likes)
    4. Commit
    
    EXEMPLO REQUEST:
    DELETE /api/admin/photos/123
    Authorization: Bearer <admin_token>
    
    EXEMPLO RESPONSE:
    {
        "message": "Foto deletada com sucesso",
        "photo_id": 123
    }
    """
    # Busca foto
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto não encontrada"
        )
    
    # Deleta arquivos do Supabase
    try:
        # Deleta foto original
        storage.delete_file(photo.url)
        
        # Deleta thumbnail
        storage.delete_file(photo.thumbnail_url)
    
    except Exception as e:
        # Log do erro mas continua (já que pode ter sido deletado manualmente)
        print(f"Erro ao deletar arquivos: {str(e)}")
    
    # Deleta do banco (cascade deleta likes automaticamente)
    db.delete(photo)
    db.commit()
    
    return {
        "message": "Foto deletada com sucesso",
        "photo_id": photo_id
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta usuário (apenas admin)
    
    FUNDAMENTO: Cascade Delete Completo
    
    MOTIVO:
    - Deleta usuário, suas fotos, e likes
    - Remove arquivos do storage também
    - Previne auto-deleção (admin não pode deletar a si mesmo)
    
    FLUXO:
    1. Verifica se não é auto-deleção
    2. Busca usuário e suas fotos
    3. Deleta todas as fotos do storage
    4. Deleta usuário do banco (cascade: fotos e likes)
    
    EXEMPLO REQUEST:
    DELETE /api/admin/users/123
    Authorization: Bearer <admin_token>
    """
    # Previne auto-deleção
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deletar sua própria conta"
        )
    
    # Busca usuário
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Busca fotos do usuário para deletar do storage
    user_photos = db.query(Photo).filter(Photo.user_id == user_id).all()
    
    # Deleta fotos do storage
    for photo in user_photos:
        try:
            storage.delete_file(photo.url)
            storage.delete_file(photo.thumbnail_url)
        except Exception as e:
            print(f"Erro ao deletar arquivo: {str(e)}")
    
    # Deleta usuário (cascade deleta fotos e likes)
    db.delete(user)
    db.commit()
    
    return None
