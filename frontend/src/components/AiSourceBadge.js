import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
/** Маркер записи, добавленной из ИИ-рекомендаций */
export function AiSourceBadge({ className }) {
    return (_jsxs("span", { title: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0438\u0437 \u0418\u0418-\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439", className: cn('inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-1 text-[10px] font-semibold text-white shadow-lg ring-1 ring-white/20 select-none', className), children: [_jsx(Sparkles, { className: "w-2.5 h-2.5" }), "\u0418\u0418"] }));
}
