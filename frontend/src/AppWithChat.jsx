import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { GalleryGroupedPage } from './pages/GalleryGroupedPage';
import { UploadPageMultiple } from './pages/UploadPageMultiple';
import { MyPhotosPageUpdated } from './pages/MyPhotosPageUpdated';
import { UserPhotosPage } from './pages/UserPhotosPage';
import { AdminPage } from './pages/AdminPage';
import { MessagesPage } from './pages/MessagesPage'; // NOVO
import { ChatPage } from './pages/ChatPage'; // NOVO

/**
 * FUNDAMENTO: React Router v6 com Chat
 * 
 * NOVAS ROTAS:
 * - /messages - Lista de conversas
 * - /chat/:userId - Chat individual
 */

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <GalleryGroupedPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <PrivateRoute>
            <UploadPageMultiple />
          </PrivateRoute>
        }
      />

      <Route
        path="/my-photos"
        element={
          <PrivateRoute>
            <MyPhotosPageUpdated />
          </PrivateRoute>
        }
      />

      <Route
        path="/user/:userId"
        element={
          <PrivateRoute>
            <UserPhotosPage />
          </PrivateRoute>
        }
      />

      {/* NOVO: Mensagens */}
      <Route
        path="/messages"
        element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        }
      />

      {/* NOVO: Chat individual */}
      <Route
        path="/chat/:userId"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />

      {/* Admin-only route */}
      <Route
        path="/admin"
        element={
          <PrivateRoute requireAdmin={true}>
            <AdminPage />
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
