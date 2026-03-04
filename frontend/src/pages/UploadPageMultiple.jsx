import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Resizer from 'react-image-file-resizer';
import { photoService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { FaCloudUploadAlt, FaImage, FaCheckCircle, FaTimes } from 'react-icons/fa';

/**
 * FUNDAMENTO: Multi-file Upload com Progress Individual
 * 
 * MOTIVO:
 * - Usuário pode selecionar várias fotos de uma vez
 * - Upload paralelo com progress individual
 * - Validação de limite (5 fotos total)
 */

const compressImage = (file) => {
  return new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      1920,
      1080,
      'JPEG',
      85,
      0,
      (uri) => resolve(uri),
      'file'
    );
  });
};

export const UploadPage = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState([]); // { index, progress, success, error }
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validar quantidade (assumindo que usuário pode ter fotos já)
    if (files.length > 5) {
      setError('Você pode fazer upload de no máximo 5 fotos por vez');
      return;
    }

    setError('');
    
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} não é uma imagem válida`);
        continue;
      }

      // Validar tamanho
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} é muito grande (máx 10MB)`);
        continue;
      }

      try {
        // Comprime
        const compressedFile = await compressImage(file);
        validFiles.push(compressedFile);

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            name: file.name,
            url: reader.result
          });
          
          if (newPreviews.length === validFiles.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        setError(`Erro ao processar ${file.name}`);
      }
    }

    setSelectedFiles(validFiles);
    setUploadStatus(validFiles.map((_, index) => ({ 
      index, 
      progress: 0, 
      success: false, 
      error: null 
    })));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');

    try {
      // Upload em paralelo
      const uploadPromises = selectedFiles.map((file, index) => {
        return photoService.upload(file, (percent) => {
          setUploadStatus(prev => prev.map(status => 
            status.index === index 
              ? { ...status, progress: percent }
              : status
          ));
        })
        .then(() => {
          setUploadStatus(prev => prev.map(status => 
            status.index === index 
              ? { ...status, success: true }
              : status
          ));
        })
        .catch(err => {
          setUploadStatus(prev => prev.map(status => 
            status.index === index 
              ? { ...status, error: err.response?.data?.detail || 'Erro no upload' }
              : status
          ));
        });
      });

      await Promise.all(uploadPromises);

      // Verificar se todos tiveram sucesso
      const allSuccess = uploadStatus.every(s => s.success);
      
      if (allSuccess) {
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/my-photos');
        }, 2000);
      }
    } catch (err) {
      setError('Erro ao fazer uploads');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setUploadStatus(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i })));
  };

  const successCount = uploadStatus.filter(s => s.success).length;
  const errorCount = uploadStatus.filter(s => s.error).length;
  const allCompleted = successCount + errorCount === selectedFiles.length && selectedFiles.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FaCloudUploadAlt className="mr-2 text-primary-600" />
            Upload de Fotos
          </h1>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📸 Você pode enviar até <strong>5 fotos</strong> no total
              <br />
              📁 Selecione múltiplas fotos de uma vez
              <br />
              📏 Tamanho máximo por foto: <strong>10MB</strong>
              <br />
              🖼️ Formatos aceitos: <strong>JPEG, PNG, WEBP</strong>
            </p>
          </div>

          {/* Upload area */}
          {previews.length === 0 ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FaImage className="text-6xl text-gray-400 mb-4" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clique para selecionar</span> ou arraste e solte
                </p>
                <p className="text-xs text-gray-500">JPEG, PNG ou WEBP (múltiplas fotos)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          ) : (
            <div className="space-y-4">
              {/* Preview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previews.map((preview, index) => {
                  const status = uploadStatus[index];
                  
                  return (
                    <div key={index} className="relative">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      
                      {/* Remove button */}
                      {!uploading && !status?.success && (
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                        >
                          <FaTimes />
                        </button>
                      )}

                      {/* Progress */}
                      {uploading && !status?.success && !status?.error && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 rounded-b-lg">
                          <div className="w-full bg-gray-300 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{ width: `${status?.progress || 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-white text-center mt-1">
                            {status?.progress || 0}%
                          </p>
                        </div>
                      )}

                      {/* Success */}
                      {status?.success && (
                        <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center rounded-lg">
                          <FaCheckCircle className="text-white text-4xl" />
                        </div>
                      )}

                      {/* Error */}
                      {status?.error && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center rounded-lg p-2">
                          <p className="text-white text-xs text-center">{status.error}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {allCompleted && (
                <div className={`rounded-lg p-4 ${successCount === selectedFiles.length ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className="font-medium">
                    ✅ {successCount} de {selectedFiles.length} fotos enviadas com sucesso
                  </p>
                  {errorCount > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      ❌ {errorCount} foto(s) falharam
                    </p>
                  )}
                  {successCount === selectedFiles.length && (
                    <p className="text-sm text-green-600 mt-1">
                      Redirecionando para suas fotos...
                    </p>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Upload button */}
              {!uploading && !allCompleted && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleUpload}
                    className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 font-medium transition"
                  >
                    Fazer Upload de {selectedFiles.length} Foto(s)
                  </button>
                  
                  <label className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium transition text-center cursor-pointer">
                    Adicionar Mais
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
