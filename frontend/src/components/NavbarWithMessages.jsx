import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/api';
import { FaCamera, FaUser, FaSignOutAlt, FaUserShield, FaComments } from 'react-icons/fa';

/**
 * FUNDAMENTO: Navigation with Notifications
 * 
 * MOTIVO:
 * - Badge de mensagens não lidas
 * - Auto-refresh do contador
 * - Link para mensagens
 */
export const NavbarWithMessages = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar contador de não lidas
  const loadUnreadCount = async () => {
    try {
      const data = await messageService.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Erro ao carregar contador:', err);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(loadUnreadCount, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FaCamera className="text-primary-600 text-2xl" />
              <span className="text-xl font-bold text-gray-900">Photo App</span>
            </Link>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Galeria
            </Link>

            <Link
              to="/upload"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Upload
            </Link>

            <Link
              to="/my-photos"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Minhas Fotos
            </Link>

            {/* Messages link com badge */}
            <Link
              to="/messages"
              className="relative text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1"
            >
              <FaComments />
              <span>Mensagens</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Admin link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-primary-600 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1"
              >
                <FaUserShield />
                <span>Admin</span>
              </Link>
            )}

            {/* User menu */}
            <div className="flex items-center space-x-2 border-l pl-4 ml-4">
              <div className="flex items-center space-x-2">
                <FaUser className="text-gray-600" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 p-2 rounded-md transition"
                title="Sair"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
