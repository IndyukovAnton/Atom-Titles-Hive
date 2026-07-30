import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
import { scheduleStartupUpdateCheck } from './utils/updater';
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
const PageLoader = () => (_jsx("div", { className: "flex items-center justify-center min-h-[50vh]", children: _jsx("div", { className: "w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" }) }));
// Protected Route Component
function ProtectedRoute({ children }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);
    // На refresh zustand persist восстанавливает token, но isAuthenticated пока false —
    // он станет true после initializeAuth(). Не редиректим на /login,
    // пока есть токен и идёт инициализация — иначе теряем deep-link на refresh.
    if (!isAuthenticated && token) {
        return _jsx(PageLoader, {});
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
// Checked Authorization Route Component
function CheckedAuthorizationRoute({ children, }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);
    // Симметрично: если есть token и идёт init — ждём, не показывая login-форму,
    // чтобы избежать мерцания «login → home».
    if (!isAuthenticated && token) {
        return _jsx(PageLoader, {});
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
function AppRoutes({ backendReady = true }) {
    const initializeAuth = useAuthStore((state) => state.initializeAuth);
    const [showLogo, setShowLogo] = useState(() => !sessionStorage.getItem('seen-splash-seen'));
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
    return (_jsxs(BrowserRouter, { children: [_jsx(ConnectionStatusBanner, {}), showLogo && _jsx(LoadingSplash, { onComplete: handleLogoComplete }), _jsx(MainLayout, { children: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(CheckedAuthorizationRoute, { children: _jsx(LoginPage, {}) }) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/auth/callback", element: _jsx(AuthCallbackPage, {}) }), _jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(HomePage, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(SettingsPage, {}) }) }), _jsx(Route, { path: "/changelog", element: _jsx(ProtectedRoute, { children: _jsx(ChangelogPage, {}) }) }), _jsx(Route, { path: "/privacy", element: _jsx(ProtectedRoute, { children: _jsx(PrivacyPolicyPage, {}) }) }), _jsx(Route, { path: "/levels-info", element: _jsx(ProtectedRoute, { children: _jsx(LevelsInfoPage, {}) }) }), _jsx(Route, { path: "/media/:id", element: _jsx(ProtectedRoute, { children: _jsx(MediaDetailPage, {}) }) }), _jsx(Route, { path: "/recommendations", element: _jsx(ProtectedRoute, { children: _jsx(RecommendationsPage, {}) }) }), _jsx(Route, { path: "/considerations", element: _jsx(ProtectedRoute, { children: _jsx(ConsiderationsPage, {}) }) }), _jsx(Route, { path: "/favorites", element: _jsx(ProtectedRoute, { children: _jsx(FavoritesPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) })] }));
}
function App() {
    const [backendReady, setBackendReady] = useState(false);
    // Тихая проверка обновлений один раз за сессию (только Tauri): при наличии
    // новой версии пользователь увидит персистентный тост, а не забытую кнопку
    // в настройках. Ошибки сети внутри глотаются.
    useEffect(() => {
        scheduleStartupUpdateCheck();
    }, []);
    const handleBackendReady = (url) => {
        // Устанавливаем URL для API клиента
        config.setApiUrl(url);
        logger.info(`[App] Backend ready at ${url}`);
        setBackendReady(true);
    };
    return (_jsx(PersonalizationProvider, { children: _jsxs(BackendLoader, { onReady: handleBackendReady, children: [_jsx(Toaster, { position: "bottom-right", richColors: true, closeButton: true, duration: 3000, toastOptions: {
                        style: {
                            padding: '16px',
                        },
                    } }), _jsx(AppRoutes, { backendReady: backendReady })] }) }));
}
export default App;
