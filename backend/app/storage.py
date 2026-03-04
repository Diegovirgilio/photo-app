from supabase import create_client, Client
from app.config import settings
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

"""
FUNDAMENTO: Supabase Storage (S3-compatible Object Storage)

MOTIVO:
- 1GB grátis (suficiente para beta)
- CDN incluso (imagens rápidas globalmente)
- Integração simples com Python
- Quando crescer, fácil migrar para S3/Cloudflare R2
"""

class SupabaseStorage:
    def __init__(self):
        """
        Inicializa cliente Supabase
        
        MOTIVO:
        - Singleton pattern: uma instância para todo app
        - Conexão persistente (pool interno)
        """
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
        self.bucket_name = settings.SUPABASE_BUCKET_NAME
    
    def upload_file(self, file_bytes: bytes, filename: str, folder: str = "photos") -> Tuple[bool, str]:
        """
        Faz upload de arquivo para Supabase Storage
        
        PARÂMETROS:
        - file_bytes: bytes do arquivo
        - filename: nome único gerado (UUID)
        - folder: organização (photos/ ou thumbnails/)
        
        RETORNA:
        (True, "url_publica") ou (False, "mensagem_erro")
        
        ESTRUTURA NO BUCKET:
        photos/
          ├── a1b2c3d4.jpg
          └── e5f6g7h8.jpg
        thumbnails/
          ├── a1b2c3d4.jpg
          └── e5f6g7h8.jpg
        """
        try:
            path = f"{folder}/{filename}"
            
            # Upload
            response = self.client.storage.from_(self.bucket_name).upload(
                path=path,
                file=file_bytes,
                file_options={
                    "content-type": "image/jpeg",
                    "cache-control": "3600",  # Cache de 1 hora
                    "upsert": "false"  # Não sobrescreve se já existe
                }
            )
            
            # Gera URL pública
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(path)
            
            logger.info(f"Upload bem-sucedido: {path}")
            return True, public_url
        
        except Exception as e:
            logger.error(f"Erro no upload: {str(e)}")
            return False, str(e)
    
    def delete_file(self, file_url: str) -> Tuple[bool, str]:
        """
        Deleta arquivo do Supabase Storage
        
        FUNDAMENTO: Extração do path da URL
        
        MOTIVO:
        - Quando admin deleta foto, remove do storage também
        - Economiza espaço
        
        URL:
        https://xyz.supabase.co/storage/v1/object/public/photos/photos/abc.jpg
        
        PATH:
        photos/abc.jpg
        """
        try:
            # Extrai path da URL
            # URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
            parts = file_url.split(f'/object/public/{self.bucket_name}/')
            if len(parts) != 2:
                return False, "URL inválida"
            
            path = parts[1]
            
            # Deleta
            response = self.client.storage.from_(self.bucket_name).remove([path])
            
            logger.info(f"Arquivo deletado: {path}")
            return True, "Arquivo deletado"
        
        except Exception as e:
            logger.error(f"Erro ao deletar: {str(e)}")
            return False, str(e)
    
    def delete_multiple_files(self, file_urls: list[str]) -> Tuple[int, int]:
        """
        Deleta múltiplos arquivos
        
        RETORNA:
        (sucessos, falhas)
        """
        success_count = 0
        fail_count = 0
        
        for url in file_urls:
            success, _ = self.delete_file(url)
            if success:
                success_count += 1
            else:
                fail_count += 1
        
        return success_count, fail_count


# Instância global
storage = SupabaseStorage()
