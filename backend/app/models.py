from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    """
    FUNDAMENTO: ORM (Object-Relational Mapping)
    
    MOTIVO:
    - Trabalha com objetos Python ao invés de SQL direto
    - Previne SQL Injection automaticamente
    - Facilita mudanças no schema (migrations)
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)  # Nunca salva senha em texto puro
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamento: um usuário tem várias fotos
    photos = relationship("Photo", back_populates="owner", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"


class Photo(Base):
    """
    FUNDAMENTO: Entidade principal do sistema
    
    MOTIVO:
    - Armazena apenas URLs (não bytes) - separação de concerns
    - thumbnail_url otimiza carregamento da galeria
    - likes_count evita COUNT() toda hora (denormalização intencional)
    """
    __tablename__ = "photos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    url = Column(String, nullable=False)  # URL da imagem original no Supabase
    thumbnail_url = Column(String, nullable=False)  # URL do thumbnail
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    owner = relationship("User", back_populates="photos")
    likes = relationship("Like", back_populates="photo", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Photo {self.id} by User {self.user_id}>"


class Like(Base):
    """
    FUNDAMENTO: Tabela de junção (many-to-many)
    
    MOTIVO:
    - Um usuário pode dar like em várias fotos
    - Uma foto pode ter likes de vários usuários
    - Unique constraint (photo_id, user_id) previne duplicação
    """
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    photo = relationship("Photo", back_populates="likes")
    user = relationship("User", back_populates="likes")
    
    # Constraint: um usuário só pode dar 1 like por foto
    __table_args__ = (
        CheckConstraint('photo_id IS NOT NULL'),
        CheckConstraint('user_id IS NOT NULL'),
    )
    
    def __repr__(self):
        return f"<Like User:{self.user_id} -> Photo:{self.photo_id}>"


class Message(Base):
    """
    FUNDAMENTO: Sistema de Chat Individual
    
    MOTIVO:
    - Mensagens entre dois usuários (1:1)
    - Ordenação por timestamp
    - Marcar como lida/não lida
    """
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String(1000), nullable=False)  # Mensagem
    is_read = Column(Boolean, default=False)  # Lida ou não
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relacionamentos
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")
    
    def __repr__(self):
        return f"<Message {self.sender_id}->{self.receiver_id}: {self.content[:20]}>"
