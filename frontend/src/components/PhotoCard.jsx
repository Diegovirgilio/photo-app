import { useState } from 'react';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import { photoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * FUNDAMENTO: Reusable Component
 * 
 * MOTIVO:
 * - Usado em múltiplas páginas (Gallery, MyPhotos, Admin)
 * - Encapsula lógica de like
 * - Props para customizar comportamento
 */
export const PhotoCard = ({ photo, onPhotoUpdate, onPhotoDelete, showDelete = false }) => {
  const { user } = useAuth();
  const isOwner = user?.id === photo.user_id;
  const [isLiked, setIsLiked] = useState(false); // TODO: verificar se usuário já deu like
  const [likesCount, setLikesCount] = useState(photo.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  /**
   * Toggle like
   * 
   * FUNDAMENTO: Optimistic Update
   * 
   * MOTIVO:
   * - Atualiza UI imediatamente (melhor UX)
   * - Se API falhar, reverte mudança
   */
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

      // Notifica componente pai para atualizar lista
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
    if (!window.confirm('Tem certeza que deseja deletar esta foto?')) {
      return;
    }

    try {
      if (onPhotoDelete) {
        await onPhotoDelete(photo.id);
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      alert('Erro ao deletar foto');
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

        {/* Delete button (admin/owner) */}
        {showDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition shadow-lg"
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
              <p className="text-sm font-medium text-gray-900">{photo.owner.name}</p>
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
