import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Crown, LogOut, Plus, Settings, Sparkles, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useEffect, useMemo, useState } from 'react';
import { latestVersion } from '@/utils/changelog';
import { profileApi } from '@/api/profile';
import { logger } from '@/utils/logger';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export const HomeHeader = ({ title, username, avatar, onAddMedia, onNavigateToProfile, onNavigateToSettings, onLogout }) => {
    // Вычисляем hasUpdate без useEffect
    const hasUpdate = useMemo(() => {
        const lastSeenVersion = localStorage.getItem('lastSeenVersion');
        return latestVersion && lastSeenVersion !== latestVersion;
    }, []);
    // Активное звание подтягиваем для отображения в дропдауне профиля.
    // Тихо игнорим ошибку сети — это украшение, не критичный путь.
    const [titleLabel, setTitleLabel] = useState(null);
    const [level, setLevel] = useState(null);
    useEffect(() => {
        let cancelled = false;
        profileApi
            .getStats()
            .then((s) => {
            if (cancelled)
                return;
            setTitleLabel(s.title?.label ?? null);
            setLevel(s.level);
        })
            .catch((e) => logger.warn('HomeHeader: failed to fetch profile stats', e));
        return () => {
            cancelled = true;
        };
    }, []);
    return (_jsxs("header", { className: "h-14 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300", children: [_jsx("h1", { className: "font-bold text-lg tracking-tight hidden md:block bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent", children: "Seen" }), _jsx("h2", { className: "text-base font-medium md:hidden", children: title }), _jsxs("div", { className: "flex items-center gap-4", children: [hasUpdate && (_jsx(Button, { variant: "ghost", size: "sm", className: "hidden md:flex gap-2 text-amber-500 hover:text-amber-600 hover:bg-amber-100/10", asChild: true, children: _jsxs(Link, { to: "/changelog", children: [_jsx(Sparkles, { className: "h-4 w-4" }), _jsx("span", { className: "text-xs font-semibold", children: "\u041D\u043E\u0432\u043E\u0435!" })] }) })), _jsx("h2", { className: "text-sm font-medium text-muted-foreground hidden md:block border-r pr-4 mr-2", children: title }), _jsxs(Button, { id: "add-media-btn", onClick: onAddMedia, size: "sm", "aria-label": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C", className: "shadow-md hover:shadow-lg transition-all", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " ", _jsx("span", { className: "hidden sm:inline", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" })] }), _jsx(NotificationCenter, {}), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "icon", className: "rounded-full h-9 w-9 relative", "aria-label": "\u041C\u0435\u043D\u044E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: avatar, alt: username }), _jsx(AvatarFallback, { className: "bg-primary/10 text-primary text-xs", children: username?.[0]?.toUpperCase() || _jsx(User, { className: "h-4 w-4" }) })] }), hasUpdate && (_jsx("span", { className: "absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-background md:hidden" }))] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-64", children: [_jsx(DropdownMenuLabel, { className: "font-normal", children: _jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("span", { className: "font-semibold text-sm", children: username || 'Профиль' }), _jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [level !== null && (_jsxs(Badge, { variant: "secondary", className: "text-[10px] px-1.5 py-0", children: [_jsx(Sparkles, { className: "h-2.5 w-2.5 mr-1" }), "\u0423\u0440\u043E\u0432\u0435\u043D\u044C ", level] })), titleLabel && (_jsxs(Badge, { variant: "secondary", className: "text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30", children: [_jsx(Crown, { className: "h-2.5 w-2.5 mr-1" }), titleLabel] }))] })] }) }), _jsx(DropdownMenuSeparator, {}), hasUpdate && (_jsxs(_Fragment, { children: [_jsx(DropdownMenuItem, { asChild: true, className: "md:hidden", children: _jsxs(Link, { to: "/changelog", className: "text-amber-500 focus:text-amber-600", children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), " \u0427\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E?"] }) }), _jsx(DropdownMenuSeparator, { className: "md:hidden" })] })), _jsxs(DropdownMenuItem, { onClick: onNavigateToProfile, children: [_jsx(User, { className: "mr-2 h-4 w-4" }), " \u041F\u0440\u043E\u0444\u0438\u043B\u044C"] }), _jsxs(DropdownMenuItem, { onClick: onNavigateToSettings, children: [_jsx(Settings, { className: "mr-2 h-4 w-4" }), " \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: onLogout, className: "text-destructive focus:text-destructive", children: [_jsx(LogOut, { className: "mr-2 h-4 w-4" }), " \u0412\u044B\u0439\u0442\u0438"] })] })] })] })] }));
};
