import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Eye, Moon, Palette, RotateCcw, Save, Sun, Type } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { BackgroundSelector } from '@/components/personalization/BackgroundSelector';
import { FontSettings } from '@/components/personalization/FontSettings';
import { usePersonalization } from '@/hooks/usePersonalization';
import { logger } from '@/utils/logger';
export function AppearanceTab() {
    const { theme, toggleTheme, background, setBackground, fontFamily, setFontFamily, fontSize, setFontSize, addEntryPreviewStyle, setAddEntryPreviewStyle, savePreferences, } = usePersonalization();
    // Draft-state для шрифта и размера: пикеры обновляют ТОЛЬКО предпросмотр,
    // глобальное применение и запись в БД — по кнопке «Сохранить».
    const [draftFontFamily, setDraftFontFamily] = useState(fontFamily);
    const [draftFontSize, setDraftFontSize] = useState(fontSize);
    // Если applied-значение пришло извне (логин, refetch профиля) — синкаем draft.
    useEffect(() => {
        setDraftFontFamily(fontFamily);
    }, [fontFamily]);
    useEffect(() => {
        setDraftFontSize(fontSize);
    }, [fontSize]);
    const typographyDirty = draftFontFamily !== fontFamily || draftFontSize !== fontSize;
    const handleSave = async () => {
        try {
            await savePreferences();
            toast.success('Настройки персонализации сохранены');
        }
        catch (error) {
            logger.error('Failed to save preferences:', error);
            toast.error('Не удалось сохранить настройки');
        }
    };
    const handleSaveTypography = async () => {
        try {
            // Применяем draft в context, чтобы DOM обновился сразу.
            setFontFamily(draftFontFamily);
            setFontSize(draftFontSize);
            // savePreferences читает старый context; передаём overrides явно.
            await savePreferences({
                fontFamily: draftFontFamily,
                fontSize: draftFontSize,
            });
            toast.success('Шрифт применён ко всему сайту');
        }
        catch (error) {
            logger.error('Failed to save typography:', error);
            toast.error('Не удалось сохранить шрифт');
        }
    };
    const handleResetTypography = () => {
        setDraftFontFamily(fontFamily);
        setDraftFontSize(fontSize);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "gap-3 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm", children: [_jsxs(CardHeader, { className: "px-4 pb-2", children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20", children: _jsx(Palette, { className: "h-5 w-5" }) }), "\u0422\u0435\u043C\u0430 \u0438 \u0444\u043E\u043D"] }), _jsx(CardDescription, { children: "\u0426\u0432\u0435\u0442\u043E\u0432\u0430\u044F \u0441\u0445\u0435\u043C\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u0438 \u0444\u043E\u043D \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430" })] }), _jsxs(CardContent, { className: "px-4 pb-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20", children: [_jsx(Sun, { className: "h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" }), _jsx(Moon, { className: "absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100", style: { marginTop: '-16px', marginLeft: '0px' } })] }), _jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base font-medium", children: "\u0422\u0451\u043C\u043D\u0430\u044F \u0442\u0435\u043C\u0430" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "\u0421\u043D\u0438\u0436\u0430\u0435\u0442 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0443 \u043D\u0430 \u0433\u043B\u0430\u0437\u0430" })] })] }), _jsx(Switch, { checked: theme === 'dark', onCheckedChange: toggleTheme, className: "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600" })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { className: "text-base font-medium", children: "\u0417\u0430\u0434\u043D\u0438\u0439 \u0444\u043E\u043D" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0439\u0442\u0435 \u0440\u0430\u0431\u043E\u0447\u0435\u0435 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E" })] }), _jsx(BackgroundSelector, { value: background, onChange: setBackground }), _jsxs(Button, { onClick: handleSave, variant: "outline", className: "w-full border-purple-500/20 hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400 group", children: [_jsx(Save, { className: "mr-2 h-4 w-4 group-hover:scale-110 transition-transform" }), "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0442\u0435\u043C\u0443 \u0438 \u0444\u043E\u043D"] })] })] })] }), _jsxs(Card, { className: "gap-3 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm", children: [_jsxs(CardHeader, { className: "px-4 pb-2", children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20", children: _jsx(Type, { className: "h-5 w-5" }) }), "\u0422\u0438\u043F\u043E\u0433\u0440\u0430\u0444\u0438\u043A\u0430"] }), _jsx(CardDescription, { children: "\u0420\u0430\u0437\u043C\u0435\u0440 \u0438 \u0441\u0435\u043C\u0435\u0439\u0441\u0442\u0432\u043E \u0448\u0440\u0438\u0444\u0442\u0430 \u0434\u043B\u044F \u043A\u043E\u043C\u0444\u043E\u0440\u0442\u043D\u043E\u0433\u043E \u0447\u0442\u0435\u043D\u0438\u044F" })] }), _jsxs(CardContent, { className: "px-4 pb-4 space-y-4", children: [_jsx(FontSettings, { fontFamily: draftFontFamily, fontSize: draftFontSize, onFontFamilyChange: setDraftFontFamily, onFontSizeChange: setDraftFontSize }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsxs(Button, { onClick: handleSaveTypography, disabled: !typographyDirty, className: "flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), " \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"] }), _jsxs(Button, { onClick: handleResetTypography, variant: "outline", disabled: !typographyDirty, className: "sm:w-auto", children: [_jsx(RotateCcw, { className: "mr-2 h-4 w-4" }), " \u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C"] })] }), typographyDirty && (_jsx("p", { className: "text-xs text-muted-foreground -mt-3", children: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0432\u0438\u0434\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u00AB\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C\u00BB, \u0447\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0438\u0445 \u0432\u043E \u0432\u0441\u0451\u043C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438." }))] })] }), _jsxs(Card, { className: "gap-3 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/60 backdrop-blur-sm", children: [_jsxs(CardHeader, { className: "px-4 pb-2", children: [_jsxs(CardTitle, { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-1 ring-pink-500/20", children: _jsx(Eye, { className: "h-5 w-5" }) }), "\u0421\u0442\u0438\u043B\u044C \u043F\u0440\u0435\u0432\u044C\u044E \u0437\u0430\u043F\u0438\u0441\u0438"] }), _jsx(CardDescription, { children: "\u041A\u0430\u043A \u0431\u0443\u0434\u0435\u0442 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u0442\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430-\u043F\u0440\u0435\u0432\u044C\u044E \u0432 \u0444\u043E\u0440\u043C\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u044F" })] }), _jsx(CardContent, { className: "px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3", children: ['mirror', 'poster'].map((style) => {
                            const isActive = addEntryPreviewStyle === style;
                            const label = style === 'mirror' ? 'Как в библиотеке' : 'Кинопостер';
                            const desc = style === 'mirror'
                                ? 'Точная копия карточки из библиотеки — видишь ровно то, что получишь'
                                : 'Стилизованный постер с градиентом в цвете категории';
                            return (_jsxs("button", { type: "button", onClick: () => setAddEntryPreviewStyle(style), className: `group text-left rounded-xl border p-4 transition-all cursor-pointer ${isActive
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border/60 hover:border-primary/60 hover:bg-muted/30'}`, "aria-pressed": isActive, children: [_jsx("div", { className: `mb-3 h-24 rounded-lg ${style === 'mirror'
                                            ? 'bg-gradient-to-br from-muted/60 to-muted/90 ring-1 ring-border/50'
                                            : 'bg-gradient-to-br from-pink-500/70 to-purple-600/70'} flex items-center justify-center`, children: _jsx("span", { className: `text-xs font-medium ${style === 'mirror'
                                                ? 'text-muted-foreground'
                                                : 'text-white'}`, children: style === 'mirror' ? 'MediaCard' : 'Poster' }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-semibold", children: label }), isActive && (_jsx("span", { className: "text-xs text-primary font-medium", children: "\u0412\u044B\u0431\u0440\u0430\u043D\u043E" }))] }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: desc })] }, style));
                        }) })] })] }));
}
