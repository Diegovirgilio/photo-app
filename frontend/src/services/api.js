import axios from 'axios';

/**
 * FUNDAMENTO: Axios HTTP Client
 * 
 * MOTIVO:
 * - Interceptors (adiciona token automaticamente)
 * - Tratamento de erro centralizado
 * - Melhor que fetch nativo (menos boilerplate)
 * - Suporta upload com progress
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cria instância do axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * FUNDAMENTO: Request Interceptor
 * 
 * MOTIVO:
 * - Adiciona token JWT automaticamente em todas as requisições
 * - Não precisa ficar repetindo header em cada chamada
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * FUNDAMENTO: Response Interceptor
 * 
 * MOTIVO:
 * - Trata erro 401 (token expirado) globalmente
 * - Redireciona para login se não autenticado
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const authService = {
  /**
   * Registra novo usuário
   */
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  /**
   * Login de usuário
   * 
   * FUNDAMENTO: OAuth2 Password Flow
   * 
   * MOTIVO:
   * - Backend espera form-data (não JSON)
   * - username = email (padrão OAuth2)
   */
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 usa 'username'
    formData.append('password', password);

    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Salva token no localStorage
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);

    // Busca dados do usuário
    const user = await authService.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  /**
   * Busca dados do usuário logado
   */
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  /**
   * Logout
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ==================== PHOTOS ====================

export const photoService = {
  /**
   * Upload de foto
   * 
   * FUNDAMENTO: FormData para multipart/form-data
   * 
   * MOTIVO:
   * - Permite envio de arquivos binários
   * - Suporta progress callback (barra de progresso)
   */
  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Lista todas as fotos (galeria pública)
   */
  getAll: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/photos', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Lista fotos do usuário logado
   */
  getMyPhotos: async () => {
    const response = await api.get('/api/photos/my');
    return response.data;
  },

  /**
   * Dar like em foto
   */
  like: async (photoId) => {
    const response = await api.post('/api/photos/like', {
      photo_id: photoId,
    });
    return response.data;
  },

  /**
   * Remover like de foto
   */
  unlike: async (photoId) => {
    await api.delete(`/api/photos/like/${photoId}`);
  },
  
  /**
   * Deletar própria foto
   */
  deleteMyPhoto: async (photoId) => {
    await api.delete(`/api/photos/${photoId}`);
  },
  
  /**
   * Listar fotos de usuário específico
   */
  getUserPhotos: async (userId) => {
    const response = await api.get(`/api/photos/user/${userId}`);
    return response.data;
  },
};

// ==================== ADMIN ====================

export const adminService = {
  /**
   * Lista todos os usuários
   */
  getUsers: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/admin/users', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Atualiza usuário
   */
  updateUser: async (userId, userData) => {
    const response = await api.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Deleta foto
   */
  deletePhoto: async (photoId) => {
    const response = await api.delete(`/api/admin/photos/${photoId}`);
    return response.data;
  },

  /**
   * Deleta usuário
   */
  deleteUser: async (userId) => {
    await api.delete(`/api/admin/users/${userId}`);
  },
};

// ==================== MESSAGES ====================

export const messageService = {
  /**
   * Enviar mensagem
   */
  sendMessage: async (receiverId, content) => {
    const response = await api.post('/api/messages/', {
      receiver_id: receiverId,
      content: content,
    });
    return response.data;
  },

  /**
   * Buscar conversa com usuário
   */
  getConversation: async (userId) => {
    const response = await api.get(`/api/messages/${userId}`);
    return response.data;
  },

  /**
   * Listar todas as conversas
   */
  getConversations: async () => {
    const response = await api.get('/api/messages/conversations/list');
    return response.data;
  },

  /**
   * Marcar mensagem como lida
   */
  markAsRead: async (messageId) => {
    await api.put(`/api/messages/${messageId}/read`);
  },

  /**
   * Contador de não lidas
   */
  getUnreadCount: async () => {
    const response = await api.get('/api/messages/unread/count');
    return response.data;
  },
};

export default api;
