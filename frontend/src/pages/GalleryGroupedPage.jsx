import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { photoService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { FaImages, FaHeart } from 'react-icons/fa';

/**
 * FUNDAMENTO: Galeria Agrupada por Usuário
 * 
 * MOTIVO:
 * - Mostra um card por usuário com foto de capa
 * - Contador de fotos e likes totais
 * - Click para ver todas as fotos do usuário
 */
export const GalleryGroupedPage = () => {
  const [usersWithPhotos, setUsersWithPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoService.getAll();
      
      // Agrupar fotos por usuário
      const grouped = {};
      
      data.photos.forEach(photo => {
        const userId = photo.user_id;
        
        if (!grouped[userId]) {
          grouped[userId] = {
            user: photo.owner,
            photos: [],
            totalLikes: 0
          };
        }
        
        grouped[userId].photos.push(photo);
        grouped[userId].totalLikes += photo.likes_count;
      });
      
      // Converter para array e ordenar por quantidade de fotos
      const usersArray = Object.values(grouped).sort((a, b) => 
        b.photos.length - a.photos.length
      );
      
      setUsersWithPhotos(usersArray);
    } catch (err) {
      setError('Erro ao carregar fotos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaImages className="mr-3 text-primary-600" />
            Galeria por Usuários
          </h1>
          <p className="mt-2 text-gray-600">
            {usersWithPhotos.length} {usersWithPhotos.length === 1 ? 'usuário compartilhou' : 'usuários compartilharam'} fotos
          </p>
        </div>

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

        {/* Empty state */}
        {!loading && !error && usersWithPhotos.length === 0 && (
          <div className="text-center py-12">
            <FaImages className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma foto ainda
            </h3>
            <p className="text-gray-600">Seja o primeiro a compartilhar uma foto!</p>
          </div>
        )}

        {/* User Cards Grid */}
        {!loading && usersWithPhotos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {usersWithPhotos.map((userData) => {
              // Foto de capa (mais recente)
              const coverPhoto = userData.photos[0];
              
              return (
                <div
                  key={userData.user.id}
                  onClick={() => handleUserClick(userData.user.id)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Cover Photo */}
                  <div className="relative aspect-square">
                    <img
                      src={coverPhoto.thumbnail_url}
                      alt={`Foto de ${userData.user.name}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Photo Count Badge */}
                    {userData.photos.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                        <FaImages />
                        <span>{userData.photos.length}</span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {userData.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {userData.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userData.photos.length} {userData.photos.length === 1 ? 'foto' : 'fotos'}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <FaHeart className="text-red-500" />
                        <span className="text-sm font-medium">{userData.totalLikes}</span>
                        <span className="text-sm">likes</span>
                      </div>
                      
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Ver fotos →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
