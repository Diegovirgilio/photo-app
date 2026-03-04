import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { GalleryPage } from './pages/GalleryPage';
import { UploadPage } from './pages/UploadPage';
import { MyPhotosPage } from './pages/MyPhotosPage';
import { AdminPage } from './pages/AdminPage';

/**
 * FUNDAMENTO: React Router v6
 * 
 * MOTIVO:
 * - Navegação client-side (SPA)
 * - Rotas protegidas (requer autenticação)
 * - Nested routes (layouts)
 */

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route: redirect to gallery if logged in */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <GalleryPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <PrivateRoute>
            <UploadPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/my-photos"
        element={
          <PrivateRoute>
            <MyPhotosPage />
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

      {/* Fallback: redirect to gallery */}
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
