from PIL import Image
from io import BytesIO
import uuid
from typing import Tuple

"""
FUNDAMENTO: Processamento de Imagens com Pillow

MOTIVO:
- Compressão no servidor garante qualidade uniforme
- Geração de thumbnails acelera carregamento da galeria
- Conversão para JPEG padroniza formato (mais leve que PNG)
"""

def compress_image(image_bytes: bytes, quality: int = 85, max_size: Tuple[int, int] = (1920, 1080)) -> bytes:
    """
    Comprime imagem mantendo proporção
    
    FUNDAMENTO: Resize proporcional + compressão JPEG
    
    PARÂMETROS:
    - quality: 0-100 (85 é sweet spot: boa qualidade, tamanho reduzido)
    - max_size: (width, height) máximo
    
    MOTIVO:
    - Reduz custos de storage
    - Acelera carregamento
    - Mantém qualidade visual
    """
    # Abre imagem dos bytes
    img = Image.open(BytesIO(image_bytes))
    
    # Converte para RGB se for RGBA (PNG com transparência)
    if img.mode in ('RGBA', 'LA', 'P'):
        # Cria fundo branco
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    
    # Redimensiona mantendo proporção (thumbnail=True mantém aspect ratio)
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Salva em BytesIO
    output = BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    output.seek(0)
    
    return output.read()


def create_thumbnail(image_bytes: bytes, size: Tuple[int, int] = (300, 300)) -> bytes:
    """
    Cria thumbnail quadrado
    
    FUNDAMENTO: Center crop + resize
    
    MOTIVO:
    - Thumbnails uniformes (todos 300x300)
    - Crop centralizado mantém parte importante da foto
    - Galeria fica visualmente consistente
    """
    img = Image.open(BytesIO(image_bytes))
    
    # Converte para RGB
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    
    # Calcula crop para fazer quadrado
    width, height = img.size
    
    if width > height:
        # Imagem horizontal: crop nas laterais
        left = (width - height) // 2
        top = 0
        right = left + height
        bottom = height
    else:
        # Imagem vertical: crop em cima/baixo
        left = 0
        top = (height - width) // 2
        right = width
        bottom = top + width
    
    # Faz crop
    img = img.crop((left, top, right, bottom))
    
    # Redimensiona para tamanho final
    img = img.resize(size, Image.Resampling.LANCZOS)
    
    # Salva
    output = BytesIO()
    img.save(output, format='JPEG', quality=80, optimize=True)
    output.seek(0)
    
    return output.read()


def generate_filename(original_filename: str) -> str:
    """
    Gera nome único para arquivo
    
    FUNDAMENTO: UUID + extensão
    
    MOTIVO:
    - UUID garante unicidade (colisão praticamente impossível)
    - Previne conflitos de nome
    - Dificulta enumerar arquivos (segurança)
    
    EXEMPLO:
    "foto.png" -> "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
    """
    extension = original_filename.split('.')[-1].lower()
    
    # Força JPEG (padronização)
    if extension in ['jpg', 'jpeg', 'png', 'webp']:
        extension = 'jpg'
    
    unique_id = uuid.uuid4()
    return f"{unique_id}.{extension}"


def validate_image(file_bytes: bytes, max_size_mb: int = 10) -> Tuple[bool, str]:
    """
    Valida se arquivo é imagem válida
    
    MOTIVO:
    - Previne upload de arquivos maliciosos
    - Limita tamanho (previne DoS)
    - Valida formato real (não só extensão)
    
    RETORNA:
    (True, "OK") ou (False, "mensagem de erro")
    """
    # Verifica tamanho
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        return False, f"Arquivo muito grande. Máximo: {max_size_mb}MB"
    
    try:
        # Tenta abrir como imagem
        img = Image.open(BytesIO(file_bytes))
        img.verify()  # Verifica integridade
        
        # Valida formato
        if img.format not in ['JPEG', 'PNG', 'WEBP']:
            return False, f"Formato inválido. Aceito: JPEG, PNG, WEBP"
        
        return True, "OK"
    
    except Exception as e:
        return False, f"Arquivo inválido: {str(e)}"
