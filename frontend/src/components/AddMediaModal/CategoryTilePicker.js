import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Controller, useFormContext } from 'react-hook-form';
import { BookOpen, Film, Gamepad2, Play, Sparkles, Tv } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
const CATEGORIES = [
    { value: 'Movie', label: 'Фильм', icon: Film, accentVar: 'accent-blue' },
    { value: 'Series', label: 'Сериал', icon: Tv, accentVar: 'accent-pink' },
    { value: 'Book', label: 'Книга', icon: BookOpen, accentVar: 'accent-green' },
    { value: 'Game', label: 'Игра', icon: Gamepad2, accentVar: 'accent-purple' },
    { value: 'Anime', label: 'Аниме', icon: Play, accentVar: 'accent-orange' },
    { value: 'Manga', label: 'Манга', icon: Sparkles, accentVar: 'accent-cyan' },
];
export function CategoryTilePicker({ name, label, disabled }) {
    const { control } = useFormContext();
    return (_jsxs("div", { className: "space-y-2", children: [label && (_jsx(Label, { className: "text-sm font-semibold text-foreground", children: label })), _jsx(Controller, { name: name, control: control, render: ({ field }) => (_jsx("div", { className: "grid grid-cols-3 gap-2", children: CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const selected = field.value === cat.value;
                        const accent = `var(--${cat.accentVar})`;
                        return (_jsxs("button", { type: "button", "aria-pressed": selected, disabled: disabled, onClick: () => field.onChange(cat.value), className: cn('group relative flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all cursor-pointer', 'hover:border-[color:var(--accent-tile)] hover:bg-[color-mix(in_oklab,var(--accent-tile)_8%,transparent)]', selected
                                ? 'border-[color:var(--accent-tile)] bg-[color-mix(in_oklab,var(--accent-tile)_14%,transparent)] text-[color:var(--accent-tile)] shadow-sm'
                                : 'border-border/70 bg-muted/40 text-muted-foreground', disabled && 'opacity-50 pointer-events-none'), style: { ['--accent-tile']: accent }, children: [_jsx(Icon, { className: "h-4 w-4 shrink-0" }), _jsx("span", { children: cat.label })] }, cat.value));
                    }) })) })] }));
}
