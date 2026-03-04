import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

/**
 * FUNDAMENTO: Direct Message Chat Interface
 * 
 * MOTIVO:
 * - Chat 1:1 em tempo real
 * - Auto-scroll para última mensagem
 * - Marcar como lida automaticamente
 * - Refresh periódico (polling)
 */
export const ChatPage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const data = await messageService.getConversation(parseInt(userId));
      setMessages(data);
      
      // Pega info do outro usuário da primeira mensagem
      if (data.length > 0) {
        const otherUserId = parseInt(userId);
        const firstMsg = data[0];
        
        if (firstMsg.sender_id === otherUserId) {
          setOtherUser(firstMsg.sender);
        } else {
          // Buscar do receiver (se a primeira msg foi enviada por current_user)
          // Na prática, precisamos de um endpoint separado ou incluir sempre
          // Vamos assumir que temos o sender
          const lastMsg = data[data.length - 1];
          if (lastMsg.sender_id === otherUserId) {
            setOtherUser(lastMsg.sender);
          }
        }
      }
      
      scrollToBottom();
    } catch (err) {
      setError('Erro ao carregar mensagens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    
    // Polling: atualiza mensagens a cada 3 segundos
    const interval = setInterval(loadMessages, 3000);
    
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    
    try {
      await messageService.sendMessage(parseInt(userId), newMessage.trim());
      setNewMessage('');
      
      // Recarregar mensagens imediatamente
      await loadMessages();
      
      // Foco no input
      inputRef.current?.focus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return date.toLocaleDateString('pt-BR');
  };

  // Agrupar mensagens por data
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl w-full mx-auto bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center space-x-4">
          <button
            onClick={() => navigate('/messages')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="text-xl" />
          </button>

          {otherUser && (
            <>
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {otherUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{otherUser.name}</h2>
                <p className="text-xs text-gray-500">{otherUser.email}</p>
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Nenhuma mensagem ainda. Envie a primeira mensagem!
              </p>
            </div>
          )}

          {Object.keys(groupedMessages).map((date) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDate(date)}
                </span>
              </div>

              {/* Messages for this date */}
              {groupedMessages[date].map((message) => {
                const isMine = message.sender_id === currentUser?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isMine
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isMine ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                        {isMine && message.is_read && (
                          <span className="ml-1">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
