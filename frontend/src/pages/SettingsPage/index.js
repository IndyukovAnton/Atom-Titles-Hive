import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Blocks, Download, GraduationCap, Loader2, Palette, Shield, ShieldCheck, Sparkles, Sparkle, User, } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettings } from '@/components/personalization/AccountSettings';
import { SubPageNav } from '@/components/SubPageNav';
import { AppearanceTab } from './AppearanceTab';
import { IntegrationsTab } from './IntegrationsTab';
import { ProvidersTab } from './ProvidersTab';
import { SecurityTab } from './SecurityTab';
import { useAuthStore } from '@/store/authStore';
import { runInteractiveUpdateCheck } from '@/utils/updater';
const SETTINGS_TABS = [
    'appearance',
    'account',
    'integrations',
    'providers',
    'security',
];
const TAB_ITEMS = [
    { value: 'appearance', label: 'Внешний вид', icon: Palette },
    { value: 'account', label: 'Аккаунт', icon: User },
    { value: 'integrations', label: 'Интеграции & AI', icon: Sparkles },
    { value: 'providers', label: 'Провайдеры', icon: Blocks },
    { value: 'security', label: 'Безопасность', icon: Shield },
];
export default function SettingsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestTourReplay = useAuthStore((s) => s.requestTourReplay);
    const tabParam = searchParams.get('tab');
    const activeTab = SETTINGS_TABS.includes(tabParam ?? '')
        ? tabParam
        : 'appearance';
    const handleTabChange = (value) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', value);
        setSearchParams(next, { replace: true });
    };
    const handleReplayTour = () => {
        requestTourReplay();
        navigate('/');
    };
    const [isChecking, setIsChecking] = useState(false);
    // Вся updater-логика — в utils/updater (общая с UpdateChecker):
    // check → downloadAndInstall с прогрессом → relaunch; в браузере и при
    // ошибке сети открывается GitHub Releases как fallback.
    const handleCheckUpdates = async () => {
        setIsChecking(true);
        try {
            await runInteractiveUpdateCheck();
        }
        finally {
            setIsChecking(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(SubPageNav, {}), _jsxs("div", { className: "container max-w-5xl py-6 px-4 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500", children: [_jsxs("div", { className: "flex flex-col justify-between gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70", children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), _jsxs("p", { className: "text-muted-foreground text-sm flex items-center gap-2", children: ["\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432\u043D\u0435\u0448\u043D\u0438\u043C \u0432\u0438\u0434\u043E\u043C, \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C\u044E \u0438 \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F\u043C\u0438", _jsxs(Badge, { variant: "secondary", className: "font-mono text-[10px] px-1.5 py-0", title: "\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F", children: ["v", __APP_VERSION__] })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: handleCheckUpdates, disabled: isChecking, className: "rounded-full", children: [isChecking ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : (_jsx(Download, { className: "mr-2 h-4 w-4" })), "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleReplayTour, className: "rounded-full", children: [_jsx(GraduationCap, { className: "mr-2 h-4 w-4" }), "\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435"] }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "rounded-full", children: _jsxs(Link, { to: "/changelog", children: [_jsx(Sparkle, { className: "mr-2 h-4 w-4" }), "\u0427\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E?"] }) }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "rounded-full", children: _jsxs(Link, { to: "/privacy", children: [_jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }), "\u041F\u0440\u0438\u0432\u0430\u0442\u043D\u043E\u0441\u0442\u044C"] }) })] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: handleTabChange, className: "space-y-8", children: [_jsx(TabsList, { className: "grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1.5 bg-muted/40 backdrop-blur-sm rounded-xl border", children: TAB_ITEMS.map(({ value, label, icon: Icon }) => (_jsxs(TabsTrigger, { value: value, className: "rounded-lg py-2.5 gap-2 transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-indigo-500/30 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400", children: [_jsx(Icon, { className: "w-4 h-4 shrink-0" }), _jsx("span", { className: "hidden sm:inline truncate", children: label })] }, value))) }), _jsx(TabsContent, { value: "appearance", className: "space-y-6 animate-in slide-in-from-left-4 duration-300 zoom-in-95", children: _jsx(AppearanceTab, {}) }), _jsx(TabsContent, { value: "account", className: "space-y-6 animate-in slide-in-from-right-4 duration-300 zoom-in-95", children: _jsx(AccountSettings, {}) }), _jsx(TabsContent, { value: "integrations", className: "space-y-6 animate-in slide-in-from-bottom-4 duration-300 zoom-in-95", children: _jsx(IntegrationsTab, {}) }), _jsx(TabsContent, { value: "providers", className: "space-y-6 animate-in slide-in-from-bottom-4 duration-300 zoom-in-95", children: _jsx(ProvidersTab, {}) }), _jsx(TabsContent, { value: "security", className: "space-y-6 animate-in slide-in-from-right-4 duration-300 zoom-in-95", children: _jsx(SecurityTab, {}) })] })] })] }));
}
