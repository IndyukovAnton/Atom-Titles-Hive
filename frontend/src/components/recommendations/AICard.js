import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { BookOpen, Film, Gamepad2, Library, Pin, Plus, Sparkles, Star, Tv } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const TYPE_LABELS = {
    movie: 'Фильм',
    series: 'Сериал',
    anime: 'Аниме',
    book: 'Книга',
    game: 'Игра',
    other: 'Другое',
};
const TYPE_ICON = {
    movie: Film,
    series: Tv,
    anime: Tv,
    book: BookOpen,
    game: Gamepad2,
    other: Library,
};
const GENRE_COLORS = [
    'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
];
export function AICard({ card, index, onAdd, onConsider, onFavorite, considerActive, favoriteActive, }) {
    const TypeIcon = TYPE_ICON[card.type];
    return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3, delay: Math.min(index * 0.05, 0.5) }, children: _jsxs(Card, { className: "h-full flex flex-col hover:shadow-2xl transition-all duration-300 overflow-hidden group border-0 shadow-md bg-card/80 backdrop-blur-sm hover:-translate-y-1", children: [_jsxs("div", { className: "relative aspect-[2/3] overflow-hidden bg-muted", children: [card.posterUrl ? (_jsx("img", { src: card.posterUrl, alt: card.title, loading: "lazy", className: "object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" })) : (_jsx("div", { className: "flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10", children: _jsx(TypeIcon, { className: "w-16 h-16 text-indigo-500/40" }) })), _jsxs("div", { className: "absolute top-2 left-2 flex flex-col gap-1.5", children: [card.releasedRecently && (_jsx(Badge, { className: "bg-emerald-500/90 text-white border-0 shadow-lg font-bold px-2.5 py-1", children: "\u041D\u041E\u0412\u041E\u0415" })), _jsx(Badge, { className: "bg-black/70 text-white backdrop-blur-md border-0 px-2 py-0.5 text-[10px] font-medium", children: TYPE_LABELS[card.type] })] }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1.5 items-start z-20", children: [typeof card.estimatedRating === 'number' && (_jsxs(Badge, { className: "bg-black/70 text-white backdrop-blur-md shadow-lg font-bold border-0 px-2.5 py-1 self-center", children: [_jsx(Star, { className: "w-3 h-3 mr-1 fill-amber-400 text-amber-400" }), card.estimatedRating.toFixed(1)] })), onConsider && (_jsx("button", { type: "button", onClick: (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onConsider(card);
                                    }, title: considerActive ? 'В разделе «Подумаю»' : 'Подумать позже', className: `p-1.5 rounded-full backdrop-blur-md shadow-lg border transition-all ${considerActive
                                        ? 'bg-amber-500/90 border-amber-400 text-white'
                                        : 'bg-black/70 border-white/20 text-white hover:bg-amber-500/80'}`, children: _jsx(Pin, { className: `w-3.5 h-3.5 ${considerActive ? 'fill-current' : ''}` }) })), onFavorite && (_jsx("button", { type: "button", onClick: (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onFavorite(card);
                                    }, title: favoriteActive ? 'В избранном' : 'В избранное', className: `p-1.5 rounded-full backdrop-blur-md shadow-lg border transition-all ${favoriteActive
                                        ? 'bg-rose-500/90 border-rose-400 text-white'
                                        : 'bg-black/70 border-white/20 text-white hover:bg-rose-500/80'}`, children: _jsx(Star, { className: `w-3.5 h-3.5 ${favoriteActive ? 'fill-current' : ''}` }) }))] }), _jsx("div", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4 pt-12", children: _jsxs(Button, { size: "lg", className: "w-full gap-2 font-semibold shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0", onClick: (e) => {
                                    e.stopPropagation();
                                    onAdd(card);
                                }, children: [_jsx(Plus, { className: "w-5 h-5" }), "\u0412 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443"] }) })] }), _jsxs(CardHeader, { className: "p-4 pb-2 space-y-2", children: [_jsxs(CardTitle, { className: "line-clamp-2 text-base font-bold leading-tight", title: card.title, children: [card.title, card.year && (_jsx("span", { className: "text-xs font-normal text-muted-foreground ml-2", children: card.year }))] }), card.originalTitle && card.originalTitle !== card.title && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-1", title: card.originalTitle, children: card.originalTitle })), _jsx("div", { className: "flex flex-wrap gap-1.5", children: card.genres.slice(0, 3).map((g, i) => (_jsx(Badge, { variant: "outline", className: `text-[10px] h-5 px-2 font-medium ${GENRE_COLORS[i % GENRE_COLORS.length]}`, children: g }, `${g}-${i}`))) })] }), _jsx(CardContent, { className: "p-4 pt-2 flex-grow flex flex-col gap-3", children: _jsxs("div", { className: "flex items-start gap-2 text-sm text-muted-foreground leading-relaxed", children: [_jsx(Sparkles, { className: "w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" }), _jsx("p", { className: "whitespace-pre-wrap break-words", children: card.whyRecommended })] }) })] }) }));
}
