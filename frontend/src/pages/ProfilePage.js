import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookMarked, BookOpen, Check, Crown, Film, Gamepad2, Gem, Ghost, Globe, Heart, HelpCircle, Info, Layers, Library, Lock, Notebook, PlaySquare, Search, Sparkles, Star, Trophy, Tv, User, Wand2, } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { useAuthStore } from '../store/authStore';
import { profileApi } from '../api/profile';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SubPageNav } from '@/components/SubPageNav';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
const ICON_MAP = {
    Sparkles,
    Library,
    BookMarked,
    Trophy,
    Crown,
    Star,
    Award,
    Gem,
    Layers,
    Globe,
    Film,
    Tv,
    BookOpen,
    Gamepad2,
    PlaySquare,
    Notebook,
    Wand2,
    Heart,
    Search,
    Ghost,
};
const CATEGORY_LABEL = {
    Movie: 'Фильмы',
    Series: 'Сериалы',
    Book: 'Книги',
    Game: 'Игры',
    Anime: 'Аниме',
    Manga: 'Манга',
};
const GROUP_LABEL = {
    collection: 'Коллекция',
    rating: 'Оценки',
    diversity: 'Разнообразие',
    category: 'Категории',
    genre: 'Жанры',
};
const SNAPSHOT_KEY = 'seen-stats-snapshot';
function loadSnapshot() {
    try {
        const raw = localStorage.getItem(SNAPSHOT_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
function saveSnapshot(stats) {
    const snap = {
        level: stats.level,
        unlockedCodes: stats.achievements
            .filter((a) => a.unlocked)
            .map((a) => a.code),
        earnedTitleCodes: stats.earnedTitles.map((t) => t.code),
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
}
/** Сравнивает текущие stats с предыдущим снэпшотом и стреляет тостами
 *  на каждое реально новое событие. */
function notifyDiff(stats, prev) {
    if (!prev)
        return; // первый запуск — снэпшот нулевой, ничего не показываем
    if (stats.level > prev.level) {
        toast.success(`Новый уровень: ${stats.level}`, {
            description: 'Так держать! Продолжайте пополнять медиатеку.',
            icon: '⭐',
        });
    }
    const prevUnlocked = new Set(prev.unlockedCodes);
    for (const a of stats.achievements) {
        if (a.unlocked && !prevUnlocked.has(a.code)) {
            toast.success(`Достижение: ${a.title}`, {
                description: `${a.description} +${a.xp} XP`,
                icon: '🏆',
            });
        }
    }
    const prevTitles = new Set(prev.earnedTitleCodes);
    for (const t of stats.earnedTitles) {
        if (!prevTitles.has(t.code)) {
            toast.success(`Новое звание: ${t.label}`, {
                description: 'Закрепите его в профиле, если хотите.',
                icon: '👑',
            });
        }
    }
}
export default function ProfilePage() {
    const { user, updateProfile } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [titlePopoverOpen, setTitlePopoverOpen] = useState(false);
    // Чтобы тосты не дублировались между ремаунтами одной сессии.
    const notifiedOnce = useRef(false);
    useEffect(() => {
        profileApi
            .getStats()
            .then((s) => {
            setStats(s);
            if (!notifiedOnce.current) {
                notifyDiff(s, loadSnapshot());
                saveSnapshot(s);
                notifiedOnce.current = true;
            }
        })
            .catch((e) => logger.error('Failed to load profile stats', e))
            .finally(() => setIsLoading(false));
    }, []);
    const pinTitle = async (code) => {
        setTitlePopoverOpen(false);
        try {
            await updateProfile({
                preferences: { ...user?.preferences, selectedTitle: code },
            });
            // Перечитываем статистику, чтобы applied title в шапке обновился.
            const fresh = await profileApi.getStats();
            setStats(fresh);
            toast.success(code === null ? 'Звание сброшено на авто' : 'Звание закреплено');
        }
        catch (e) {
            logger.error('Failed to pin title', e);
            toast.error('Не удалось сохранить звание');
        }
    };
    if (isLoading) {
        return (_jsxs(_Fragment, { children: [_jsx(SubPageNav, {}), _jsxs("div", { className: "container max-w-3xl py-4 px-4 mx-auto space-y-3 animate-in fade-in", children: [_jsx(Skeleton, { className: "h-24 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-16 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-44 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-[320px] w-full rounded-xl" })] })] }));
    }
    if (!stats) {
        return (_jsxs(_Fragment, { children: [_jsx(SubPageNav, {}), _jsx("div", { className: "container max-w-2xl mx-auto py-12 text-center text-muted-foreground", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0443 \u043F\u0440\u043E\u0444\u0438\u043B\u044F." })] }));
    }
    const levelPct = Math.round((stats.levelProgress / stats.levelTarget) * 100);
    const unlockedCount = stats.achievements.filter((a) => a.unlocked).length;
    const achievementGroups = stats.achievements.reduce((acc, a) => {
        (acc[a.group] = acc[a.group] || []).push(a);
        return acc;
    }, {});
    return (_jsxs(_Fragment, { children: [_jsx(SubPageNav, {}), _jsxs("div", { className: "container max-w-3xl py-4 px-4 mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [_jsx(Card, { className: "gap-0 overflow-hidden border-0 shadow-md bg-gradient-to-br from-background via-background to-primary/5", children: _jsxs(CardContent, { className: "p-3 sm:p-4 flex items-center gap-3", children: [_jsxs(Avatar, { className: "h-14 w-14 ring-2 ring-primary/30 shrink-0", children: [_jsx(AvatarImage, { src: user?.preferences?.avatar || undefined }), _jsx(AvatarFallback, { className: "bg-primary/10 text-primary text-lg font-bold", children: _jsx(User, { size: 22 }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h1", { className: "text-xl font-bold tracking-tight truncate", children: user?.username }), user?.email && (_jsx("p", { className: "text-muted-foreground text-sm truncate", children: user.email })), _jsxs(Popover, { open: titlePopoverOpen, onOpenChange: setTitlePopoverOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-auto p-0 mt-0.5 hover:bg-transparent", children: stats.title ? (_jsxs(Badge, { variant: "secondary", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 cursor-pointer hover:bg-amber-500/25 transition-colors", children: [_jsx(Crown, { className: "mr-1.5 h-3 w-3" }), stats.title.label, _jsx("span", { className: "ml-1.5 text-[10px] opacity-70", children: "\u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C" })] })) : (_jsxs(Badge, { variant: "outline", className: "border-dashed text-muted-foreground cursor-pointer hover:bg-muted/30", children: [_jsx(Crown, { className: "mr-1.5 h-3 w-3" }), stats.earnedTitles.length > 0
                                                                    ? 'Выбрать звание'
                                                                    : 'Звание ещё не получено'] })) }) }), _jsxs(PopoverContent, { className: "w-72 p-2", align: "start", children: [_jsx("div", { className: "px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider", children: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044B\u0435 \u0437\u0432\u0430\u043D\u0438\u044F" }), stats.earnedTitles.length === 0 ? (_jsxs("p", { className: "px-2 pb-2 pt-1 text-xs text-muted-foreground", children: ["\u0415\u0449\u0451 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0437\u0432\u0430\u043D\u0438\u044F. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u0432 \u043D\u0443\u0436\u043D\u043E\u0439 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 (10+) \u0438\u043B\u0438 \u0436\u0430\u043D\u0440\u0435 (15+) \u2014 \u0437\u0432\u0430\u043D\u0438\u0435 \u0440\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438.", ' ', _jsx(Link, { to: "/levels-info", className: "text-primary hover:underline", children: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435" })] })) : (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", onClick: () => pinTitle(null), className: "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 text-left", children: [_jsx("span", { className: "flex-1", children: "\u0410\u0432\u0442\u043E (\u043F\u043E \u0442\u043E\u043F\u0443)" }), !user?.preferences?.selectedTitle && (_jsx(Check, { className: "h-3.5 w-3.5 text-primary" }))] }), _jsx("div", { className: "my-1 h-px bg-border" }), stats.earnedTitles.map((t) => (_jsxs("button", { type: "button", onClick: () => pinTitle(t.code), className: "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted/50 text-left", children: [_jsx(Crown, { className: "h-3.5 w-3.5 text-amber-500" }), _jsxs("span", { className: "flex-1", children: [_jsx("span", { className: "font-medium", children: t.label }), _jsx("span", { className: "ml-1.5 text-[10px] text-muted-foreground", children: t.source === 'category'
                                                                                        ? (CATEGORY_LABEL[t.basis] ?? t.basis)
                                                                                        : t.basis })] }), user?.preferences?.selectedTitle === t.code && (_jsx(Check, { className: "h-3.5 w-3.5 text-primary" }))] }, t.code)))] }))] })] })] }), _jsxs("div", { className: "shrink-0 flex flex-col items-end gap-1.5", children: [_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-2xl font-bold leading-none bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-500", children: stats.level }), _jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "\u0443\u0440\u043E\u0432\u0435\u043D\u044C" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Progress, { value: levelPct, className: "h-1.5 w-16 sm:w-28", title: `Прогресс до уровня ${stats.level + 1}` }), _jsxs("span", { className: "text-xs text-muted-foreground whitespace-nowrap font-mono", children: [stats.levelProgress, "/", stats.levelTarget, " XP"] }), _jsx(Button, { variant: "ghost", size: "icon", asChild: true, className: "h-6 w-6 shrink-0", title: "\u041A\u0430\u043A \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0443\u0440\u043E\u0432\u043D\u0438 \u0438 \u0437\u0432\u0430\u043D\u0438\u044F", children: _jsx(Link, { to: "/levels-info", "aria-label": "\u041A\u0430\u043A \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0443\u0440\u043E\u0432\u043D\u0438", children: _jsx(HelpCircle, { className: "h-3.5 w-3.5" }) }) })] })] })] }) }), _jsx(Card, { className: "shadow-sm", children: _jsxs(CardContent, { className: "p-0 grid grid-cols-3 divide-x divide-border/60", children: [_jsxs("div", { className: "px-3 py-3 text-center", children: [_jsxs("div", { className: "text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1", children: [_jsx(Film, { className: "h-3.5 w-3.5" }), " \u0417\u0430\u043F\u0438\u0441\u0435\u0439"] }), _jsx("div", { className: "text-xl font-bold leading-tight mt-0.5", children: stats.totalEntries })] }), _jsxs("div", { className: "px-3 py-3 text-center", children: [_jsxs("div", { className: "text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1", children: [_jsx(Star, { className: "h-3.5 w-3.5" }), " \u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u0440\u0435\u0439\u0442\u0438\u043D\u0433"] }), _jsx("div", { className: "text-xl font-bold leading-tight mt-0.5", children: stats.averageRating || '—' })] }), _jsxs("div", { className: "px-3 py-3 text-center", children: [_jsxs("div", { className: "text-xs uppercase tracking-wide text-muted-foreground flex items-center justify-center gap-1", children: [_jsx(Trophy, { className: "h-3.5 w-3.5" }), " \u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0439"] }), _jsxs("div", { className: "text-xl font-bold leading-tight mt-0.5", children: [unlockedCount, _jsxs("span", { className: "text-sm font-normal text-muted-foreground", children: [' ', "/ ", stats.achievements.length] })] })] })] }) }), _jsx(Card, { className: "gap-0 shadow-sm", children: _jsxs(CardContent, { className: "p-4 grid gap-4 sm:gap-0 sm:grid-cols-2 sm:divide-x sm:divide-border/60", children: [_jsxs("section", { className: "sm:pr-4", children: [_jsxs("h2", { className: "text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mb-2.5", children: [_jsx(Layers, { className: "h-4 w-4 text-primary" }), "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438"] }), Object.entries(stats.byCategory).length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445" })) : (_jsx("div", { className: "space-y-2", children: Object.entries(stats.byCategory)
                                                .sort((a, b) => b[1] - a[1])
                                                .map(([cat, count]) => {
                                                const pct = (count / stats.totalEntries) * 100;
                                                return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium w-16 shrink-0 truncate", children: CATEGORY_LABEL[cat] ?? cat }), _jsx(Progress, { value: pct, className: "h-1.5 flex-1" }), _jsx("span", { className: "text-xs text-muted-foreground font-mono w-7 shrink-0 text-right", children: count })] }, cat));
                                            }) }))] }), _jsxs("section", { className: "sm:pl-4", children: [_jsxs("h2", { className: "text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mb-2.5", children: [_jsx(BookOpen, { className: "h-4 w-4 text-primary" }), "\u0422\u043E\u043F-\u0436\u0430\u043D\u0440\u044B"] }), Object.entries(stats.byGenre).length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-2", children: "\u0416\u0430\u043D\u0440\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u0432 \u0437\u0430\u043F\u0438\u0441\u044F\u0445" })) : (_jsx("div", { className: "space-y-1.5", children: Object.entries(stats.byGenre)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 6)
                                                .map(([genre, count]) => (_jsxs("div", { className: "flex items-center justify-between gap-2 text-sm", children: [_jsx("span", { className: "font-medium truncate", children: genre }), _jsx(Badge, { variant: "outline", className: "font-mono text-xs px-1.5 py-0 shrink-0", children: count })] }, genre))) }))] })] }) }), _jsx(Card, { className: "gap-0 shadow-sm", children: _jsxs(CardContent, { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-sm font-semibold text-muted-foreground flex items-center gap-1.5", children: [_jsx(Trophy, { className: "h-4 w-4 text-primary" }), "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F"] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [unlockedCount, " \u0438\u0437 ", stats.achievements.length] })] }), Object.entries(achievementGroups).map(([group, items]) => (_jsxs("div", { children: [_jsx("h3", { className: "text-xs uppercase tracking-wider text-muted-foreground/80 font-medium mb-1.5", children: GROUP_LABEL[group] ?? group }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: items.map((ach) => {
                                                const Icon = ICON_MAP[ach.icon] ?? Star;
                                                const pct = Math.min(100, Math.round((ach.value / ach.target) * 100));
                                                return (_jsxs("div", { className: cn('p-2.5 rounded-md border transition-all', ach.unlocked
                                                        ? 'bg-amber-500/5 border-amber-500/30'
                                                        : 'bg-card border-border/50 opacity-90'), title: ach.description, children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-1.5", children: [_jsx("span", { className: cn('shrink-0', ach.unlocked
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-muted-foreground'), children: ach.unlocked ? (_jsx(Icon, { className: "h-3.5 w-3.5" })) : (_jsx(Lock, { className: "h-3.5 w-3.5" })) }), _jsx("span", { className: cn('font-medium text-xs flex-1 truncate leading-tight', !ach.unlocked && 'text-muted-foreground'), children: ach.title }), _jsxs("span", { className: "text-[10px] font-mono text-muted-foreground shrink-0", children: ["+", ach.xp] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Progress, { value: pct, className: "h-1 flex-1" }), _jsxs("span", { className: "text-[10px] text-muted-foreground font-mono shrink-0", children: [ach.value, "/", ach.target] })] })] }, ach.code));
                                            }) })] }, group)))] }) }), _jsxs("p", { className: "text-center text-xs text-muted-foreground pb-1", children: [_jsx(Info, { className: "inline h-3 w-3 mr-1" }), "\u0423\u0440\u043E\u0432\u043D\u0438, \u043E\u043F\u044B\u0442 \u0438 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F \u2014 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u0433\u0435\u0439\u043C\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F, \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0435 \u043F\u043E\u043A\u0438\u0434\u0430\u044E\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435 \u2014", ' ', _jsx(Link, { to: "/levels-info", className: "text-primary hover:underline", children: "\u0437\u0434\u0435\u0441\u044C" }), "."] })] })] }));
}
