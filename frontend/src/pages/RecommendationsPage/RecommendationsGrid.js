import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Library, Plus, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeGenres } from '@/utils/normalize-genres';
const GENRE_COLORS = [
    'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
];
export function RecommendationsGrid({ items, onAdd, }) {
    return (_jsx("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: items.map((item, idx) => {
            const genres = normalizeGenres(item.genres);
            return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3, delay: idx * 0.05 }, children: _jsxs(Card, { className: "h-full flex flex-col hover:shadow-2xl transition-all duration-300 overflow-hidden group border-0 shadow-md bg-card/80 backdrop-blur-sm hover:-translate-y-1", children: [_jsxs("div", { className: "relative aspect-[2/3] overflow-hidden bg-muted", children: [item.image ? (_jsx("img", { src: item.image, alt: item.title, className: "object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" })) : (_jsx("div", { className: "flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50", children: _jsx(Library, { className: "w-12 h-12 text-muted-foreground/30" }) })), _jsx("div", { className: "absolute top-2 right-2 flex gap-1", children: item.rating && (_jsxs(Badge, { className: "bg-black/70 text-white backdrop-blur-md shadow-lg font-bold border-0 px-2.5 py-1", children: [_jsx(Star, { className: "w-3 h-3 mr-1 fill-amber-400 text-amber-400" }), item.rating] })) }), onAdd && !item.inLibrary && (_jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4", children: _jsxs(Button, { size: "lg", className: "w-full gap-2 font-semibold shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70", onClick: () => onAdd(item), children: [_jsx(Plus, { className: "w-5 h-5" }), "\u0412 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443"] }) }))] }), _jsxs(CardHeader, { className: "p-4 pb-2 space-y-2", children: [_jsx(CardTitle, { className: "line-clamp-1 text-base font-bold", title: item.title, children: item.title }), _jsxs("div", { className: "flex flex-wrap gap-1.5", children: [genres.slice(0, 2).map((g, i) => (_jsx(Badge, { variant: "outline", className: `text-[10px] h-5 px-2 font-medium ${GENRE_COLORS[i % GENRE_COLORS.length]}`, children: g }, g))), item.category && (_jsx(Badge, { variant: "outline", className: "text-[10px] h-5 px-2 bg-muted/50", children: item.category }))] })] }), _jsx(CardContent, { className: "p-4 pt-2 flex-grow", children: item.description && (_jsx("p", { className: "text-sm text-muted-foreground line-clamp-3 leading-relaxed", children: item.description })) })] }) }, `${item.title}-${idx}`));
        }) }));
}
export function RecommendationsGridSkeleton() {
    return (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: Array.from({ length: 8 }).map((_, i) => (_jsxs("div", { className: "flex flex-col space-y-3", children: [_jsx(Skeleton, { className: "h-[300px] w-full rounded-xl" }), _jsxs("div", { className: "space-y-2 p-2", children: [_jsx(Skeleton, { className: "h-4 w-[80%]" }), _jsx(Skeleton, { className: "h-4 w-[60%]" }), _jsx(Skeleton, { className: "h-16 w-full mt-2" })] })] }, i))) }));
}
