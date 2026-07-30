import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Home, Settings, User } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
const NAV_ITEMS = [
    { to: '/', label: 'Главная', icon: Home, end: true },
    { to: '/profile', label: 'Профиль', icon: User },
    { to: '/settings', label: 'Настройки', icon: Settings },
];
/**
 * Sticky-панель для подстраниц (Профиль, Настройки, справочные страницы):
 * логотип-ссылка на главную + быстрые переходы между разделами с подсветкой
 * активного. Заменяет одиночную кнопку «Назад».
 */
export function SubPageNav() {
    return (_jsx("header", { className: "sticky top-0 z-10 h-12 border-b bg-background/80 backdrop-blur-sm transition-colors duration-300", children: _jsxs("div", { className: "container mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4", children: [_jsx(Link, { to: "/", className: "font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent", children: "Seen" }), _jsx("nav", { "aria-label": "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F", className: "flex items-center gap-1", children: NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (_jsxs(NavLink, { to: to, end: end, className: ({ isActive }) => cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors', isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'), children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: label })] }, to))) })] }) }));
}
