import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { photoService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { PhotoCard } from '../components/PhotoCard';
import { FaArrowLeft, FaImages } from 'react-icons/fa';

/**
 * FUNDAMENTO: User Profile Photos View
 * 
 * MOTIVO:
 * - Mostra todas as fotos de um usuário específico
 * - Chamado ao clicar em um usuário na galeria agrupada
 */
export const UserPhotosPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUserPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoService.getUserPhotos(parseInt(userId));
      
      if (data.length > 0) {
        setPhotos(data);
        setUser(data[0].owner); // Pega info do usuário da primeira foto
      } else {
        setError('Este usuário não tem fotos');
      }
    } catch (err) {
      setError('Erro ao carregar fotos do usuário');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPhotos();
  }, [userId]);

  const totalLikes = photos.reduce((sum, photo) => sum + photo.likes_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
        >
          <FaArrowLeft />
          <span>Voltar para Galeria</span>
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* User Header */}
        {!loading && user && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.name}
                  </h1>
                  <div className="flex items-center space-x-4 mt-2 text-gray-600">
                    <span>
                      <strong>{photos.length}</strong> {photos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>{totalLikes}</strong> {totalLikes === 1 ? 'like' : 'likes'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onPhotoUpdate={loadUserPhotos}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && photos.length === 0 && (
          <div className="text-center py-12">
            <FaImages className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma foto encontrada
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};
