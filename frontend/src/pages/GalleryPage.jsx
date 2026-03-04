import { useState, useEffect } from 'react';
import { photoService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { PhotoCard } from '../components/PhotoCard';
import { FaImages } from 'react-icons/fa';

/**
 * FUNDAMENTO: Data Fetching com useEffect
 * 
 * MOTIVO:
 * - Carrega fotos ao montar componente
 * - Atualiza lista quando houver mudanças
 */
export const GalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoService.getAll();
      setPhotos(data.photos);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaImages className="mr-3 text-primary-600" />
            Galeria Pública
          </h1>
          <p className="mt-2 text-gray-600">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} compartilhadas
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
        {!loading && !error && photos.length === 0 && (
          <div className="text-center py-12">
            <FaImages className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma foto ainda
            </h3>
            <p className="text-gray-600">Seja o primeiro a compartilhar uma foto!</p>
          </div>
        )}

        {/* Photo grid */}
        {!loading && photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onPhotoUpdate={loadPhotos}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
