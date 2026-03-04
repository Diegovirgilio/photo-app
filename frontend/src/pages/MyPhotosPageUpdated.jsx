import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { photoService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { PhotoCard } from '../components/PhotoCard';
import { FaImages, FaCloudUploadAlt } from 'react-icons/fa';

/**
 * FUNDAMENTO: User's own photos with delete capability
 * 
 * MOTIVO:
 * - Mostra apenas fotos do usuário logado
 * - Permite deletar próprias fotos
 * - Indica quantas fotos faltam para o limite (5)
 */
export const MyPhotosPageUpdated = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoService.getMyPhotos();
      setPhotos(data);
    } catch (err) {
      setError('Erro ao carregar suas fotos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const remainingUploads = 5 - photos.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaImages className="mr-3 text-primary-600" />
              Minhas Fotos
            </h1>
            <p className="mt-2 text-gray-600">
              {photos.length} de 5 fotos enviadas
              {remainingUploads > 0 && (
                <span className="text-primary-600 font-medium">
                  {' '}
                  • {remainingUploads} {remainingUploads === 1 ? 'restante' : 'restantes'}
                </span>
              )}
            </p>
          </div>

          {/* Upload button */}
          {remainingUploads > 0 && (
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <FaCloudUploadAlt className="mr-2" />
              Nova Foto
            </Link>
          )}
        </div>

        {/* Limit warning */}
        {remainingUploads === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ Você atingiu o limite de 5 fotos. Delete uma foto para enviar outra.
            </p>
          </div>
        )}

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
        {!loading && !error && photos.length === 0 && (
          <div className="text-center py-12">
            <FaImages className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Você ainda não tem fotos
            </h3>
            <p className="text-gray-600 mb-6">Comece enviando sua primeira foto!</p>
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <FaCloudUploadAlt className="mr-2" />
              Enviar Foto
            </Link>
          </div>
        )}

        {/* Photo grid - IMPORTANTE: allowOwnerDelete={true} */}
        {!loading && photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onPhotoUpdate={loadPhotos}
                allowOwnerDelete={true}  // Permite dono deletar
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
