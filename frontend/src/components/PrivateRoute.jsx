import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * FUNDAMENTO: Protected Routes
 * 
 * MOTIVO:
 * - Impede acesso não autenticado a rotas privadas
 * - Redireciona para login se não estiver logado
 * - Pode verificar se é admin (requireAdmin prop)
 */
export const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Não autenticado: redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rota requer admin mas usuário não é admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};
