import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Resizer from 'react-image-file-resizer';
import { photoService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { FaCloudUploadAlt, FaImage, FaCheckCircle } from 'react-icons/fa';

/**
 * FUNDAMENTO: Client-Side Image Compression
 * 
 * MOTIVO:
 * - Reduz tempo de upload (comprime antes de enviar)
 * - Economiza bandwidth (crucial para mobile)
 * - Melhora UX (preview da imagem)
 */

/**
 * Comprime imagem no cliente
 * 
 * FUNDAMENTO: react-image-file-resizer
 * 
 * PARÂMETROS:
 * - maxWidth/maxHeight: 1920x1080 (Full HD)
 * - quality: 85 (sweet spot)
 * - outputType: file (para upload)
 */
const compressImage = (file) => {
  return new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      1920, // max width
      1080, // max height
      'JPEG', // format
      85, // quality (0-100)
      0, // rotation
      (uri) => {
        resolve(uri);
      },
      'file' // output type
    );
  });
};

export const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  /**
   * FUNDAMENTO: FileReader API para preview
   * 
   * MOTIVO:
   * - Mostra preview da imagem antes de enviar
   * - Melhor UX (usuário vê o que vai enviar)
   */
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Valida tipo
    if (!file.type.startsWith('image/')) {
      setError('Apenas arquivos de imagem são aceitos');
      return;
    }

    // Valida tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    setError('');
    setSuccess(false);

    try {
      // Comprime imagem
      const compressedFile = await compressImage(file);
      setSelectedFile(compressedFile);

      // Cria preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setError('Erro ao processar imagem');
      console.error(err);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      await photoService.upload(selectedFile, (percent) => {
        setProgress(percent);
      });

      setSuccess(true);
      setSelectedFile(null);
      setPreview(null);

      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate('/my-photos');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Erro ao fazer upload. Você pode ter atingido o limite de 5 fotos.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FaCloudUploadAlt className="mr-2 text-primary-600" />
            Upload de Foto
          </h1>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📸 Você pode enviar até <strong>5 fotos</strong>
              <br />
              📏 Tamanho máximo: <strong>10MB</strong>
              <br />
              🖼️ Formatos aceitos: <strong>JPEG, PNG, WEBP</strong>
            </p>
          </div>

          {/* Upload area */}
          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FaImage className="text-6xl text-gray-400 mb-4" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clique para selecionar</span> ou arraste e solte
                </p>
                <p className="text-xs text-gray-500">JPEG, PNG ou WEBP</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-lg object-cover max-h-96"
                />
                {!uploading && !success && (
                  <button
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition"
                  >
                    Remover
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Enviando... {progress}%
                  </p>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <FaCheckCircle className="text-green-600 text-2xl mr-3" />
                  <div>
                    <p className="text-green-800 font-medium">Upload concluído!</p>
                    <p className="text-sm text-green-600">Redirecionando para suas fotos...</p>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Upload button */}
              {!uploading && !success && (
                <button
                  onClick={handleUpload}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50"
                  disabled={uploading}
                >
                  Fazer Upload
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
