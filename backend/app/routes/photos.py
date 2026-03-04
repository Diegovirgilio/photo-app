from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import User, Photo, Like
from app.schemas import PhotoResponse, PhotoListResponse, LikeCreate, LikeResponse
from app.auth import get_current_user
from app.utils import (
    validate_image,
    compress_image,
    create_thumbnail,
    generate_filename
)
from app.storage import storage

router = APIRouter(prefix="/api/photos", tags=["Photos"])

"""
FUNDAMENTO: Rotas de Fotos

ESTRUTURA:
POST /api/photos/upload - Upload de foto
GET /api/photos - Listar todas as fotos (galeria pública)
GET /api/photos/my - Minhas fotos
POST /api/photos/like - Dar like
DELETE /api/photos/like/{photo_id} - Remover like
"""

@router.post("/upload", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload de foto
    
    FUNDAMENTO: Multipart Form Data + File Processing
    
    MOTIVO:
    - UploadFile do FastAPI lida com streaming (memória eficiente)
    - Validação antes de processar
    - Compressão automática
    - Limite de 5 fotos por usuário
    
    FLUXO:
    1. Valida se usuário tem menos de 5 fotos
    2. Valida arquivo (tamanho, formato)
    3. Comprime imagem original
    4. Cria thumbnail
    5. Upload para Supabase (original + thumbnail)
    6. Salva URLs no banco
    7. Retorna dados da foto
    
    EXEMPLO REQUEST (multipart/form-data):
    POST /api/photos/upload
    Authorization: Bearer <token>
    Content-Type: multipart/form-data
    
    file: [arquivo.jpg]
    
    EXEMPLO RESPONSE:
    {
        "id": 1,
        "user_id": 1,
        "url": "https://...supabase.co/.../abc123.jpg",
        "thumbnail_url": "https://...supabase.co/.../abc123.jpg",
        "likes_count": 0,
        "created_at": "2024-01-15T10:30:00",
        "owner": {...}
    }
    """
    # Verifica limite de 5 fotos
    photo_count = db.query(Photo).filter(Photo.user_id == current_user.id).count()
    if photo_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limite de 5 fotos atingido. Delete uma foto para enviar outra."
        )
    
    # Lê arquivo
    file_bytes = await file.read()
    
    # Valida imagem
    is_valid, message = validate_image(file_bytes)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Gera nome único
    filename = generate_filename(file.filename)
    
    try:
        # Comprime imagem original
        compressed_bytes = compress_image(file_bytes, quality=85)
        
        # Cria thumbnail
        thumbnail_bytes = create_thumbnail(file_bytes, size=(300, 300))
        
        # Upload imagem original
        success, url_or_error = storage.upload_file(compressed_bytes, filename, folder="photos")
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro no upload: {url_or_error}"
            )
        photo_url = url_or_error
        
        # Upload thumbnail
        success, url_or_error = storage.upload_file(thumbnail_bytes, filename, folder="thumbnails")
        if not success:
            # Se falhar, deleta a foto original
            storage.delete_file(photo_url)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro no upload do thumbnail: {url_or_error}"
            )
        thumbnail_url = url_or_error
        
        # Salva no banco
        new_photo = Photo(
            user_id=current_user.id,
            url=photo_url,
            thumbnail_url=thumbnail_url,
            likes_count=0
        )
        
        db.add(new_photo)
        db.commit()
        db.refresh(new_photo)
        
        return new_photo
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar foto: {str(e)}"
        )


@router.get("/", response_model=PhotoListResponse)
def get_all_photos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as fotos (galeria pública)
    
    FUNDAMENTO: Paginação + Ordenação
    
    MOTIVO:
    - skip/limit = paginação (evita carregar 1000 fotos de uma vez)
    - Ordenação por data (mais recentes primeiro)
    - Público: qualquer usuário logado vê todas as fotos
    
    EXEMPLO REQUEST:
    GET /api/photos?skip=0&limit=50
    Authorization: Bearer <token>
    
    EXEMPLO RESPONSE:
    {
        "total": 123,
        "photos": [...]
    }
    """
    # Total de fotos
    total = db.query(Photo).count()
    
    # Fotos paginadas (mais recentes primeiro)
    photos = db.query(Photo)\
        .order_by(desc(Photo.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return {
        "total": total,
        "photos": photos
    }


@router.get("/my", response_model=list[PhotoResponse])
def get_my_photos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista fotos do usuário logado
    
    MOTIVO:
    - Usuário vê suas próprias fotos separadas
    - Pode verificar quantas fotos tem (limite de 5)
    
    EXEMPLO REQUEST:
    GET /api/photos/my
    Authorization: Bearer <token>
    """
    photos = db.query(Photo)\
        .filter(Photo.user_id == current_user.id)\
        .order_by(desc(Photo.created_at))\
        .all()
    
    return photos


@router.get("/user/{user_id}", response_model=list[PhotoResponse])
def get_user_photos(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista fotos de um usuário específico
    
    FUNDAMENTO: Public user profile
    
    MOTIVO:
    - Qualquer usuário logado pode ver fotos de outros
    - Usado na galeria agrupada por usuário
    
    EXEMPLO REQUEST:
    GET /api/photos/user/123
    Authorization: Bearer <token>
    """
    # Verifica se usuário existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    photos = db.query(Photo)\
        .filter(Photo.user_id == user_id)\
        .order_by(desc(Photo.created_at))\
        .all()
    
    return photos


@router.post("/like", response_model=LikeResponse, status_code=status.HTTP_201_CREATED)
def like_photo(
    like_data: LikeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dar like em foto
    
    FUNDAMENTO: Transação atômica
    
    MOTIVO:
    - Cria registro de like
    - Incrementa contador de likes na foto
    - Tudo ou nada (transação)
    
    FLUXO:
    1. Verifica se foto existe
    2. Verifica se já deu like
    3. Cria registro de like
    4. Incrementa likes_count
    5. Commit (se tudo OK)
    
    EXEMPLO REQUEST:
    POST /api/photos/like
    Authorization: Bearer <token>
    {
        "photo_id": 123
    }
    """
    # Verifica se foto existe
    photo = db.query(Photo).filter(Photo.id == like_data.photo_id).first()
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto não encontrada"
        )
    
    # Verifica se já deu like
    existing_like = db.query(Like).filter(
        Like.photo_id == like_data.photo_id,
        Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já deu like nesta foto"
        )
    
    # Cria like
    new_like = Like(
        photo_id=like_data.photo_id,
        user_id=current_user.id
    )
    
    # Incrementa contador
    photo.likes_count += 1
    
    db.add(new_like)
    db.commit()
    db.refresh(new_like)
    
    return new_like


@router.delete("/like/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlike_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remover like de foto
    
    FUNDAMENTO: Operação idempotente
    
    MOTIVO:
    - DELETE /like/{photo_id} remove like
    - Se não existe, retorna 404
    - Decrementa contador
    
    EXEMPLO REQUEST:
    DELETE /api/photos/like/123
    Authorization: Bearer <token>
    """
    # Busca like
    like = db.query(Like).filter(
        Like.photo_id == photo_id,
        Like.user_id == current_user.id
    ).first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like não encontrado"
        )
    
    # Busca foto para decrementar
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if photo:
        photo.likes_count = max(0, photo.likes_count - 1)  # Nunca negativo
    
    db.delete(like)
    db.commit()
    
    return None


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_photo(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar própria foto
    
    FUNDAMENTO: Ownership validation
    
    MOTIVO:
    - Usuário pode deletar APENAS suas próprias fotos
    - Admin pode deletar qualquer foto (rota diferente em /admin)
    - Remove do storage e do banco
    
    EXEMPLO REQUEST:
    DELETE /api/photos/123
    Authorization: Bearer <token>
    """
    # Busca foto
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    
    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto não encontrada"
        )
    
    # Verifica se é o dono
    if photo.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode deletar suas próprias fotos"
        )
    
    # Deleta arquivos do storage
    try:
        storage.delete_file(photo.url)
        storage.delete_file(photo.thumbnail_url)
    except Exception as e:
        print(f"Erro ao deletar arquivos: {str(e)}")
    
    # Deleta do banco (cascade deleta likes automaticamente)
    db.delete(photo)
    db.commit()
    
    return None
