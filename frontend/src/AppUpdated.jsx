import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { GalleryGroupedPage } from './pages/GalleryGroupedPage'; // NOVO
import { UploadPageMultiple } from './pages/UploadPageMultiple'; // ATUALIZADO
import { MyPhotosPageUpdated } from './pages/MyPhotosPageUpdated'; // ATUALIZADO
import { UserPhotosPage } from './pages/UserPhotosPage'; // NOVO
import { AdminPage } from './pages/AdminPage';

/**
 * FUNDAMENTO: React Router v6 com Novas Rotas
 * 
 * MUDANÇAS:
 * 1. Galeria agrupada por usuário (/)
 * 2. Upload múltiplo (/upload)
 * 3. Minhas fotos com deletar (/my-photos)
 * 4. Fotos de usuário específico (/user/:userId)
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

      {/* NOVA: Ver fotos de usuário específico */}
      <Route
        path="/user/:userId"
        element={
          <PrivateRoute>
            <UserPhotosPage />
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
