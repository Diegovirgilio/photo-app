from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from typing import List

from app.database import get_db
from app.models import User, Message
from app.schemas import MessageCreate, MessageResponse, ConversationResponse, UserResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Messages"])

"""
FUNDAMENTO: Sistema de Chat Individual

ROTAS:
POST   /api/messages           - Enviar mensagem
GET    /api/messages/{user_id} - Ver conversa com usuário
GET    /api/messages/conversations - Listar conversas
PUT    /api/messages/{message_id}/read - Marcar como lida
"""

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enviar mensagem para outro usuário
    
    FUNDAMENTO: Direct Message
    
    MOTIVO:
    - Chat individual 1:1
    - Validação de destinatário
    - Não pode enviar para si mesmo
    
    EXEMPLO REQUEST:
    POST /api/messages
    {
        "receiver_id": 2,
        "content": "Oi, tudo bem?"
    }
    """
    # Verifica se destinatário existe
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Não pode enviar mensagem para si mesmo
    if message_data.receiver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode enviar mensagens para si mesmo"
        )
    
    # Cria mensagem
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        is_read=False
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message


@router.get("/{user_id}", response_model=List[MessageResponse])
def get_conversation(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buscar conversa com usuário específico
    
    FUNDAMENTO: Bi-directional Message Fetch
    
    MOTIVO:
    - Retorna TODAS as mensagens entre dois usuários
    - Ordenadas por data (mais antigas primeiro)
    - Marca mensagens recebidas como lidas automaticamente
    
    EXEMPLO REQUEST:
    GET /api/messages/2
    Authorization: Bearer <token>
    
    RETORNA: Todas as mensagens entre você e usuário #2
    """
    # Verifica se usuário existe
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Busca mensagens entre os dois usuários
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at).all()
    
    # Marcar mensagens recebidas como lidas
    for message in messages:
        if message.receiver_id == current_user.id and not message.is_read:
            message.is_read = True
    
    db.commit()
    
    return messages


@router.get("/conversations/list", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar todas as conversas do usuário
    
    FUNDAMENTO: Conversation List with Last Message
    
    MOTIVO:
    - Mostra lista de pessoas com quem conversou
    - Última mensagem de cada conversa
    - Contador de mensagens não lidas
    - Ordenado por data da última mensagem
    
    EXEMPLO RESPONSE:
    [
        {
            "other_user": {...},
            "last_message": {...},
            "unread_count": 3
        }
    ]
    """
    # Buscar todos os usuários com quem teve conversa
    conversations_query = db.query(
        Message.sender_id,
        Message.receiver_id
    ).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).distinct()
    
    # Extrair IDs dos outros usuários
    user_ids = set()
    for msg in conversations_query:
        if msg.sender_id != current_user.id:
            user_ids.add(msg.sender_id)
        if msg.receiver_id != current_user.id:
            user_ids.add(msg.receiver_id)
    
    conversations = []
    
    for user_id in user_ids:
        # Buscar última mensagem
        last_message = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
            )
        ).order_by(desc(Message.created_at)).first()
        
        if not last_message:
            continue
        
        # Contar mensagens não lidas (recebidas por current_user)
        unread_count = db.query(Message).filter(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()
        
        # Buscar info do outro usuário
        other_user = db.query(User).filter(User.id == user_id).first()
        
        conversations.append({
            "other_user": other_user,
            "last_message": last_message,
            "unread_count": unread_count
        })
    
    # Ordenar por data da última mensagem (mais recente primeiro)
    conversations.sort(key=lambda x: x["last_message"].created_at, reverse=True)
    
    return conversations


@router.put("/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar mensagem como lida
    
    MOTIVO:
    - Atualiza status de lida
    - Apenas receptor pode marcar
    """
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensagem não encontrada"
        )
    
    # Apenas receptor pode marcar como lida
    if message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode marcar esta mensagem"
        )
    
    message.is_read = True
    db.commit()
    
    return None


@router.get("/unread/count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Contador total de mensagens não lidas
    
    MOTIVO:
    - Badge de notificação
    - Mostra quantas mensagens não lidas no total
    """
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    return {"unread_count": count}
