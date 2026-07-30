import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell, CheckCircle, AlertTriangle, Info, X, Clock, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
const getIcon = (type) => {
    switch (type) {
        case 'success':
            return _jsx(CheckCircle, { className: "h-5 w-5 text-green-500" });
        case 'warning':
            return _jsx(AlertTriangle, { className: "h-5 w-5 text-yellow-500" });
        case 'error':
            return _jsx(X, { className: "h-5 w-5 text-red-500" });
        case 'recommendation':
            return _jsx(Sparkles, { className: "h-5 w-5 text-purple-500" });
        case 'update':
            return _jsx(Zap, { className: "h-5 w-5 text-blue-500" });
        case 'system':
            return _jsx(Bell, { className: "h-5 w-5 text-primary" });
        default:
            return _jsx(Info, { className: "h-5 w-5 text-blue-400" });
    }
};
export const NotificationItem = ({ notification, onMarkAsRead, onRemove, onAction }) => {
    const { id, title, message, type, isRead, createdAt, link, actionLabel } = notification;
    return (_jsxs("div", { className: cn("relative flex gap-4 p-4 transition-colors hover:bg-muted/50 border-b last:border-0 group", !isRead && "bg-muted/20"), children: [_jsx("div", { className: "mt-1 flex-shrink-0", children: getIcon(type) }), _jsxs("div", { className: "flex-1 space-y-1", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: cn("text-sm font-medium leading-none", !isRead && "font-semibold text-foreground"), children: title }), _jsxs("span", { className: "flex items-center text-xs text-muted-foreground whitespace-nowrap", children: [_jsx(Clock, { className: "mr-1 h-3 w-3" }), formatDistanceToNow(createdAt, { addSuffix: true, locale: ru })] })] }), _jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: message }), (link || actionLabel) && (_jsx("div", { className: "pt-2", children: _jsx(Button, { variant: "link", className: "h-auto p-0 text-xs text-primary", onClick: () => onAction && onAction(notification), children: actionLabel || 'Подробнее' }) }))] }), _jsxs("div", { className: "flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border p-0.5", children: [!isRead && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 hover:text-primary", "aria-label": "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C", onClick: (e) => {
                            e.stopPropagation();
                            onMarkAsRead(id);
                        }, children: _jsx("div", { className: "h-2 w-2 rounded-full bg-primary" }) })), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 hover:text-destructive", "aria-label": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", onClick: (e) => {
                            e.stopPropagation();
                            onRemove(id);
                        }, children: _jsx(X, { className: "h-3 w-3" }) })] }), !isRead && (_jsx("div", { className: "absolute right-4 top-4 h-2 w-2 rounded-full bg-primary group-hover:opacity-0 transition-opacity" }))] }));
};
