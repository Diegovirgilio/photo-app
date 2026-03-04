#!/usr/bin/env python3
"""
Script para gerar uma SECRET_KEY aleatória para JWT

USO:
    python generate_secret_key.py
    
Copie a chave gerada para o arquivo .env
"""

import secrets

def generate_secret_key(length: int = 64) -> str:
    """
    Gera chave aleatória segura
    
    FUNDAMENTO: secrets.token_urlsafe
    
    MOTIVO:
    - secrets é criptograficamente seguro (diferente de random)
    - token_urlsafe gera string sem caracteres especiais
    - 64 bytes = 512 bits de entropia (extremamente seguro)
    """
    return secrets.token_urlsafe(length)


if __name__ == "__main__":
    secret_key = generate_secret_key()
    
    print("=" * 80)
    print("🔐 SECRET_KEY GERADA")
    print("=" * 80)
    print()
    print(f"SECRET_KEY={secret_key}")
    print()
    print("=" * 80)
    print("⚠️  Copie esta chave para o arquivo .env")
    print("⚠️  NUNCA compartilhe esta chave publicamente!")
    print("=" * 80)
