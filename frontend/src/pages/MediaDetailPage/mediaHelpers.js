import { jsx as _jsx } from "react/jsx-runtime";
import { BookOpen, Film, Gamepad2, Layers, Play, Tv, } from 'lucide-react';
export function getCategoryIcon(categoryRaw) {
    switch (categoryRaw) {
        case 'Movie':
            return _jsx(Film, { className: "w-4 h-4" });
        case 'Series':
            return _jsx(Tv, { className: "w-4 h-4" });
        case 'Anime':
            return _jsx(Play, { className: "w-4 h-4" });
        case 'Game':
            return _jsx(Gamepad2, { className: "w-4 h-4" });
        case 'Book':
        case 'Manga':
            return _jsx(BookOpen, { className: "w-4 h-4" });
        default:
            return _jsx(Layers, { className: "w-4 h-4" });
    }
}
export function getRatingColor(rating) {
    if (rating >= 8)
        return 'from-green-500 to-emerald-600';
    if (rating >= 6)
        return 'from-yellow-500 to-amber-600';
    if (rating >= 4)
        return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-600';
}
