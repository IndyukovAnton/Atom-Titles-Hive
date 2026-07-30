import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Blocks, Cpu, FlaskConical, Save } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { GENERIC_AI_PROVIDERS } from '@/components/personalization/providers.constants';
import { useAuthStore } from '@/store/authStore';
import { usePersonalization } from '@/hooks/usePersonalization';
import { stripAiKey, useAiKeyPersistence } from '@/hooks/useAiKeyPersistence';
import { logger } from '@/utils/logger';
/**
 * Таб «Провайдеры» — настройки альтернативных AI-провайдеров.
 * Задел на будущее: рекомендации сейчас работают через Claude / Codex
 * (таб «Интеграции & AI»), эти поля сохраняются в профиль для следующих фич.
 */
export function ProvidersTab() {
    const { user } = useAuthStore();
    const { aiKey } = usePersonalization();
    const persistAiKey = useAiKeyPersistence();
    const [draft, setDraft] = useState(() => ({
        aiProvider: user?.preferences?.aiProvider,
        aiLimits: user?.preferences?.aiLimits,
        aiKey: aiKey || undefined,
    }));
    const [isSaving, setIsSaving] = useState(false);
    const handleLimitChange = (field, value) => {
        const numValue = parseInt(value) || 0;
        setDraft((prev) => ({
            ...prev,
            aiLimits: {
                ...prev.aiLimits,
                [field]: numValue,
            },
        }));
    };
    const handleSave = async () => {
        if (isSaving)
            return;
        setIsSaving(true);
        try {
            persistAiKey(draft.aiKey);
            const safePrefs = stripAiKey(draft);
            await useAuthStore.getState().updateProfile({
                preferences: {
                    ...user?.preferences,
                    ...safePrefs,
                },
            });
            toast.success('Настройки провайдеров сохранены');
        }
        catch (e) {
            toast.error('Ошибка сохранения настроек');
            logger.error(e);
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start", children: [_jsxs(Card, { className: "overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm lg:col-span-2", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20", children: _jsx(Blocks, { className: "h-5 w-5" }) }), "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u044B", _jsxs(Badge, { variant: "secondary", className: "ml-auto text-[10px] uppercase tracking-wider", children: [_jsx(FlaskConical, { className: "w-3 h-3 mr-1" }), "\u0421\u043A\u043E\u0440\u043E"] })] }), _jsx(CardDescription, { children: "OpenAI, Gemini, Cohere \u0438 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 LLM. \u0421\u0435\u0439\u0447\u0430\u0441 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0447\u0435\u0440\u0435\u0437 Claude / Codex \u2014 \u044D\u0442\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0434\u043B\u044F \u0431\u0443\u0434\u0443\u0449\u0438\u0445 \u0444\u0438\u0447." })] }), _jsxs(CardContent, { className: "space-y-5", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "ai-provider", children: "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440" }), _jsxs(Select, { value: draft.aiProvider || '', onValueChange: (provider) => setDraft((prev) => ({ ...prev, aiProvider: provider })), children: [_jsx(SelectTrigger, { id: "ai-provider", children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430" }) }), _jsx(SelectContent, { children: GENERIC_AI_PROVIDERS.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "ai-key", children: "API key" }), _jsx(Input, { id: "ai-key", type: "password", placeholder: user?.preferences?.hasAiKey
                                            ? 'Ключ сохранён — введите новый для замены'
                                            : 'sk-...', value: draft.aiKey || '', onChange: (e) => setDraft((prev) => ({ ...prev, aiKey: e.target.value })), autoComplete: "off" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u041A\u043B\u044E\u0447 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E \u043D\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435 \u0438 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440." })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "daily-requests", className: "text-xs", children: "\u041B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432/\u0434\u0435\u043D\u044C" }), _jsx(Input, { id: "daily-requests", type: "number", min: "0", placeholder: "100", value: draft.aiLimits?.dailyRequests || '', onChange: (e) => handleLimitChange('dailyRequests', e.target.value) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "max-tokens", className: "text-xs", children: "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0442\u043E\u043A\u0435\u043D\u043E\u0432" }), _jsx(Input, { id: "max-tokens", type: "number", min: "0", placeholder: "4000", value: draft.aiLimits?.maxTokens || '', onChange: (e) => handleLimitChange('maxTokens', e.target.value) })] })] }), _jsx("div", { className: "flex justify-end pt-4 border-t", children: _jsxs(Button, { onClick: handleSave, disabled: isSaving, className: "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all", children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), isSaving ? 'Сохраняю…' : 'Сохранить'] }) })] })] }), _jsxs(Card, { className: "overflow-hidden border-0 shadow-lg bg-background/60 backdrop-blur-sm", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-3 text-base", children: [_jsx("div", { className: "p-2 rounded-xl bg-muted text-muted-foreground ring-1 ring-border", children: _jsx(Cpu, { className: "h-4 w-4" }) }), "\u041A\u0430\u043A \u044D\u0442\u043E \u0431\u0443\u0434\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C"] }) }), _jsxs(CardContent, { className: "text-sm text-muted-foreground space-y-3", children: [_jsx("p", { children: "\u0412 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0445 \u0432\u0435\u0440\u0441\u0438\u044F\u0445 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0441\u043C\u043E\u0436\u0435\u0442 \u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u043D\u0430\u0440\u0430\u0432\u043D\u0435 \u0441 Claude \u0438 Codex \u2014 \u0431\u0435\u0437 \u0432\u0432\u043E\u0434\u0430 \u043A\u043B\u044E\u0447\u0430 \u0437\u0430\u043D\u043E\u0432\u043E." }), _jsx("p", { children: "\u041B\u0438\u043C\u0438\u0442\u044B (\u0437\u0430\u043F\u0440\u043E\u0441\u044B/\u0434\u0435\u043D\u044C \u0438 \u0442\u043E\u043A\u0435\u043D\u044B) \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0430\u0442 \u0440\u0430\u0441\u0445\u043E\u0434\u044B \u043F\u0440\u0438 \u043E\u0431\u043B\u0430\u0447\u043D\u044B\u0445 \u0432\u044B\u0437\u043E\u0432\u0430\u0445." })] })] })] }));
}
