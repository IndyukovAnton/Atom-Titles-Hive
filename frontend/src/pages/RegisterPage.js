import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/Form';
import { registerSchema } from '@/schemas/authSchema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { Separator } from '@/components/ui/separator';
export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register: registerUser, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();
    const methods = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });
    const { handleSubmit, register, formState: { errors }, } = methods;
    useEffect(() => {
        clearError();
    }, [clearError]);
    const onSubmit = async (data) => {
        clearError();
        try {
            await registerUser({
                username: data.username,
                email: data.email || undefined,
                password: data.password,
            });
            navigate('/');
        }
        catch {
            // Ошибка уже обработана в store
        }
    };
    return (_jsxs(AuthLayout, { error: error, children: [_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, className: "text-center space-y-1", children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-foreground", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0441\u0432\u043E\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "\u0418 \u043D\u0430\u0447\u043D\u0438\u0442\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u043E\u0432\u044B\u0432\u0430\u0442\u044C \u0432\u0430\u0448\u0443 \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044E" })] }), _jsx(FormProvider, { ...methods, children: _jsxs(motion.form, { onSubmit: handleSubmit(onSubmit), noValidate: true, className: "space-y-4", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.1 }, children: [_jsx(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.2 }, children: _jsx(FormInput, { name: "username", label: "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", required: true, disabled: isLoading, autoFocus: true, autoComplete: "username", className: "h-11", description: "\u0422\u043E\u043B\u044C\u043A\u043E \u043B\u0430\u0442\u0438\u043D\u0441\u043A\u0438\u0435 \u0431\u0443\u043A\u0432\u044B, \u0446\u0438\u0444\u0440\u044B, _ \u0438 -" }) }), _jsx(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.3 }, children: _jsx(FormInput, { name: "email", label: "Email", type: "email", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email", disabled: isLoading, autoComplete: "email", className: "h-11", description: "\u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u2014 \u0434\u043B\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430" }) }), _jsxs(motion.div, { className: "space-y-2", initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.4 }, children: [_jsxs(Label, { htmlFor: "password", children: ["\u041F\u0430\u0440\u043E\u043B\u044C", _jsx("span", { className: "text-destructive ml-1", children: "*" })] }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showPassword ? 'text' : 'password', id: "password", ...register('password'), placeholder: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C", disabled: isLoading, autoComplete: "new-password", className: cn('pr-10 h-11', errors.password && 'border-destructive focus-visible:ring-destructive'), "aria-invalid": !!errors.password }), _jsx("button", { type: "button", className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", onClick: () => setShowPassword(!showPassword), "aria-label": showPassword ? 'Скрыть пароль' : 'Показать пароль', tabIndex: -1, children: showPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] }), errors.password && (_jsx("p", { className: "text-sm text-destructive", role: "alert", children: errors.password.message }))] }), _jsxs(motion.div, { className: "space-y-2", initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.5 }, children: [_jsxs(Label, { htmlFor: "confirmPassword", children: ["\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C", _jsx("span", { className: "text-destructive ml-1", children: "*" })] }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showConfirmPassword ? 'text' : 'password', id: "confirmPassword", ...register('confirmPassword'), placeholder: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C", disabled: isLoading, autoComplete: "new-password", className: cn('pr-10 h-11', errors.confirmPassword && 'border-destructive focus-visible:ring-destructive'), "aria-invalid": !!errors.confirmPassword }), _jsx("button", { type: "button", className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", onClick: () => setShowConfirmPassword(!showConfirmPassword), "aria-label": showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль', tabIndex: -1, children: showConfirmPassword ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] }), errors.confirmPassword && (_jsx("p", { className: "text-sm text-destructive", role: "alert", children: errors.confirmPassword.message }))] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6 }, className: "space-y-4", children: [_jsxs(Button, { type: "submit", className: "w-full h-11 text-base font-medium", disabled: isLoading, children: [isLoading && _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), isLoading ? 'Регистрация...' : 'Зарегистрироваться'] }), _jsxs("div", { className: "relative py-1", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx(Separator, { className: "w-full" }) }), _jsx("div", { className: "relative flex justify-center text-xs uppercase", children: _jsx("span", { className: "bg-card px-2 text-muted-foreground", children: "\u0418\u043B\u0438" }) })] }), _jsx(GoogleLoginButton, { text: "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u0447\u0435\u0440\u0435\u0437 Google" })] })] }) }), _jsxs(motion.div, { className: "text-center text-sm text-muted-foreground", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.7 }, children: ["\u0423\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442?", ' ', _jsx(Link, { to: "/login", className: "text-primary hover:underline font-medium", children: "\u0412\u043E\u0439\u0442\u0438" })] })] }));
}
