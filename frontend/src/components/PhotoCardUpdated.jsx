import { useState } from 'react';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import { photoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * FUNDAMENTO: Reusable Component com Ownership
 * 
 * MOTIVO:
 * - Dono pode deletar própria foto
 * - Admin pode deletar qualquer foto
 * - Outros usuários só podem dar like
 */
export const PhotoCard = ({ 
  photo, 
  onPhotoUpdate, 
  onPhotoDelete, 
  showDelete = false,
  allowOwnerDelete = false // NOVO: permite dono deletar
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(photo.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verifica se é o dono da foto
  const isOwner = user?.id === photo.user_id;
  
  // Mostra botão deletar se:
  // - showDelete=true (admin) OU
  // - allowOwnerDelete=true E é o dono
  const canDelete = showDelete || (allowOwnerDelete && isOwner);

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      if (isLiked) {
        await photoService.unlike(photo.id);
      } else {
        await photoService.like(photo.id);
      }

      if (onPhotoUpdate) {
        onPhotoUpdate();
      }
    } catch (error) {
      // Reverte em caso de erro
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Erro ao dar like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    if (!window.confirm('Tem certeza que deseja deletar esta foto?')) {
      return;
    }

    setIsDeleting(true);

    try {
      if (onPhotoDelete) {
        // Se tem callback customizado (admin)
        await onPhotoDelete(photo.id);
      } else {
        // Dono deletando própria foto
        await photoService.deleteMyPhoto(photo.id);
        
        if (onPhotoUpdate) {
          onPhotoUpdate();
        }
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      alert(error.response?.data?.detail || 'Erro ao deletar foto');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fade-in">
      {/* Image */}
      <div className="relative aspect-square">
        <img
          src={photo.thumbnail_url}
          alt={`Foto de ${photo.owner.name}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => window.open(photo.url, '_blank')}
        />

        {/* Delete button */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition shadow-lg disabled:opacity-50"
            title="Deletar foto"
          >
            <FaTrash />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Owner info */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {photo.owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {photo.owner.name}
                {isOwner && (
                  <span className="ml-2 text-xs text-primary-600">(Você)</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(photo.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition ${
              isLiked
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
