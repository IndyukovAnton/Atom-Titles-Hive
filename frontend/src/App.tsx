import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MediaDetailPage from './pages/MediaDetailPage';
import MainLayout from './layouts/MainLayout';
import { LoadingSplash } from './components/loading/LoadingSplash';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Checked Authorization Route Component
function CheckedAuthorizationRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [showLogo, setShowLogo] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Показываем онбординг только если:
    // 1. Пользователь авторизован
    // 2. Загрузка завершена
    // 3. Пользователь не завершил онбординг
    if (isAuthenticated && user && !showLogo && !user.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [isAuthenticated, user, showLogo]);

  const handleLogoComplete = () => {
    setShowLogo(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <BrowserRouter>
      {showLogo && <LoadingSplash onComplete={handleLogoComplete} />}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={handleOnboardingComplete} />
      )}
      <MainLayout>
        <Routes>
          <Route
            path="/login"
            element={
              <CheckedAuthorizationRoute>
                <LoginPage />
              </CheckedAuthorizationRoute>
            }
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media/:id"
            element={
              <ProtectedRoute>
                <MediaDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <PersonalizationProvider>
      <Toaster position="top-right" richColors />
      <AppRoutes />
    </PersonalizationProvider>
  );
}

export default App;
