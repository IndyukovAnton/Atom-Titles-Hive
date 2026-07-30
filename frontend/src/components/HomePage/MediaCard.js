import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Play, Film, Tv, BookOpen, Gamepad2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AiSourceBadge } from '@/components/AiSourceBadge';
import { localizeCategory } from '../../utils/localization';
const getCategoryIcon = (category) => {
    switch (category) {
        case 'Movie':
            return _jsx(Film, { className: "w-2.5 h-2.5" });
        case 'Series':
            return _jsx(Tv, { className: "w-2.5 h-2.5" });
        case 'Anime':
            return _jsx(Play, { className: "w-2.5 h-2.5" });
        case 'Game':
            return _jsx(Gamepad2, { className: "w-2.5 h-2.5" });
        case 'Book':
        case 'Manga':
            return _jsx(BookOpen, { className: "w-2.5 h-2.5" });
        default:
            return null;
    }
};
const getRatingGradient = (rating) => {
    if (rating >= 8)
        return 'from-emerald-500 to-green-600';
    if (rating >= 6)
        return 'from-amber-400 to-yellow-500';
    if (rating >= 4)
        return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
};
export const MediaCard = React.memo(({ media, isFavorite, onToggleFavorite }) => {
    const navigate = useNavigate();
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `media-${media.id}`,
        data: media,
    });
    const style = transform
        ? {
            transform: CSS.Translate.toString(transform),
            touchAction: 'none',
        }
        : undefined;
    return (_jsx("div", { ref: setNodeRef, style: style, ...attributes, ...listeners, className: "min-w-0", children: _jsxs(Card, { onClick: () => navigate(`/media/${media.id}`), className: "group relative overflow-hidden border-border/40 bg-card/60 hover:bg-card/90 backdrop-blur-sm transition-all duration-400 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", tabIndex: 0, onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/media/${media.id}`);
                }
            }, children: [_jsx("div", { className: "absolute -inset-px rounded-xl bg-gradient-to-r from-primary/20 via-accent-purple/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10" }), _jsxs("div", { className: "aspect-[2/3] relative bg-gradient-to-br from-muted/20 to-muted/40 overflow-hidden", children: [media.image ? (_jsxs(_Fragment, { children: [_jsx("img", { src: media.image, alt: media.title, loading: "lazy", className: "w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-110 group-hover:brightness-105" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" })] })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50 text-muted-foreground p-2 text-center", children: [_jsx("div", { className: "p-4 rounded-full bg-muted/50 mb-3", children: _jsx(Film, { className: "w-8 h-8 opacity-30" }) }), _jsx("span", { className: "text-xs opacity-50", children: "\u041D\u0435\u0442 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" })] })), _jsxs("div", { className: `absolute top-2.5 right-2.5 bg-gradient-to-r ${getRatingGradient(media.rating)} text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg ring-1 ring-white/20`, children: [_jsx(Star, { className: "h-3 w-3 fill-current drop-shadow" }), _jsx("span", { className: "drop-shadow", children: media.rating })] }), (media.category || media.source === 'ai') && (_jsxs("div", { className: "absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5", children: [media.category && (_jsxs("div", { className: "bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 ring-1 ring-white/10", children: [getCategoryIcon(media.category), localizeCategory(media.category)] })), media.source === 'ai' && _jsx(AiSourceBadge, {})] })), onToggleFavorite && (_jsx("button", { type: "button", "aria-label": isFavorite ? 'Убрать из избранного' : 'В избранное', title: isFavorite ? 'Убрать из избранного' : 'В избранное', onClick: (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleFavorite(media.id, !isFavorite);
                            }, onPointerDown: (e) => e.stopPropagation(), className: `absolute bottom-3 right-3 z-10 p-2 rounded-full backdrop-blur-md shadow-lg border border-white/15 transition-all ${isFavorite
                                ? 'bg-rose-500/90 text-white opacity-100'
                                : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-500/80'}`, children: _jsx(Star, { className: `w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}` }) })), _jsx("div", { className: "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent", children: _jsx("h3", { className: "font-semibold text-white text-sm leading-tight line-clamp-2 drop-shadow-lg", title: media.title, children: media.title }) })] }), _jsx(CardContent, { className: "p-3 border-t border-border/30", children: _jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 leading-relaxed", children: media.description || 'Описание не добавлено' }) })] }) }));
});
