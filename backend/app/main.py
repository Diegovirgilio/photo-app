from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal
from app.models import Base, User
from app.auth import hash_password
from app.config import settings
from app.routes import auth, photos, admin, messages

"""
FUNDAMENTO: FastAPI Application Factory

MOTIVO:
- Centraliza configuração do app
- Registra middlewares (CORS)
- Registra routers (rotas)
- Cria tabelas do banco
- Cria admin inicial
"""

# Cria tabelas do banco (se não existirem)
Base.metadata.create_all(bind=engine)

# Inicializa FastAPI
app = FastAPI(
    title="Photo App API",
    description="API para upload e compartilhamento de fotos",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

"""
FUNDAMENTO: CORS (Cross-Origin Resource Sharing)

MOTIVO:
- Frontend (React) roda em localhost:3000
- Backend roda em localhost:8000
- Sem CORS, browser bloqueia requests entre origens diferentes
- Em produção, trocar "*" pelo domínio do frontend
"""
# CORS - Permite requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.vercel.app",
        "https://photo-app-production-b576.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra routers
app.include_router(auth.router)
app.include_router(photos.router)
app.include_router(admin.router)
app.include_router(messages.router)


@app.on_event("startup")
def create_admin_user():
    """
    FUNDAMENTO: Startup Event

    MOTIVO:
    - Cria usuário admin automaticamente no primeiro run
    - Útil para ter acesso admin inicial
    - Idempotente: se já existe, não cria de novo
    """
    db = SessionLocal()
    try:
        # Verifica se admin já existe
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                name="Administrador",
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print(f"✅ Admin criado: {settings.ADMIN_EMAIL}")
        else:
            print(f"✅ Admin já existe: {settings.ADMIN_EMAIL}")
    
    finally:
        db.close()


@app.get("/")
def root():
    """
    FUNDAMENTO: Health Check

    MOTIVO:
    - Endpoint simples para testar se API está online
    - Útil para monitoramento
    """
    return {
        "message": "Photo App API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check para serviços de deploy (Railway, Render, etc.)"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    """
    FUNDAMENTO: ASGI Server (Uvicorn)
    
    MOTIVO:
    - FastAPI precisa de servidor ASGI (async)
    - Uvicorn é o mais popular
    - reload=True: reinicia ao mudar código (apenas dev)
    
    COMANDO PARA RODAR:
    python -m uvicorn app.main:app --reload
    """
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Hot reload (apenas desenvolvimento)
    )
