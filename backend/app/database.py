from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

"""
FUNDAMENTO: Connection Pool

MOTIVO:
- create_engine cria um pool de conexões (não abre/fecha a cada request)
- pool_pre_ping=True testa se conexão está viva antes de usar
- Evita erro "connection closed" em produção
"""
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False  # True para debug (mostra SQL queries)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    FUNDAMENTO: Dependency Injection do FastAPI
    
    MOTIVO:
    - Cada request cria uma sessão nova
    - finally garante que conexão é fechada mesmo com erro
    - yield permite usar em context manager
    
    USO:
    @app.get("/users")
    def get_users(db: Session = Depends(get_db)):
        return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
