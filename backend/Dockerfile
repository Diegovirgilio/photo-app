# Usar imagem oficial Python
FROM python:3.10-slim

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements primeiro (cache do Docker)
COPY requirements.txt .

# Instalar dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Expor porta (Railway define $PORT)
EXPOSE 8000

# Comando para rodar o app
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT