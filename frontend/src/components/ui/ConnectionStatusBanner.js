import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuthStore } from '../../store/authStore';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export const ConnectionStatusBanner = () => {
    const isServerAvailable = useAuthStore((state) => state.isServerAvailable);
    const initializeAuth = useAuthStore((state) => state.initializeAuth);
    return (_jsx(AnimatePresence, { children: !isServerAvailable && (_jsxs(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, className: "bg-destructive/15 border-b border-destructive/20 relative overflow-hidden", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 text-destructive", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(WifiOff, { className: "h-4 w-4" }) }), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2", children: [_jsx("span", { className: "font-semibold text-sm", children: "\u041D\u0435\u0442 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C" }), _jsx("span", { className: "text-xs opacity-80 decoration-dotted underline-offset-4", children: "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443 \u0438\u043B\u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435" })] })] }), _jsxs("button", { onClick: () => initializeAuth(), className: "flex items-center gap-2 px-3 py-1 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-xs font-medium whitespace-nowrap", children: [_jsx(RefreshCw, { className: "h-3 w-3" }), "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043F\u043E\u043F\u044B\u0442\u043A\u0443"] })] }), _jsx(motion.div, { animate: {
                        opacity: [0.05, 0.1, 0.05],
                    }, transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }, className: "absolute inset-0 bg-destructive pointer-events-none" })] })) }));
};
