import { useState, useEffect } from 'react';
import { adminService, photoService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { PhotoCard } from '../components/PhotoCard';
import { FaUserShield, FaUsers, FaImages, FaTrash, FaUserCog } from 'react-icons/fa';

/**
 * FUNDAMENTO: Admin Panel with Tabs
 * 
 * MOTIVO:
 * - Gerenciar usuários e fotos em um lugar
 * - Tabs para organizar funcionalidades
 * - Ações destrutivas com confirmação
 */
export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' ou 'photos'
  const [users, setUsers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load photos
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
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadPhotos();
    }
  }, [activeTab]);

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert('Erro ao deletar usuário: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Toggle admin
  const handleToggleAdmin = async (userId, currentAdmin) => {
    const action = currentAdmin ? 'remover admin' : 'tornar admin';
    if (!window.confirm(`Tem certeza que deseja ${action} este usuário?`)) {
      return;
    }

    try {
      await adminService.updateUser(userId, { is_admin: !currentAdmin });
      loadUsers();
    } catch (err) {
      alert('Erro ao atualizar usuário: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId) => {
    try {
      await adminService.deletePhoto(photoId);
      loadPhotos();
    } catch (err) {
      alert('Erro ao deletar foto: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaUserShield className="mr-3 text-primary-600" />
            Painel de Administração
          </h1>
          <p className="mt-2 text-gray-600">Gerencie usuários e fotos da plataforma</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <FaUsers className="mr-2" />
              Usuários ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`${
                activeTab === 'photos'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <FaImages className="mr-2" />
              Fotos ({photos.length})
            </button>
          </nav>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Users tab */}
        {!loading && activeTab === 'users' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Usuário
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        title={user.is_admin ? 'Remover admin' : 'Tornar admin'}
                      >
                        <FaUserCog className="inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Deletar usuário"
                      >
                        <FaTrash className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        )}

        {/* Photos tab */}
        {!loading && activeTab === 'photos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onPhotoUpdate={loadPhotos}
                onPhotoDelete={handleDeletePhoto}
                showDelete={true}
              />
            ))}

            {photos.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FaImages className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhuma foto encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
