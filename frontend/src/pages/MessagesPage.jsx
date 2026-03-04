import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../services/api';
import { Navbar } from '../components/Navbar';
import { FaComments, FaCircle } from 'react-icons/fa';

/**
 * FUNDAMENTO: Inbox/Conversations List
 * 
 * MOTIVO:
 * - Lista todas as conversas ativas
 * - Mostra última mensagem
 * - Badge de mensagens não lidas
 * - Click para abrir chat
 */
export const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (err) {
      setError('Erro ao carregar conversas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConversationClick = (userId) => {
    navigate(`/chat/${userId}`);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaComments className="mr-3 text-primary-600" />
              Mensagens
            </h1>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && conversations.length === 0 && (
            <div className="text-center py-12">
              <FaComments className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma conversa ainda
              </h3>
              <p className="text-gray-600">
                Comece uma conversa clicando na foto de um usuário na galeria!
              </p>
            </div>
          )}

          {/* Conversations List */}
          {!loading && conversations.length > 0 && (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => {
                const otherUser = conversation.other_user;
                const lastMessage = conversation.last_message;
                const unreadCount = conversation.unread_count;

                return (
                  <div
                    key={otherUser.id}
                    onClick={() => handleConversationClick(otherUser.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                      unreadCount > 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </div>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-semibold ${
                            unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {otherUser.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(lastMessage.created_at)}
                          </p>
                        </div>
                        
                        <p className={`text-sm truncate ${
                          unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}>
                          {lastMessage.sender_id === otherUser.id ? '' : 'Você: '}
                          {lastMessage.content}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {unreadCount > 0 && (
                        <FaCircle className="text-primary-600 text-xs" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
