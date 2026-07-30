import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Brain, Globe, Loader2, Settings as SettingsIcon, SlidersHorizontal, Sparkles, Square } from 'lucide-react';
import { toast } from '@/utils/app-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { streamAiRecommendations } from '@/api/recommendations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AICard } from '@/components/recommendations/AICard';
import { aiCardToAddMediaInitial } from '@/components/recommendations/aiCardMapping';
import { ConsentDialog } from '@/components/recommendations/ConsentDialog';
import { MoodPicker } from '@/components/recommendations/MoodPicker';
import { aiCardToSavePayload, libraryApi, } from '@/api/library';
import { SAVED_RECS_QUERY_KEY, useSavedRecommendations, } from '@/hooks/useSavedRecommendations';
import { useAuthStore } from '@/store/authStore';
import { isTauri } from '@/utils/tauri';
const cardKey = (c) => `${c.title.toLowerCase()}|${c.type}`;
const STAGE_LABELS = {
    starting: 'Запускаю…',
    analyzing_library: 'Анализирую вашу библиотеку…',
    thinking: 'Думаю…',
    web_searching: 'Ищу в интернете свежие релизы…',
    web_search_done: 'Получил результаты веб-поиска',
    tool_use: 'Использую инструмент…',
    cards_streaming: 'Формирую карточки…',
};
function stageLabel(entry) {
    if (entry?.message)
        return entry.message;
    return entry ? STAGE_LABELS[entry.stage] : STAGE_LABELS.thinking;
}
const CONTENT_TYPE_LABELS = {
    movie: 'Фильмы',
    series: 'Сериалы',
    anime: 'Аниме',
    book: 'Книги',
    game: 'Игры',
};
const ALL_CONTENT_TYPES = [
    'movie',
    'series',
    'anime',
    'book',
    'game',
];
const PRESET_GENRES = [
    'Боевик',
    'Драма',
    'Фантастика',
    'Фэнтези',
    'Комедия',
    'Романтика',
    'Триллер',
    'Хоррор',
    'Детектив',
    'Мистика',
    'Повседневность',
    'Приключения',
    'Документальное',
    'Анимация',
    'Криминал',
    'Военный',
    'Психологический',
    'Спорт',
];
const DEFAULT_CONTENT_TYPES = [
    'movie',
    'series',
    'anime',
];
const COUNT_OPTIONS = [5, 10, 15, 20];
const SOURCE_LABEL = {
    'claude-api': 'Claude API',
    'claude-cli': 'Claude CLI',
    'codex-cli': 'Codex CLI',
};
const RESULTS_CACHE_KEY = (userId) => `claude_recs_last_${userId}`;
const RESULTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const loadCachedResults = (userId) => {
    if (!userId)
        return null;
    try {
        const raw = localStorage.getItem(RESULTS_CACHE_KEY(userId));
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed ||
            typeof parsed.ts !== 'number' ||
            Date.now() - parsed.ts > RESULTS_CACHE_TTL_MS) {
            localStorage.removeItem(RESULTS_CACHE_KEY(userId));
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
};
const saveCachedResults = (userId, data) => {
    if (!userId)
        return;
    try {
        localStorage.setItem(RESULTS_CACHE_KEY(userId), JSON.stringify(data));
    }
    catch {
        // quota or anything — ignore
    }
};
/**
 * Native notification when recommendations finish — useful when the user
 * minimised the window and we kept generating in the background. Browser-mode
 * fallback uses the Web Notification API.
 */
async function notifyRecommendationsReady(count, durationMs) {
    // If the document is in foreground, the toast already informs the user.
    // Notify only when the window is hidden / minimised / not focused.
    if (typeof document !== 'undefined' && document.hasFocus()) {
        return;
    }
    const body = `Готово: ${count} карточек за ${(durationMs / 1000).toFixed(1)}с`;
    const title = 'Рекомендации готовы';
    if (isTauri()) {
        try {
            const mod = await import('@tauri-apps/plugin-notification');
            let allowed = await mod.isPermissionGranted();
            if (!allowed) {
                const result = await mod.requestPermission();
                allowed = result === 'granted';
            }
            if (allowed) {
                await mod.sendNotification({ title, body });
            }
        }
        catch {
            // plugin missing in dev/browser — skip
        }
        return;
    }
    if (typeof Notification !== 'undefined') {
        try {
            let perm = Notification.permission;
            if (perm === 'default')
                perm = await Notification.requestPermission();
            if (perm === 'granted') {
                new Notification(title, { body });
            }
        }
        catch {
            // ignore
        }
    }
}
export function AiAssistantSection({ onAdd: _onAdd }) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?.id;
    const prefs = user?.preferences;
    const source = prefs?.aiSource ?? 'claude-api';
    const sourceLabel = SOURCE_LABEL[source];
    const promptRef = useRef(null);
    const [prompt, setPrompt] = useState('');
    const [mood, setMood] = useState(null);
    const [selectedTypes, setSelectedTypes] = useState(DEFAULT_CONTENT_TYPES);
    // Авто-ресайз по контенту; границы задаются классами min-h/max-h на textarea
    useEffect(() => {
        const el = promptRef.current;
        if (!el)
            return;
        el.style.height = 'auto';
        // scrollHeight — это padding-box; для border-box добавляем рамку,
        // иначе последняя строка подрезается на пару пикселей
        const borderHeight = el.offsetHeight - el.clientHeight;
        el.style.height = `${el.scrollHeight + borderHeight}px`;
    }, [prompt]);
    const [genres, setGenres] = useState([]);
    const [count, setCount] = useState(10);
    const [newForMe, setNewForMe] = useState(false);
    const [paramsOpen, setParamsOpen] = useState(false);
    const initialCache = useMemo(() => loadCachedResults(userId), [userId]);
    const [cards, setCards] = useState(() => initialCache?.cards ?? []);
    const [progress, setProgress] = useState([]);
    const [meta, setMeta] = useState(() => initialCache?.meta ?? null);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [durationMs, setDurationMs] = useState(() => initialCache?.durationMs ?? null);
    const abortRef = useRef(null);
    const queryClient = useQueryClient();
    // Общий кэш сохранённых рекомендаций: consume-флоу страницы инвалидирует
    // его после добавления карточки в библиотеку, бейджи сбрасываются сами.
    const { data: savedRecRows } = useSavedRecommendations();
    // Map: cardKey (title|type) -> savedRecommendation row id, for active state
    const savedByKey = useMemo(() => {
        const next = {};
        for (const r of savedRecRows ?? []) {
            next[cardKey(r)] = { id: r.id, status: r.status };
        }
        return next;
    }, [savedRecRows]);
    const upsertSaved = (next) => {
        queryClient.setQueryData(SAVED_RECS_QUERY_KEY, (rows) => {
            const list = rows ?? [];
            const idx = list.findIndex((r) => r.id === next.id);
            return idx === -1
                ? [...list, next]
                : list.map((r) => (r.id === next.id ? next : r));
        });
    };
    const removeSaved = (id) => {
        queryClient.setQueryData(SAVED_RECS_QUERY_KEY, (rows) => (rows ?? []).filter((r) => r.id !== id));
    };
    const persistSavedStatus = async (card, targetStatus) => {
        const existing = savedByKey[cardKey(card)];
        try {
            if (!existing) {
                const created = await libraryApi.saveRecommendation(aiCardToSavePayload(card, targetStatus, meta?.modelUsed));
                upsertSaved(created);
                toast.success(targetStatus === 'considering'
                    ? 'Добавлено в «Подумаю»'
                    : 'Добавлено в «Избранное»');
            }
            else if (existing.status === targetStatus) {
                await libraryApi.removeSavedRecommendation(existing.id);
                removeSaved(existing.id);
                toast.success('Убрано');
            }
            else {
                const updated = await libraryApi.updateSavedRecommendationStatus(existing.id, targetStatus);
                upsertSaved(updated);
                toast.success(targetStatus === 'considering'
                    ? 'Перемещено в «Подумаю»'
                    : 'Перемещено в «Избранное»');
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Не удалось сохранить';
            toast.error(msg);
        }
    };
    const handleConsider = (card) => {
        void persistSavedStatus(card, 'considering');
    };
    const handleFavorite = (card) => {
        void persistSavedStatus(card, 'favorited');
    };
    const consentKey = useMemo(() => (userId && source === 'claude-api' ? `claude_consent_${userId}` : null), [userId, source]);
    const [consentGiven, setConsentGiven] = useState(() => consentKey ? localStorage.getItem(consentKey) === '1' : true);
    const [consentDialogOpen, setConsentDialogOpen] = useState(false);
    // Local CLIs don't need consent (runs locally) — auto-accept whenever source flips
    useEffect(() => {
        if (source === 'claude-cli' || source === 'codex-cli') {
            setConsentGiven(true);
        }
        else if (consentKey) {
            setConsentGiven(localStorage.getItem(consentKey) === '1');
        }
    }, [source, consentKey]);
    const sourceMisconfigured = useMemo(() => {
        if (source === 'claude-api') {
            return !prefs?.hasAnthropicApiKey
                ? 'Не задан Anthropic API key — добавьте в Настройках → AI'
                : null;
        }
        return null;
    }, [source, prefs?.hasAnthropicApiKey]);
    const activeExtrasCount = (mood ? 1 : 0) + genres.length + (newForMe ? 1 : 0);
    const hasNonDefaultParams = activeExtrasCount > 0 ||
        count !== 10 ||
        selectedTypes.length !== DEFAULT_CONTENT_TYPES.length ||
        selectedTypes.some((t) => !DEFAULT_CONTENT_TYPES.includes(t));
    const resetParams = () => {
        setMood(null);
        setSelectedTypes(DEFAULT_CONTENT_TYPES);
        setCount(10);
        setGenres([]);
        setNewForMe(false);
    };
    const toggleType = (t) => {
        setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
    };
    const toggleGenre = (g) => {
        setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
    };
    const beginStream = async () => {
        setCards([]);
        setProgress([]);
        setMeta(null);
        setError(null);
        setDurationMs(null);
        setIsStreaming(true);
        const ac = new AbortController();
        abortRef.current = ac;
        try {
            const typesPicked = selectedTypes.length > 0 &&
                selectedTypes.length < ALL_CONTENT_TYPES.length;
            const hasGenres = genres.length > 0;
            const filters = typesPicked || hasGenres
                ? {
                    ...(typesPicked ? { types: selectedTypes } : {}),
                    ...(hasGenres ? { genres } : {}),
                }
                : undefined;
            // Exclude titles already shown in last batch — don't repeat them
            const excludeTitles = cards
                .map((c) => c.title)
                .filter((t) => typeof t === 'string' && t.length > 0);
            const payload = {
                source,
                prompt: prompt.trim() || undefined,
                mood: mood ?? undefined,
                filters,
                count,
                newForMe,
                excludeTitles: excludeTitles.length > 0 ? excludeTitles : undefined,
            };
            let receivedTerminal = false;
            for await (const evt of streamAiRecommendations(payload, ac.signal)) {
                applyEvent(evt);
                if (evt.kind === 'done' || evt.kind === 'error') {
                    receivedTerminal = true;
                }
            }
            if (!receivedTerminal && !ac.signal.aborted) {
                setError({
                    code: 'unknown',
                    message: 'Стрим прервался без финального события',
                });
            }
        }
        catch (err) {
            if (err?.name === 'AbortError') {
                // user-initiated cancel
            }
            else {
                const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
                const stack = err instanceof Error ? err.stack : undefined;
                setError({
                    message: msg,
                    code: 'unknown',
                    details: stack ? { stderr: stack } : undefined,
                });
            }
        }
        finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    };
    const applyEvent = (evt) => {
        switch (evt.kind) {
            case 'open':
                break;
            case 'progress':
                setProgress((prev) => [
                    ...prev.slice(-19),
                    {
                        stage: evt.stage,
                        message: evt.message,
                        detail: evt.detail,
                        ts: Date.now(),
                    },
                ]);
                break;
            case 'card':
                setCards((prev) => [...prev, evt.card]);
                break;
            case 'meta': {
                const { kind, ...rest } = evt;
                void kind;
                setMeta(rest);
                break;
            }
            case 'done':
                setDurationMs(evt.durationMs);
                if (evt.recommendations === 0) {
                    toast.warning('Получено 0 рекомендаций. Попробуйте уточнить запрос или сменить источник.');
                }
                else {
                    toast.success(`Готово: ${evt.recommendations} карточек за ${(evt.durationMs / 1000).toFixed(1)}с`);
                    void notifyRecommendationsReady(evt.recommendations, evt.durationMs);
                }
                break;
            case 'error':
                setError({
                    message: evt.message,
                    code: evt.code,
                    details: evt.details,
                });
                toast.error(evt.message);
                break;
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isStreaming)
            return;
        if (sourceMisconfigured) {
            toast.error(sourceMisconfigured);
            return;
        }
        if (selectedTypes.length === 0) {
            toast.error('Выберите хотя бы один тип контента');
            return;
        }
        if (!consentGiven) {
            setConsentDialogOpen(true);
            return;
        }
        void beginStream();
    };
    const handleConsentAccept = () => {
        if (consentKey)
            localStorage.setItem(consentKey, '1');
        setConsentGiven(true);
        setConsentDialogOpen(false);
        void beginStream();
    };
    const handleCancel = () => {
        abortRef.current?.abort();
        setIsStreaming(false);
    };
    // Cancel on unmount
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);
    // Persist cards across reloads — write whenever cards/meta change post-stream
    useEffect(() => {
        if (isStreaming)
            return;
        if (!userId)
            return;
        if (cards.length === 0 && !meta && durationMs === null)
            return;
        saveCachedResults(userId, {
            cards,
            meta,
            durationMs,
            ts: Date.now(),
        });
    }, [cards, meta, durationMs, isStreaming, userId]);
    const showSkeletons = isStreaming && cards.length < count;
    const skeletonCount = Math.max(0, count - cards.length);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "border-0 shadow-lg overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" }), _jsx(CardContent, { className: "p-4 sm:p-5", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [_jsx("div", { className: "p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 shrink-0", children: _jsx(Brain, { className: "w-4 h-4 text-indigo-600 dark:text-indigo-400" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold leading-tight", children: "AI-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442" }), _jsx("div", { className: "text-xs text-muted-foreground leading-tight truncate", children: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0432\u0430\u0448\u0435\u0439 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438" })] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx(Badge, { variant: "outline", className: "text-[10px] font-medium bg-background/60", children: sourceLabel }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-8 w-8 p-0", title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 AI", onClick: () => navigate('/settings?tab=integrations'), children: _jsx(SettingsIcon, { className: "w-4 h-4" }) })] })] }), _jsx("div", { children: _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setParamsOpen(true), disabled: isStreaming, title: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439: \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435, \u0442\u0438\u043F, \u0436\u0430\u043D\u0440\u044B", children: [_jsx(SlidersHorizontal, { className: "mr-1.5 h-3.5 w-3.5" }), "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B", activeExtrasCount > 0 && (_jsx("span", { className: "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white", children: activeExtrasCount }))] }) }), sourceMisconfigured && (_jsxs("div", { className: "rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "flex-1", children: [sourceMisconfigured, _jsx("button", { type: "button", className: "ml-1 inline-flex items-center gap-1 underline", onClick: () => navigate('/settings?tab=integrations'), children: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C" })] })] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-end", children: [_jsx("textarea", { ref: promptRef, rows: 1, className: "flex-1 rounded-xl border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-11.5 max-h-60 resize-none overflow-y-auto pretty-scrollbar", placeholder: "\u0427\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0432\u0438\u0434\u0435\u0442\u044C? \u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0441\u0432\u043E\u0438\u043C\u0438 \u0441\u043B\u043E\u0432\u0430\u043C\u0438 \u0438\u043B\u0438 \u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u2014 AI \u0440\u0435\u0448\u0438\u0442 \u0441\u0430\u043C \u043F\u043E \u0432\u0430\u0448\u0435\u0439 \u0438\u0441\u0442\u043E\u0440\u0438\u0438", value: prompt, onChange: (e) => setPrompt(e.target.value), maxLength: 2000, disabled: isStreaming }), _jsx("div", { className: "flex sm:flex-col gap-2 sm:w-44 shrink-0", children: !isStreaming ? (_jsxs(Button, { type: "submit", className: "flex-1 sm:flex-none h-11.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 text-white border-0 shadow-lg", size: "lg", disabled: !!sourceMisconfigured, children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C"] })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { type: "button", className: "flex-1 sm:flex-none h-11.5", size: "lg", variant: "secondary", disabled: true, children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "\u0414\u0443\u043C\u0430\u0435\u0442..."] }), _jsxs(Button, { type: "button", size: "lg", variant: "destructive", onClick: handleCancel, children: [_jsx(Square, { className: "w-4 h-4 fill-current" }), "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C"] })] })) })] }), _jsx(Dialog, { open: paramsOpen, onOpenChange: setParamsOpen, children: _jsxs(DialogContent, { className: "max-w-xl max-h-[85vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439" }), _jsx(DialogDescription, { children: "\u0422\u043E\u043D\u043A\u0430\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u2014 \u0432\u0441\u0451 \u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E" })] }), _jsxs("div", { className: "space-y-5", children: [_jsx(MoodPicker, { value: mood, onChange: setMood }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-semibold", children: "\u0422\u0438\u043F \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ALL_CONTENT_TYPES.map((t) => {
                                                                    const active = selectedTypes.includes(t);
                                                                    return (_jsx("button", { type: "button", onClick: () => toggleType(t), className: `px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${active
                                                                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                                                                            : 'border-border bg-background/60 text-muted-foreground hover:bg-muted/40'}`, children: CONTENT_TYPE_LABELS[t] }, t));
                                                                }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-semibold", children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A" }), _jsxs(Select, { value: String(count), onValueChange: (v) => setCount(Number(v)), children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: COUNT_OPTIONS.map((c) => (_jsxs(SelectItem, { value: String(c), children: [c, " \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A"] }, c))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-sm font-semibold", children: ["\u0416\u0430\u043D\u0440\u044B", ' ', _jsx("span", { className: "text-muted-foreground font-normal text-xs", children: "(\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)" })] }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: PRESET_GENRES.map((g) => {
                                                                    const active = genres.includes(g);
                                                                    return (_jsx("button", { type: "button", onClick: () => toggleGenre(g), className: `px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${active
                                                                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                                                                            : 'border-border bg-background/60 text-muted-foreground hover:bg-muted/40'}`, children: g }, g));
                                                                }) })] }), _jsxs("button", { type: "button", onClick: () => setNewForMe((v) => !v), className: `w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${newForMe
                                                            ? 'border-fuchsia-500 bg-gradient-to-br from-fuchsia-500/10 via-pink-500/10 to-rose-500/10'
                                                            : 'border-border bg-background/40 hover:border-fuchsia-500/40'}`, children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-semibold", children: "\u2728 \u041D\u043E\u0432\u043E\u0435 \u0434\u043B\u044F \u043C\u0435\u043D\u044F" }), _jsx("div", { className: "text-[11px] text-muted-foreground mt-0.5", children: newForMe
                                                                            ? 'AI предложит жанры, которых нет в библиотеке'
                                                                            : 'Опираться на ваши вкусы из библиотеки' })] }), _jsx("div", { className: `ml-3 w-10 h-6 rounded-full transition-all flex items-center px-1 shrink-0 ${newForMe
                                                                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 justify-end'
                                                                    : 'bg-muted justify-start'}`, children: _jsx("div", { className: "w-4 h-4 bg-white rounded-full shadow" }) })] })] }), _jsxs(DialogFooter, { className: "gap-2 sm:justify-between", children: [_jsx(Button, { type: "button", variant: "ghost", disabled: !hasNonDefaultParams, onClick: resetParams, children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C" }), _jsx(Button, { type: "button", onClick: () => setParamsOpen(false), children: "\u0413\u043E\u0442\u043E\u0432\u043E" })] })] }) })] }) })] }), _jsxs("div", { className: "space-y-4 min-w-0", children: [isStreaming && (_jsx(ProgressTimeline, { entries: progress, cardsCount: cards.length, target: count })), (meta || durationMs !== null) && cards.length > 0 && (_jsx(ResultsHeader, { meta: meta, durationMs: durationMs, count: cards.length })), error && (_jsx(ErrorPanel, { error: error, showDetails: showDetails, onToggleDetails: () => setShowDetails((v) => !v), onClose: () => {
                            setError(null);
                            setShowDetails(false);
                        } })), (cards.length > 0 || isStreaming) && (_jsxs("div", { className: "grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", children: [cards.map((card, idx) => {
                                const saved = savedByKey[cardKey(card)];
                                return (_jsx(AICard, { card: card, index: idx, onAdd: (c) => {
                                        const initial = aiCardToAddMediaInitial(c);
                                        _onAdd({
                                            title: initial.title,
                                            description: initial.description,
                                            image: initial.image,
                                            rating: initial.rating,
                                            genres: initial.genres,
                                            category: initial.category,
                                            source: initial.source,
                                        }, saved?.id);
                                    }, onConsider: handleConsider, onFavorite: handleFavorite, considerActive: saved?.status === 'considering', favoriteActive: saved?.status === 'favorited' }, `${card.title}-${idx}`));
                            }), showSkeletons &&
                                Array.from({ length: Math.min(skeletonCount, 6) }).map((_, i) => (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "aspect-[2/3] w-full rounded-xl" }), _jsx(Skeleton, { className: "h-4 w-3/4" }), _jsx(Skeleton, { className: "h-3 w-1/2" }), _jsx(Skeleton, { className: "h-12 w-full" })] }, `skel-${i}`)))] })), !isStreaming && cards.length === 0 && !error && progress.length === 0 && (_jsx(EmptyState, {}))] }), _jsx(ConsentDialog, { open: consentDialogOpen, onCancel: () => setConsentDialogOpen(false), onAccept: handleConsentAccept })] }));
}
function ProgressTimeline({ entries, cardsCount, target, }) {
    const last = entries[entries.length - 1];
    const startedAt = entries[0]?.ts;
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 500);
        return () => clearInterval(id);
    }, []);
    const elapsed = startedAt ? ((now - startedAt) / 1000).toFixed(0) : '0';
    return (_jsxs("div", { className: "rounded-2xl border bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5 p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin text-indigo-500" }), _jsx("span", { className: "text-sm font-semibold", children: stageLabel(last) })] }), _jsxs("div", { className: "text-xs text-muted-foreground tabular-nums", children: [cardsCount, "/", target, " \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u00B7 ", elapsed, "\u0441"] })] }), target > 0 && (_jsx("div", { className: "w-full h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-300", style: {
                        width: `${Math.min(100, (cardsCount / target) * 100)}%`,
                    } }) })), last?.detail && (_jsx("div", { className: "rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground italic max-h-24 overflow-y-auto whitespace-pre-wrap break-words", children: last.detail })), entries.length > 1 && (_jsxs("details", { className: "text-[11px] text-muted-foreground", children: [_jsxs("summary", { className: "cursor-pointer select-none hover:text-foreground", children: ["\u0418\u0441\u0442\u043E\u0440\u0438\u044F (", entries.length, " \u0441\u043E\u0431\u044B\u0442\u0438\u0439)"] }), _jsx("ol", { className: "mt-2 space-y-1 max-h-40 overflow-y-auto pr-2", children: entries
                            .slice()
                            .reverse()
                            .map((e, idx) => (_jsxs("li", { className: "flex items-start gap-2 leading-tight", children: [_jsxs("span", { className: "text-muted-foreground/50 tabular-nums min-w-[40px]", children: ["+", ((e.ts - (startedAt ?? e.ts)) / 1000).toFixed(1), "\u0441"] }), _jsx("span", { className: "font-medium", children: stageLabel(e) })] }, `${e.ts}-${idx}`))) })] }))] }));
}
function ErrorPanel({ error, showDetails, onToggleDetails, onClose, }) {
    const hasDetails = !!error.details && Object.keys(error.details).length > 0;
    const isCodex = (error.details?.binPath ?? '')
        .toLowerCase()
        .includes('codex');
    const copy = () => {
        if (!error.details)
            return;
        void navigator.clipboard.writeText(JSON.stringify({ code: error.code, message: error.message, details: error.details }, null, 2));
        toast.success('Скопировано в буфер обмена');
    };
    return (_jsxs("div", { className: "border border-rose-500/30 bg-rose-500/5 rounded-2xl p-6 space-y-3", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx(AlertCircle, { className: "w-10 h-10 text-rose-500 mx-auto" }), _jsx("h3", { className: "text-lg font-semibold", children: "\u041D\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u043E\u0441\u044C" }), _jsx("p", { className: "text-sm text-muted-foreground max-w-md mx-auto", children: error.message }), error.code === 'cli_not_installed' && (_jsxs("p", { className: "text-xs text-muted-foreground max-w-md mx-auto", children: ["\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 CLI:", ' ', _jsx("code", { className: "bg-muted px-1.5 py-0.5 rounded", children: isCodex
                                    ? 'npm install -g @openai/codex'
                                    : 'npm install -g @anthropic-ai/claude-code' })] })), error.code === 'cli_not_authed' && (_jsxs("p", { className: "text-xs text-muted-foreground max-w-md mx-auto", children: ["\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0432 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0435:", ' ', _jsx("code", { className: "bg-muted px-1.5 py-0.5 rounded", children: isCodex ? 'codex login' : 'claude' }), ' ', "\u0438 \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0432\u0445\u043E\u0434."] }))] }), _jsxs("div", { className: "flex justify-center gap-2", children: [hasDetails && (_jsx(Button, { variant: "outline", size: "sm", onClick: onToggleDetails, className: "gap-1", children: showDetails ? 'Скрыть подробности' : 'Подробнее' })), _jsx(Button, { variant: "outline", size: "sm", onClick: onClose, children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })] }), hasDetails && showDetails && (_jsxs("div", { className: "rounded-xl border bg-background/60 p-3 space-y-2 text-left", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-semibold text-muted-foreground", children: ["\u041A\u043E\u0434: ", error.code ?? 'неизвестно', error.details?.exitCode !== undefined && (_jsxs(_Fragment, { children: [" \u00B7 \u0432\u044B\u0445\u043E\u0434 ", error.details.exitCode] })), error.details?.signal && _jsxs(_Fragment, { children: [" \u00B7 \u0441\u0438\u0433\u043D\u0430\u043B ", error.details.signal] })] }), _jsx(Button, { size: "sm", variant: "ghost", onClick: copy, className: "h-6 text-[11px]", children: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })] }), error.details?.binPath && (_jsx(KeyValue, { k: "\u043F\u0443\u0442\u044C \u043A CLI", v: error.details.binPath })), error.details?.argv && (_jsx(KeyValue, { k: "\u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u044B", v: error.details.argv.join(' ') })), error.details?.stderr && (_jsx(Block, { k: "stderr", v: error.details.stderr })), error.details?.stdout && (_jsx(Block, { k: "stdout (\u0445\u0432\u043E\u0441\u0442)", v: error.details.stdout }))] }))] }));
}
function KeyValue({ k, v }) {
    return (_jsxs("div", { className: "text-[11px] font-mono leading-relaxed", children: [_jsxs("span", { className: "text-muted-foreground", children: [k, ":"] }), ' ', _jsx("span", { className: "break-all", children: v })] }));
}
function Block({ k, v }) {
    return (_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-[11px] text-muted-foreground font-semibold", children: k }), _jsx("pre", { className: "text-[11px] font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-40 overflow-auto", children: v.trim() || '(пусто)' })] }));
}
function ResultsHeader({ meta, durationMs, count, }) {
    const totalTokens = meta && (meta.tokensInput ?? 0) + (meta.tokensOutput ?? 0);
    return (_jsx("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/40 px-4 py-3", children: _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [_jsxs(Badge, { variant: "outline", className: "font-medium", children: [count, " \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A"] }), meta?.modelUsed && (_jsx(Badge, { variant: "outline", className: "font-medium", children: meta.modelUsed })), totalTokens && totalTokens > 0 && (_jsxs("span", { children: [totalTokens.toLocaleString('ru-RU'), " \u0442\u043E\u043A\u0435\u043D\u043E\u0432"] })), meta?.webSearched && (_jsxs(Badge, { className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0", children: [_jsx(Globe, { className: "w-3 h-3 mr-1" }), "\u0432\u0435\u0431-\u043F\u043E\u0438\u0441\u043A"] })), meta?.libraryTruncated && (_jsx(Badge, { className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0", children: "\u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0443\u0441\u0435\u0447\u0435\u043D\u0430" })), meta?.librarySize !== undefined && (_jsxs("span", { children: ["\u00B7 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430: ", meta.librarySize] })), durationMs !== null && (_jsxs("span", { children: ["\u00B7 ", (durationMs / 1000).toFixed(1), "\u0441"] }))] }) }));
}
function EmptyState() {
    return (_jsxs("div", { className: "h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center text-muted-foreground bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5", children: [_jsx("div", { className: "p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 mb-4", children: _jsx(Brain, { className: "w-12 h-12 text-indigo-500/60" }) }), _jsx("h3", { className: "text-lg font-semibold text-foreground", children: "\u0413\u043E\u0442\u043E\u0432 \u043A \u0440\u0430\u0431\u043E\u0442\u0435" }), _jsx("p", { className: "max-w-md mt-2", children: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u0444\u043E\u0440\u043C\u0443 \u0432\u044B\u0448\u0435 \u2014 AI \u043F\u0440\u043E\u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0435\u0442 \u0432\u0441\u044E \u0432\u0430\u0448\u0443 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443 \u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442 \u043A\u0430\u043A \u043A\u043B\u0430\u0441\u0441\u0438\u043A\u0443, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0432\u044B \u043C\u043E\u0433\u043B\u0438 \u043F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C, \u0442\u0430\u043A \u0438 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u043E\u0432\u0438\u043D\u043A\u0438." })] }));
}
