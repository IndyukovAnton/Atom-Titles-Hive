import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from '@/utils/app-toast';
import { logger } from '../utils/logger';
const AuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setToken } = useAuthStore();
    useEffect(() => {
        // Токен приходит во фрагменте (#token=...) — так он не попадает
        // в серверные логи и Referer. Query-параметр оставлен как fallback.
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const token = hashParams.get('token') ?? searchParams.get('token');
        if (token) {
            // Сразу убираем токен из адресной строки, чтобы он не остался в истории.
            window.history.replaceState(null, '', window.location.pathname);
            setToken(token)
                .then(() => {
                toast.success('Авторизация прошла успешно!');
                navigate('/');
            })
                .catch((error) => {
                logger.error('Auth callback error:', error);
                toast.error('Ошибка авторизации через Google');
                navigate('/login');
            });
        }
        else {
            toast.error('Токен не найден в ответе сервера');
            navigate('/login');
        }
    }, [searchParams, setToken, navigate]);
    return (_jsx("div", { className: "flex flex-col items-center justify-center min-h-screen bg-background", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "text-lg font-medium animate-pulse", children: "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438..." })] }) }));
};
export default AuthCallbackPage;
