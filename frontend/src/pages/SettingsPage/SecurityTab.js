import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, TriangleAlert } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FormInput } from '@/components/Form';
import { mediaApi } from '@/api/media';
import { authApi } from '@/api/auth';
import { changePasswordSchema, } from '@/schemas/profileSchema';
import { logger } from '@/utils/logger';
import { AxiosError } from 'axios';
export function SecurityTab() {
    const [message, setMessage] = useState(null);
    const methods = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });
    const { handleSubmit, reset, formState: { isSubmitting }, } = methods;
    const onPasswordSubmit = async (data) => {
        setMessage(null);
        try {
            await authApi.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setMessage({ type: 'success', text: 'Пароль успешно обновлен' });
            reset();
        }
        catch (e) {
            const err = e;
            const text = err.response?.status === 401
                ? 'Неверный текущий пароль'
                : err.response?.data?.message || 'Не удалось обновить пароль';
            setMessage({ type: 'error', text });
        }
    };
    const handleFactoryReset = async () => {
        try {
            await mediaApi.reset();
            toast.success('Данные успешно сброшены');
            window.location.href = '/';
        }
        catch (e) {
            logger.error(e);
            toast.error('Не удалось сбросить данные');
        }
    };
    return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 items-start", children: [_jsxs(Card, { className: "gap-3 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm", children: [_jsxs(CardHeader, { className: "px-4 pb-0", children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20", children: _jsx(Fingerprint, { className: "h-5 w-5" }) }), "\u0421\u043C\u0435\u043D\u0430 \u043F\u0430\u0440\u043E\u043B\u044F"] }), _jsx(CardDescription, { children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C \u0434\u043B\u044F \u0437\u0430\u0449\u0438\u0442\u044B \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430" })] }), _jsx(CardContent, { className: "px-4 pb-4", children: _jsx(FormProvider, { ...methods, children: _jsxs("form", { onSubmit: handleSubmit(onPasswordSubmit), className: "space-y-4", children: [_jsx(FormInput, { name: "currentPassword", label: "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C", type: "password", required: true, disabled: isSubmitting, className: "bg-background/50" }), _jsx(Separator, {}), _jsx(FormInput, { name: "newPassword", label: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C", type: "password", required: true, disabled: isSubmitting, description: "\u041D\u0435 \u043C\u0435\u043D\u0435\u0435 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432", className: "bg-background/50" }), _jsx(FormInput, { name: "confirmPassword", label: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435", type: "password", required: true, disabled: isSubmitting, className: "bg-background/50" }), message && (_jsx(Alert, { variant: message.type === 'error' ? 'destructive' : 'default', className: `animate-in fade-in zoom-in-95 ${message.type === 'success'
                                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                            : ''}`, children: _jsx(AlertDescription, { children: message.text }) })), _jsx(Button, { type: "submit", className: "w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-md transition-all mt-2", disabled: isSubmitting, children: isSubmitting ? 'Обновление...' : 'Обновить пароль' })] }) }) })] }), _jsxs(Card, { className: "gap-3 overflow-hidden border border-destructive/20 shadow-lg bg-destructive/5 backdrop-blur-sm", children: [_jsx(CardHeader, { className: "px-4 pb-0", children: _jsxs(CardTitle, { className: "flex items-center gap-3 text-destructive", children: [_jsx("div", { className: "p-2 rounded-xl bg-destructive/10 ring-1 ring-destructive/20", children: _jsx(TriangleAlert, { className: "h-5 w-5" }) }), "\u041E\u043F\u0430\u0441\u043D\u0430\u044F \u0437\u043E\u043D\u0430"] }) }), _jsx(CardContent, { className: "px-4 pb-4", children: _jsxs("div", { className: "p-3 border border-destructive/20 rounded-xl bg-background/50", children: [_jsx("h4", { className: "font-semibold text-destructive mb-1", children: "\u0421\u0431\u0440\u043E\u0441 \u0434\u0430\u043D\u043D\u044B\u0445" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "\u0423\u0434\u0430\u043B\u044F\u0435\u0442 \u0432\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F. \u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C." }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsx(Button, { variant: "destructive", className: "w-full shadow-sm hover:shadow-md transition-all", children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0435" }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\u0412\u044B \u0430\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u043E \u0443\u0432\u0435\u0440\u0435\u043D\u044B?" }), _jsx(AlertDialogDescription, { children: "\u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C. \u0412\u0441\u044F \u0432\u0430\u0448\u0430 \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u044F (\u0444\u0438\u043B\u044C\u043C\u044B, \u0436\u0430\u043D\u0440\u044B, \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u0438) \u0431\u0443\u0434\u0435\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u0430 \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430. \u0411\u0430\u0437\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0431\u0443\u0434\u0435\u0442 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u043E\u0447\u0438\u0449\u0435\u043D\u0430." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(AlertDialogAction, { onClick: handleFactoryReset, className: "bg-destructive hover:bg-destructive/90", children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0451" })] })] })] })] }) })] })] }));
}
