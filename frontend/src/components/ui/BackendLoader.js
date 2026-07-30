import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Server, XCircle } from 'lucide-react';
import { isTauri, waitForBackend, setBackendUrl } from '../../utils/tauri';
import { clearApiUrl } from '../../config';
// Каждый этап = «пока меньше N секунд, показываем это сообщение». Чисто
// визуальная подсказка: backend через stdout про этапы не репортит, но
// эмпирически старт укладывается в ~10–15s, и подменять текст лучше, чем
// держать одно «Запуск сервера…» на всю длительность.
const PROGRESS_STAGES = [
    { untilSec: 3, text: 'Запуск сервера…' },
    { untilSec: 8, text: 'Инициализация модулей…' },
    { untilSec: 15, text: 'Подготовка базы данных…' },
    { untilSec: 30, text: 'Почти готово…' },
    { untilSec: Infinity, text: 'Это занимает дольше обычного…' },
];
const stageFor = (seconds) => PROGRESS_STAGES.find((s) => seconds < s.untilSec).text;
/**
 * Компонент-обёртка для ожидания запуска backend sidecar.
 *
 * В Tauri режиме показывает loading UI пока backend не запустится.
 * В браузере сразу показывает children.
 */
export function BackendLoader({ children, onReady, onError }) {
    const [status, setStatus] = useState(() => isTauri() ? 'loading' : 'ready');
    const [errorMessage, setErrorMessage] = useState('');
    const [elapsedSec, setElapsedSec] = useState(0);
    // Тик каждую секунду пока крутимся — для смены сообщений и таймера.
    // Точка отсчёта живёт внутри эффекта: Date.now() в теле рендера
    // (useRef(Date.now())) — impure-вызов, который ловит react-hooks v7.
    useEffect(() => {
        if (status !== 'loading')
            return;
        const startedAt = Date.now();
        const id = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [status]);
    useEffect(() => {
        if (!isTauri()) {
            // В браузере сразу готовы
            onReady?.(import.meta.env.VITE_API_URL || '');
            return;
        }
        // Проверяем, это новый запуск Tauri или перезагрузка страницы внутри сессии
        const sessionMarker = sessionStorage.getItem('tauri-session-started');
        if (!sessionMarker) {
            // Новый запуск Tauri — очищаем кэш от предыдущего запуска
            // (порт генерируется заново каждый раз)
            clearApiUrl();
            sessionStorage.setItem('tauri-session-started', 'true');
        }
        // В Tauri ждём backend
        waitForBackend(60000) // 60 секунд timeout
            .then((url) => {
            setBackendUrl(url);
            setStatus('ready');
            onReady?.(url);
        })
            .catch((error) => {
            setStatus('error');
            setErrorMessage(error.message);
            onError?.(error);
        });
    }, [onReady, onError]);
    // В браузере или после готовности — показываем children
    if (!isTauri() || status === 'ready') {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsx("div", { className: "fixed inset-0 bg-background flex items-center justify-center z-50", children: _jsxs(AnimatePresence, { mode: "wait", children: [status === 'loading' && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "flex flex-col items-center gap-6 text-center", children: [_jsxs("div", { className: "relative", children: [_jsx(motion.div, { animate: { rotate: 360 }, transition: { duration: 2, repeat: Infinity, ease: "linear" }, className: "w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary" }), _jsx(Server, { className: "absolute inset-0 m-auto w-8 h-8 text-primary" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-xl font-semibold text-foreground", children: stageFor(elapsedSec) }), _jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0435\u0440 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0435\u0442\u0441\u044F. \u042D\u0442\u043E \u0440\u0430\u0437\u043E\u0432\u0430\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435." })] }), _jsxs("div", { className: "flex items-center gap-2 text-muted-foreground tabular-nums", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), _jsxs("span", { className: "text-sm", children: [elapsedSec, "s"] })] })] }, "loading")), status === 'error' && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "flex flex-col items-center gap-6 text-center", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center", children: _jsx(XCircle, { className: "w-10 h-10 text-destructive" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-xl font-semibold text-foreground", children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" }), _jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: errorMessage || 'Не удалось запустить локальный сервер' })] }), _jsx("button", { onClick: () => window.location.reload(), className: "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors", children: "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430" })] }, "error"))] }) }));
}
