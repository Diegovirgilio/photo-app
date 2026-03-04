import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

/**
 * FUNDAMENTO: Context API
 * 
 * MOTIVO:
 * - Estado global de autenticação (evita prop drilling)
 * - Qualquer componente acessa usuário logado
 * - Centraliza lógica de login/logout
 * - Persiste estado no localStorage
 */

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * FUNDAMENTO: useEffect para carregar estado inicial
   * 
   * MOTIVO:
   * - Verifica se tem token no localStorage
   * - Carrega dados do usuário se token existe
   * - Apenas uma vez ([] dependency)
   */
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login
   * 
   * FLUXO:
   * 1. Chama API de login
   * 2. API salva token no localStorage
   * 3. Atualiza estado do Context
   */
  const login = async (email, password) => {
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao fazer login',
      };
    }
  };

  /**
   * Registro
   * 
   * FLUXO:
   * 1. Chama API de registro
   * 2. Se sucesso, faz login automaticamente
   */
  const register = async (userData) => {
    try {
      await authService.register(userData);
      // Faz login automaticamente após registro
      return await login(userData.email, userData.password);
    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erro ao criar conta',
      };
    }
  };

  /**
   * Logout
   * 
   * FLUXO:
   * 1. Remove token e dados do localStorage
   * 2. Limpa estado do Context
   */
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  /**
   * Atualiza dados do usuário
   * 
   * USO: Após upload de foto, admin alterar dados, etc.
   */
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
