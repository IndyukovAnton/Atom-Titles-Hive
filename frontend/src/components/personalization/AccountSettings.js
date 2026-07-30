import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, User, Mail, Calendar, LogOut, Loader2, } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import axios from 'axios';
import { logger } from '@/utils/logger';
export function AccountSettings() {
    const { user, updateProfile, logout } = useAuthStore();
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        birthDate: user?.birthDate
            ? new Date(user.birthDate).toISOString().split('T')[0]
            : '',
    });
    const fileInputRef = useRef(null);
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (file.size > 2 * 1024 * 1024) {
            // 2MB limit
            toast.error('Файл слишком большой (макс. 2MB)');
            return;
        }
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;
                // Save to preferences as a "poor man's" avatar storage
                // ideally this should be a real file upload endpoint
                await updateProfile({
                    preferences: {
                        ...user?.preferences,
                        avatar: base64,
                    },
                });
                toast.success('Аватар обновлен');
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
        catch (error) {
            logger.error(error);
            toast.error('Ошибка загрузки аватара');
            setIsUploading(false);
        }
    };
    const handleSaveProfile = async () => {
        try {
            if (!formData.username.trim()) {
                toast.error('Заполните имя пользователя');
                return;
            }
            await updateProfile({
                username: formData.username,
                email: formData.email.trim() || undefined,
                birthDate: formData.birthDate || undefined,
            });
            toast.success('Профиль обновлен');
        }
        catch (error) {
            logger.error(error);
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                toast.error('Имя пользователя или Email уже заняты');
            }
            else {
                toast.error('Не удалось обновить профиль');
            }
        }
    };
    return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs(Card, { className: "gap-3 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm md:col-span-2", children: [_jsxs(CardHeader, { className: "px-4 pb-2", children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400", children: _jsx(User, { className: "h-5 w-5" }) }), "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"] }), _jsx(CardDescription, { children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043B\u0438\u0447\u043D\u043E\u0439 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0435\u0439" })] }), _jsx(CardContent, { className: "px-4 pb-4 space-y-5", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-8 items-center sm:items-start animate-in fade-in duration-500", children: [_jsxs("div", { className: "relative group cursor-pointer", onClick: handleAvatarClick, children: [_jsxs(Avatar, { className: "h-32 w-32 border-4 border-background shadow-2xl transition-transform group-hover:scale-105 group-hover:ring-4 ring-primary/20", children: [_jsx(AvatarImage, { src: user?.preferences?.avatar || undefined, className: "object-cover" }), _jsx(AvatarFallback, { className: "text-4xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary", children: user?.username?.[0]?.toUpperCase() })] }), _jsx("div", { className: "absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]", children: _jsx(Camera, { className: "w-8 h-8 text-white drop-shadow-md" }) }), isUploading && (_jsx("div", { className: "absolute inset-0 bg-background/60 rounded-full flex items-center justify-center", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) })), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/jpeg,image/png,image/webp", className: "hidden", onChange: handleFileChange })] }), _jsxs("div", { className: "space-y-5 flex-1 w-full max-w-md", children: [_jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "username", className: "text-muted-foreground", children: "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "username", value: formData.username, onChange: (e) => setFormData((prev) => ({
                                                                ...prev,
                                                                username: e.target.value,
                                                            })), className: "pl-9" })] })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "email", className: "text-muted-foreground", children: "Email \u0430\u0434\u0440\u0435\u0441 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => setFormData((prev) => ({
                                                                ...prev,
                                                                email: e.target.value,
                                                            })), className: "pl-9" })] })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "birth-date", className: "text-muted-foreground", children: "\u0414\u0430\u0442\u0430 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F" }), _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "birth-date", type: "date", className: "flex h-10 w-full rounded-lg border border-input bg-background/50 pl-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono", value: formData.birthDate, onChange: (e) => setFormData((prev) => ({
                                                                ...prev,
                                                                birthDate: e.target.value,
                                                            })) })] })] }), _jsx("div", { className: "pt-2", children: _jsxs(Button, { onClick: handleSaveProfile, className: "w-full sm:w-auto min-w-[140px]", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), " \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"] }) })] })] }) })] }), _jsx("div", { className: "flex flex-col gap-6", children: _jsx(Card, { className: "gap-3 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm h-fit", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs(Button, { variant: "destructive", className: "w-full justify-start pl-4", onClick: logout, children: [_jsx(LogOut, { className: "mr-3 h-5 w-5" }), " \u0412\u044B\u0439\u0442\u0438 \u0438\u0437 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430"] }), _jsx("p", { className: "text-xs text-muted-foreground mt-4 text-center px-4", children: "\u0412\u044B\u0445\u043E\u0434 \u0438\u0437 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430 \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435. \u0412\u0430\u0448\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\u0441\u0442\u0430\u043D\u0443\u0442\u0441\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B." })] }) }) })] }));
}
