import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import { useAuthStore } from './store/authStore';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { Toaster } from 'sonner';
import MainLayout from './layouts/MainLayout';
import { LoadingSplash } from './components/loading/LoadingSplash';
import { ConnectionStatusBanner } from './components/ui/ConnectionStatusBanner';
import { BackendLoader } from './components/ui/BackendLoader';
import { config } from './config';

// Lazy-loaded pages для code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MediaDetailPage = lazy(() => import('./pages/MediaDetailPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

// Page loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

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

interface AppRoutesProps {
  backendReady?: boolean;
}

function AppRoutes({ backendReady = true }: AppRoutesProps) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [showLogo, setShowLogo] = useState(() => !sessionStorage.getItem('atom-hive-splash-seen'));

  useEffect(() => {
    // Вызываем initializeAuth только после того как backend URL установлен
    if (backendReady) {
      initializeAuth();
    }
  }, [initializeAuth, backendReady]);

  const handleLogoComplete = () => {
    setShowLogo(false);
    sessionStorage.setItem('atom-hive-splash-seen', 'true');
  };

  return (
    <BrowserRouter>
      <ConnectionStatusBanner />
      {showLogo && <LoadingSplash onComplete={handleLogoComplete} />}
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
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
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
            path="/changelog"
            element={
              <ProtectedRoute>
                <ChangelogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy"
            element={
              <ProtectedRoute>
                <PrivacyPolicyPage />
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
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <RecommendationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </BrowserRouter>
  );
}

function App() {
  const [backendReady, setBackendReady] = useState(false);

  const handleBackendReady = (url: string) => {
    // Устанавливаем URL для API клиента
    config.setApiUrl(url);
    console.log(`[App] Backend ready at ${url}`);
    setBackendReady(true);
  };

  return (
    <PersonalizationProvider>
      <BackendLoader onReady={handleBackendReady}>
        <Toaster position="top-right" richColors />
        <AppRoutes backendReady={backendReady} />
      </BackendLoader>
    </PersonalizationProvider>
  );
}

export default App;
