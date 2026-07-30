import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ArrowRight, Blocks, Bot, Key, Save, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/utils/app-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AISettings } from '@/components/personalization/AISettings';
import { useAuthStore } from '@/store/authStore';
import { usePersonalization } from '@/hooks/usePersonalization';
import { stripAiKey, useAiKeyPersistence } from '@/hooks/useAiKeyPersistence';
import { logger } from '@/utils/logger';
export function IntegrationsTab() {
    const { user } = useAuthStore();
    const { aiKey } = usePersonalization();
    const persistAiKey = useAiKeyPersistence();
    const [tempPreferences, setTempPreferences] = useState(() => ({
        ...(user?.preferences || {}),
        aiKey: aiKey || user?.preferences?.aiKey,
    }));
    const handleAIPreferencesChange = (aiPrefs) => {
        setTempPreferences((prev) => ({ ...prev, ...aiPrefs }));
    };
    const handleApplyAi = async () => {
        try {
            persistAiKey(tempPreferences.aiKey);
            const safePrefs = stripAiKey(tempPreferences);
            await useAuthStore.getState().updateProfile({
                preferences: {
                    ...user?.preferences,
                    ...safePrefs,
                },
            });
            toast.success('Настройки AI успешно применены');
        }
        catch (e) {
            toast.error('Ошибка сохранения настроек');
            logger.error(e);
        }
    };
    const handleSaveTmdb = async () => {
        try {
            await useAuthStore.getState().updateProfile({
                preferences: {
                    ...user?.preferences,
                    ...tempPreferences,
                },
            });
            toast.success('Ключ TMDB сохранен');
        }
        catch {
            toast.error('Ошибка сохранения');
        }
    };
    return (_jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6 items-start", children: [_jsxs(Card, { className: "overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm xl:col-span-2", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20", children: _jsx(Bot, { className: "h-5 w-5" }) }), "\u0418\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442"] }), _jsx(CardDescription, { children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0432\u0438\u0436\u043E\u043A \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0435\u0433\u043E \u043F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsx(AISettings, { preferences: tempPreferences, onChange: handleAIPreferencesChange }), _jsx("div", { className: "flex justify-end pt-4 border-t", children: _jsxs(Button, { onClick: handleApplyAi, className: "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all", children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), " \u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 AI"] }) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20", children: _jsx(Key, { className: "h-5 w-5" }) }), "\u041A\u0438\u043D\u043E\u0441\u0435\u0440\u0432\u0438\u0441\u044B (TMDB)"] }), _jsx(CardDescription, { children: "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E \u0444\u0438\u043B\u044C\u043C\u0430\u0445" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsx(Label, { htmlFor: "tmdb-key", className: "text-xs uppercase text-muted-foreground font-bold tracking-wider", children: "TMDB API Key" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "tmdb-key", type: "password", placeholder: tempPreferences.hasTmdbApiKey
                                                            ? 'Ключ сохранён — введите новый для замены'
                                                            : 'Введите токен доступа...', value: tempPreferences.tmdbApiKey || '', onChange: (e) => setTempPreferences((prev) => ({
                                                            ...prev,
                                                            tmdbApiKey: e.target.value,
                                                        })), className: "font-mono text-sm pl-10 focus-visible:ring-cyan-500" }), _jsx("div", { className: "absolute left-3 top-2.5 text-muted-foreground", children: _jsx(Key, { className: "w-4 h-4" }) })] }), _jsxs("p", { className: "text-xs text-muted-foreground leading-relaxed", children: ["\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430 \u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0445 \u0438 \u043F\u043E\u0441\u0442\u0435\u0440\u043E\u0432. \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043A\u043B\u044E\u0447 \u043D\u0430", ' ', _jsx("a", { href: "https://www.themoviedb.org/settings/api", target: "_blank", rel: "noreferrer", className: "underline hover:text-cyan-500 transition-colors", children: "themoviedb.org" }), "."] })] }), _jsxs(Button, { onClick: handleSaveTmdb, variant: "outline", className: "w-full border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-600", children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), " \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043A\u043B\u044E\u0447"] })] })] }), _jsxs(Link, { to: "/settings?tab=providers", className: "group flex items-center gap-3 rounded-xl border bg-background/60 backdrop-blur-sm px-4 py-3.5 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition-all duration-300", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20", children: _jsx(Blocks, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-semibold", children: "\u0414\u0440\u0443\u0433\u0438\u0435 AI-\u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u044B" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "OpenAI, Gemini, Cohere \u2014 \u0437\u0430\u0434\u0435\u043B \u043D\u0430 \u0431\u0443\u0434\u0443\u0449\u0438\u0435 \u0444\u0438\u0447\u0438" })] }), _jsx(ArrowRight, { className: "w-4 h-4 text-muted-foreground/40 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" })] })] })] }));
}
