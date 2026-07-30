import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
const formatTime = (date) => date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});
export function ErrorDetailsDialog({ open, onOpenChange, errors, onClear, title = 'Стек ошибок', description = 'Полный список ошибок этой сессии. Поможет, если нужно показать поддержке, что именно пошло не так.', }) {
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh] flex flex-col", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-destructive" }), title] }), _jsx(DialogDescription, { children: description })] }), _jsx(ScrollArea, { className: "flex-1 -mx-6 px-6", children: errors.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: "\u041F\u043E\u043A\u0430 \u043E\u0448\u0438\u0431\u043E\u043A \u043D\u0435\u0442." })) : (_jsx("ol", { className: "space-y-3 py-2", children: errors.map((err, idx) => (_jsxs("li", { className: "rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1.5", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 text-xs text-muted-foreground", children: [_jsxs("span", { className: "font-mono", children: ["#", errors.length - idx, " \u00B7 ", formatTime(err.at)] }), err.context && (_jsx("span", { className: "px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase tracking-wider", children: err.context }))] }), _jsx("p", { className: "text-sm font-medium", children: err.message }), err.stack && (_jsx("pre", { className: "text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto bg-background/50 rounded p-2 border", children: err.stack }))] }, err.id))) })) }), onClear && errors.length > 0 && (_jsx("div", { className: "flex justify-end pt-2 border-t", children: _jsxs(Button, { type: "button", variant: "ghost", size: "sm", onClick: onClear, className: "text-muted-foreground hover:text-destructive", children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), " \u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043B\u043E\u0433"] }) }))] }) }));
}
