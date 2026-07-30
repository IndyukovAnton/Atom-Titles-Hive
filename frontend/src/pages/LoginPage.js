import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { loginSchema } from '@/schemas/authSchema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { Separator } from '@/components/ui/separator';
export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();
    const methods = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });
    const { handleSubmit, register, formState: { errors }, } = methods;
    useEffect(() => {
        clearError();
    }, [clearError]);
    const onSubmit = useCallback(async (data) => {
        clearError();
        try {
            await login(data.username, data.password);
            navigate('/');
        }
        catch {
            // Ошибка уже обработана в store
        }
    }, [clearError, login, navigate]);
    return (_jsxs(AuthLayout, { error: error, children: [_jsxs("div", { className: "text-center space-y-1", children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground", children: "\u0421 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u0435\u043C" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "\u0412\u043E\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C" })] }), _jsx(FormProvider, { ...methods, children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), noValidate: true, className: "space-y-4", children: [_jsx(FormInput, { name: "username", label: "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", required: true, disabled: isLoading, autoFocus: true, autoComplete: "username", className: "h-11" }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "password", children: ["\u041F\u0430\u0440\u043E\u043B\u044C", _jsx("span", { className: "text-destructive ml-1", children: "*" })] }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showPassword ? 'text' : 'password', id: "password", ...register('password'), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C", disabled: isLoading, autoComplete: "current-password", className: cn('pr-10 h-11', errors.password && 'border-destructive focus-visible:ring-destructive'), "aria-invalid": !!errors.password }), _jsx("button", { type: "button", className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", onClick: () => setShowPassword(!showPassword), "aria-label": showPassword ? 'Скрыть пароль' : 'Показать пароль', tabIndex: -1, children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] }), errors.password && (_jsx("p", { className: "text-sm text-destructive", role: "alert", children: errors.password.message }))] }), _jsxs(Button, { type: "submit", className: "w-full h-11 text-base shadow-lg hover:shadow-primary/25 transition-all", disabled: isLoading, children: [isLoading && _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), isLoading ? 'Вход...' : 'Войти'] }), _jsxs("div", { className: "relative py-1", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx(Separator, { className: "w-full" }) }), _jsx("div", { className: "relative flex justify-center text-xs uppercase", children: _jsx("span", { className: "bg-card px-2 text-muted-foreground", children: "\u0418\u043B\u0438" }) })] }), _jsx(GoogleLoginButton, {})] }) }), _jsxs("div", { className: "text-center text-sm text-muted-foreground", children: ["\u041D\u0435\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430?", ' ', _jsx(Link, { to: "/register", className: "text-primary hover:underline font-medium", children: "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F" })] })] }));
}
