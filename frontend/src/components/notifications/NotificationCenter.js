import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationItem } from './NotificationItem';
import { useNavigate } from 'react-router-dom';
export const NotificationCenter = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotificationStore();
    const handleAction = (notification) => {
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
        markAsRead(notification.id);
    };
    const filteredNotifications = (tab) => {
        if (tab === 'unread')
            return notifications.filter(n => !n.isRead);
        if (tab === 'system')
            return notifications.filter(n => n.type === 'system' || n.type === 'update');
        return notifications;
    };
    return (_jsxs(Popover, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "icon", className: "relative", children: [_jsx(Bell, { className: "h-5 w-5 text-muted-foreground" }), unreadCount > 0 && (_jsx(Badge, { variant: "destructive", className: "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full animate-in zoom-in", children: unreadCount > 99 ? '99+' : unreadCount }))] }) }), _jsxs(PopoverContent, { align: "end", className: "w-[380px] p-0", sideOffset: 8, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "font-semibold leading-none", children: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F" }), unreadCount > 0 && _jsxs(Badge, { variant: "secondary", className: "text-xs", children: [unreadCount, " \u043D\u043E\u0432\u044B\u0445"] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-primary", onClick: markAllAsRead, "aria-label": "\u041F\u043E\u043C\u0435\u0442\u0438\u0442\u044C \u0432\u0441\u0435 \u043A\u0430\u043A \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0435", disabled: unreadCount === 0, children: _jsx(CheckCheck, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-destructive", onClick: clearAll, "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E", disabled: notifications.length === 0, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }), _jsxs(Tabs, { defaultValue: "all", className: "w-full", children: [_jsx("div", { className: "px-4 py-2 border-b bg-muted/30", children: _jsxs(TabsList, { className: "grid w-full grid-cols-3 h-8", children: [_jsx(TabsTrigger, { value: "all", className: "text-xs", children: "\u0412\u0441\u0435" }), _jsx(TabsTrigger, { value: "unread", className: "text-xs", children: "\u041D\u0435\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0435" }), _jsx(TabsTrigger, { value: "system", className: "text-xs", children: "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435" })] }) }), _jsx(ScrollArea, { className: "h-[400px]", children: ['all', 'unread', 'system'].map((tab) => (_jsx(TabsContent, { value: tab, className: "m-0 focus-visible:ring-0 focus-visible:outline-none", children: filteredNotifications(tab).length > 0 ? (_jsx("div", { className: "flex flex-col", children: filteredNotifications(tab).map((notification) => (_jsx(NotificationItem, { notification: notification, onMarkAsRead: markAsRead, onRemove: removeNotification, onAction: handleAction }, notification.id))) })) : (_jsxs("div", { className: "flex flex-col items-center justify-center h-[300px] text-center p-4 text-muted-foreground", children: [_jsx(Bell, { className: "h-10 w-10 mb-2 opacity-20" }), _jsx("p", { className: "text-sm", children: "\u041D\u0435\u0442 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439" })] })) }, tab))) })] })] })] }));
};
