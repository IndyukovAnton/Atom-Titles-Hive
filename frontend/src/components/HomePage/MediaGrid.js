import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MediaCard } from './MediaCard';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
export const MediaGrid = ({ mediaList, isLoading, error, onRefresh, onAddMedia, favoriteIds, onToggleFavorite, }) => {
    if (isLoading) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-[50vh] text-muted-foreground", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mb-4" }), _jsx("p", { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-[50vh] text-destructive", children: [_jsx("p", { className: "mb-4", children: error }), _jsx(Button, { onClick: onRefresh, variant: "outline", children: "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430" })] }));
    }
    if (mediaList.length === 0) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-[50vh] text-muted-foreground space-y-4", children: [_jsx("div", { className: "h-20 w-20 rounded-full bg-muted flex items-center justify-center text-4xl", children: "\uD83D\uDCED" }), _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "font-semibold text-lg text-foreground", children: "\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u0443\u0441\u0442" }), _jsx("p", { children: "\u0412 \u044D\u0442\u043E\u0439 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439" })] }), _jsxs(Button, { onClick: onAddMedia, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u044C"] })] }));
    }
    return (_jsx("div", { className: "grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-6 pb-12 items-start", children: mediaList.map((media) => (_jsx(MediaCard, { media: media, isFavorite: favoriteIds?.has(media.id), onToggleFavorite: onToggleFavorite }, media.id))) }));
};
