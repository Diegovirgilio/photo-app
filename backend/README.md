# Photo App - Backend (FastAPI)

## 🚀 Setup do Backend

### 1. Instalar Dependências

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database (use PostgreSQL local ou Supabase)
DATABASE_URL=postgresql://user:password@localhost:5432/photo_app

# Supabase (crie conta grátis em https://supabase.com)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon
SUPABASE_BUCKET_NAME=photos

# JWT Secret (gere uma chave aleatória)
SECRET_KEY=cole-string-aleatoria-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Admin inicial
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=senha-segura-aqui
```

### 3. Criar Bucket no Supabase

1. Acesse https://supabase.com e crie um projeto
2. Vá em **Storage** > **Create Bucket**
3. Nome: `photos`
4. **Public bucket**: ✅ Sim (para URLs públicas)
5. Copie a URL e Key do projeto para o `.env`

### 4. Rodar o Servidor

```bash
# Método 1: Usando uvicorn diretamente
uvicorn app.main:app --reload

# Método 2: Rodando o arquivo main.py
python app/main.py
```

Servidor rodando em: **http://localhost:8000**

### 5. Testar a API

Acesse a documentação interativa (Swagger):
- **http://localhost:8000/docs**

## 📁 Estrutura do Projeto

```
backend/
├── app/
│   ├── routes/          # Rotas da API
│   │   ├── auth.py      # Login, registro
│   │   ├── photos.py    # Upload, listagem, likes
│   │   └── admin.py     # Gerenciamento admin
│   ├── models.py        # Modelos do banco (SQLAlchemy)
│   ├── schemas.py       # Validação de dados (Pydantic)
│   ├── auth.py          # Autenticação JWT
│   ├── database.py      # Conexão com banco
│   ├── storage.py       # Integração Supabase
│   ├── utils.py         # Processamento de imagens
│   ├── config.py        # Configurações
│   └── main.py          # App principal
├── requirements.txt     # Dependências
└── .env                 # Variáveis de ambiente
```

## 🔑 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login (retorna JWT)
- `GET /api/auth/me` - Dados do usuário logado

### Fotos
- `POST /api/photos/upload` - Upload de foto
- `GET /api/photos` - Listar todas as fotos
- `GET /api/photos/my` - Minhas fotos
- `POST /api/photos/like` - Dar like
- `DELETE /api/photos/like/{photo_id}` - Remover like

### Admin
- `GET /api/admin/users` - Listar usuários
- `PUT /api/admin/users/{user_id}` - Atualizar usuário
- `DELETE /api/admin/photos/{photo_id}` - Deletar foto
- `DELETE /api/admin/users/{user_id}` - Deletar usuário

## 🔐 Autenticação

Após login, inclua o token em todas as requisições:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Testando com cURL

### Registrar usuário:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "João Silva",
    "password": "senha123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=senha123"
```

### Upload de foto:
```bash
curl -X POST http://localhost:8000/api/photos/upload \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@/caminho/para/foto.jpg"
```

## 📊 Banco de Dados

O SQLAlchemy cria as tabelas automaticamente no primeiro run:
- `users` - Usuários
- `photos` - Fotos
- `likes` - Likes

Para resetar o banco (desenvolvimento):
```sql
DROP TABLE likes, photos, users;
```
Reinicie o servidor para recriar as tabelas.

## 🐛 Troubleshooting

### Erro: "SUPABASE_URL not found"
- Certifique-se de ter criado o arquivo `.env`
- Verifique se as variáveis estão corretas

### Erro: "Could not connect to database"
- Verifique se PostgreSQL está rodando
- Confira a `DATABASE_URL` no `.env`

### Erro ao fazer upload
- Verifique se o bucket foi criado no Supabase
- Confira se o bucket é público
- Valide SUPABASE_URL e SUPABASE_KEY

## ⚡ Próximos Passos

Após o backend rodando, vá para o **frontend (React)** para completar o projeto!
