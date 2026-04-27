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
import { logger } from './utils/logger';

// Lazy-loaded pages для code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MediaDetailPage = lazy(() => import('./pages/MediaDetailPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const ConsiderationsPage = lazy(() => import('./pages/ConsiderationsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const LevelsInfoPage = lazy(() => import('./pages/LevelsInfoPage'));

// Page loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  // На refresh zustand persist восстанавливает token, но isAuthenticated пока false —
  // он станет true после initializeAuth(). Не редиректим на /login,
  // пока есть токен и идёт инициализация — иначе теряем deep-link на refresh.
  if (!isAuthenticated && token) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Checked Authorization Route Component
function CheckedAuthorizationRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  // Симметрично: если есть token и идёт init — ждём, не показывая login-форму,
  // чтобы избежать мерцания «login → home».
  if (!isAuthenticated && token) {
    return <PageLoader />;
  }

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
  const [showLogo, setShowLogo] = useState(
    () => !sessionStorage.getItem('seen-splash-seen'),
  );

  useEffect(() => {
    // Вызываем initializeAuth только после того как backend URL установлен
    if (backendReady) {
      initializeAuth();
    }
  }, [initializeAuth, backendReady]);

  const handleLogoComplete = () => {
    setShowLogo(false);
    sessionStorage.setItem('seen-splash-seen', 'true');
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
              path="/levels-info"
              element={
                <ProtectedRoute>
                  <LevelsInfoPage />
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
            <Route
              path="/considerations"
              element={
                <ProtectedRoute>
                  <ConsiderationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <FavoritesPage />
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
    logger.info(`[App] Backend ready at ${url}`);
    setBackendReady(true);
  };

  return (
    <PersonalizationProvider>
      <BackendLoader onReady={handleBackendReady}>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={3000}
          toastOptions={{
            style: {
              padding: '16px',
            },
          }}
        />
        <AppRoutes backendReady={backendReady} />
      </BackendLoader>
    </PersonalizationProvider>
  );
}

export default App;
