"""Cloudinary Storage Integration"""
import cloudinary
import cloudinary.uploader
from app.config import settings
from typing import Tuple
import logging

logger = logging.getLogger(__name__)

# Configurar Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

class CloudinaryStorage:
    def __init__(self):
        self.folder = "photo-app"
    
    def upload_file(self, file_bytes: bytes, filename: str, folder: str = "photos") -> Tuple[bool, str]:
        try:
            result = cloudinary.uploader.upload(
                file_bytes,
                folder=f"{self.folder}/{folder}",
                public_id=filename.split('.')[0],
                resource_type="image",
                transformation=[
                    {'quality': 'auto'},
                    {'fetch_format': 'auto'}
                ]
            )
            url = result['secure_url']
            logger.info(f"Upload Cloudinary bem-sucedido: {filename}")
            return True, url
        except Exception as e:
            logger.error(f"Erro no upload Cloudinary: {str(e)}")
            return False, str(e)
    
    def delete_file(self, file_url: str) -> Tuple[bool, str]:
        try:
            parts = file_url.split('/upload/')
            if len(parts) != 2:
                return False, "URL inválida"
            
            path = parts[1].split('/')
            public_id = '/'.join(path[1:]).rsplit('.', 1)[0]
            
            result = cloudinary.uploader.destroy(public_id)
            logger.info(f"Arquivo deletado: {public_id}")
            return True, "Arquivo deletado"
        except Exception as e:
            logger.error(f"Erro ao deletar: {str(e)}")
            return False, str(e)
    
    def delete_multiple_files(self, file_urls: list[str]) -> Tuple[int, int]:
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
storage = CloudinaryStorage()