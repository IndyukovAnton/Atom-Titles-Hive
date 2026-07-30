import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
const MOODS = [
    { value: 'light', label: 'Весёлое' },
    { value: 'cozy', label: 'Уютное' },
    { value: 'sad', label: 'Грустное' },
    { value: 'energetic', label: 'Боевое' },
    { value: 'thoughtful', label: 'Подумать' },
    { value: 'thrilling', label: 'Адреналин' },
    { value: 'romantic', label: 'Романтика' },
    { value: 'escapist', label: 'Эскапизм' },
];
export function MoodPicker({ value, onChange }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { className: "text-sm font-semibold", children: ["\u041D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435", ' ', _jsx("span", { className: "text-muted-foreground font-normal text-xs", children: "(\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)" })] }), value && (_jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "h-6 px-2 text-xs text-muted-foreground", onClick: () => onChange(null), children: [_jsx(X, { className: "w-3 h-3 mr-1" }), "\u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C"] }))] }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: MOODS.map((mood) => {
                    const selected = value === mood.value;
                    return (_jsx("button", { type: "button", onClick: () => onChange(selected ? null : mood.value), className: `px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${selected
                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                            : 'border-border bg-background/60 text-muted-foreground hover:bg-muted/40 hover:border-indigo-500/40'}`, children: mood.label }, mood.value));
                }) })] }));
}
