import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
export function StarRating({ name, label, max = 10, disabled, className, }) {
    const { control } = useFormContext();
    const [hovered, setHovered] = useState(null);
    return (_jsxs("div", { className: cn('space-y-3', className), children: [label && (_jsx(Label, { className: "text-base font-semibold text-foreground", children: label })), _jsx(Controller, { name: name, control: control, render: ({ field }) => {
                    const saved = field.value || 0;
                    const previewing = !disabled && hovered !== null;
                    return (_jsxs("div", { className: "flex w-full items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10", children: [_jsx("div", { className: "flex items-center gap-0.5 flex-wrap", children: Array.from({ length: max }, (_, i) => i + 1).map((rating) => {
                                    // Превью при hover — серое («сколько будет»),
                                    // сохранённое значение остаётся жёлтым
                                    const isPreviewed = previewing &&
                                        rating <= hovered &&
                                        (rating > saved || hovered <= saved);
                                    const isSaved = rating <= saved && !isPreviewed;
                                    const active = isPreviewed || isSaved;
                                    return (_jsx("button", { type: "button", className: cn('relative p-0.5 transition-all duration-150 transform hover:scale-110 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-sm cursor-pointer', isSaved
                                            ? 'text-yellow-500'
                                            : isPreviewed
                                                ? 'text-muted-foreground/50'
                                                : 'text-muted-foreground/20'), onMouseEnter: () => !disabled && setHovered(rating), onMouseLeave: () => !disabled && setHovered(null), onClick: () => !disabled && field.onChange(rating), disabled: disabled, children: _jsx(Star, { className: cn('w-5 h-5 transition-all', active ? 'fill-current drop-shadow-sm' : 'fill-transparent') }) }, rating));
                                }) }), _jsxs("span", { className: cn('shrink-0 text-base font-bold tabular-nums', previewing ? 'text-muted-foreground' : 'text-foreground'), children: [previewing ? hovered : saved, ' ', _jsxs("span", { className: "text-muted-foreground font-normal", children: ["/ ", max] })] })] }));
                } })] }));
}
