import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useFormContext } from 'react-hook-form';
import { BookOpen, Film, Gamepad2, Play, Sparkles, Star, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonalization } from '@/hooks/usePersonalization';
import { localizeCategory } from '@/utils/localization';
const CATEGORY_ICON = {
    Movie: Film,
    Series: Tv,
    Book: BookOpen,
    Game: Gamepad2,
    Anime: Play,
    Manga: Sparkles,
};
const CATEGORY_ACCENT = {
    Movie: 'var(--accent-blue)',
    Series: 'var(--accent-pink)',
    Book: 'var(--accent-green)',
    Game: 'var(--accent-purple)',
    Anime: 'var(--accent-orange)',
    Manga: 'var(--accent-cyan)',
};
function isCategory(value) {
    return !!value && value in CATEGORY_ICON;
}
function ratingGradient(rating) {
    if (rating >= 8)
        return 'from-emerald-500 to-green-600';
    if (rating >= 6)
        return 'from-amber-400 to-yellow-500';
    if (rating >= 4)
        return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
}
function useValues() {
    const { watch } = useFormContext();
    return {
        title: watch('title') ?? '',
        category: watch('category'),
        rating: watch('rating') ?? 0,
        image: watch('image') ?? undefined,
    };
}
function CoverPlaceholder({ category }) {
    const Icon = isCategory(category) ? CATEGORY_ICON[category] : Film;
    const accent = isCategory(category) ? CATEGORY_ACCENT[category] : 'var(--muted-foreground)';
    return (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", style: {
            background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 22%, #111), color-mix(in oklab, ${accent} 6%, #000))`,
        }, children: _jsx(Icon, { className: "h-14 w-14 text-white/35" }) }));
}
function MirrorPreview({ values }) {
    const { title, category, rating, image } = values;
    const hasRating = typeof rating === 'number' && rating > 0;
    const CategoryIcon = isCategory(category) ? CATEGORY_ICON[category] : null;
    const localized = localizeCategory(category || null);
    return (_jsxs("div", { className: "relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-muted/20 to-muted/40 shadow-lg", children: [image ? (_jsxs(_Fragment, { children: [_jsx("img", { src: image, alt: title || 'Preview', className: "h-full w-full object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" })] })) : (_jsx(CoverPlaceholder, { category: category })), localized && (_jsxs("div", { className: "absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white ring-1 ring-white/10 backdrop-blur-md", children: [CategoryIcon && _jsx(CategoryIcon, { className: "h-2.5 w-2.5" }), localized] })), hasRating && (_jsxs("div", { "data-testid": "preview-rating", className: cn('absolute right-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-gradient-to-r px-2 py-1 text-xs font-bold text-white shadow-lg ring-1 ring-white/20', ratingGradient(rating ?? 0)), children: [_jsx(Star, { className: "h-3 w-3 fill-current" }), _jsx("span", { children: rating })] })), _jsx("div", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3", children: _jsx("h3", { className: cn('line-clamp-2 text-sm font-semibold leading-tight drop-shadow-lg', title ? 'text-white' : 'text-white/55 italic'), children: title || 'Название записи' }) })] }));
}
function PosterPreview({ values }) {
    const { title, category, rating, image } = values;
    const Icon = isCategory(category) ? CATEGORY_ICON[category] : Film;
    const accent = isCategory(category) ? CATEGORY_ACCENT[category] : 'var(--primary)';
    const localized = localizeCategory(category || null);
    return (_jsxs("div", { "data-testid": "preview-poster", className: "overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)]", style: {
            background: `linear-gradient(180deg, ${accent} 0%, color-mix(in oklab, ${accent} 55%, #000) 100%)`,
        }, children: [_jsxs("div", { className: "flex items-center gap-2.5 px-4 pt-4 text-white", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-white/20", children: _jsx(Icon, { className: "h-4.5 w-4.5" }) }), _jsxs("div", { className: "leading-tight", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wide opacity-80", children: localized || 'Категория' }), _jsx("div", { className: "text-sm font-semibold", children: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C" })] })] }), _jsx("div", { className: "mx-4 mt-3 aspect-[3/4] overflow-hidden rounded-xl border border-dashed border-white/35 bg-white/10", children: image ? (_jsx("img", { src: image, alt: title || 'Preview', className: "h-full w-full object-cover" })) : (_jsx("div", { className: "flex h-full w-full items-center justify-center text-white/45", children: _jsx(Icon, { className: "h-12 w-12" }) })) }), _jsxs("div", { className: "p-4 text-white", children: [_jsx("div", { className: cn('text-base font-bold leading-tight', title ? 'text-white' : 'text-white/60 italic'), children: title || 'Название записи' }), typeof rating === 'number' && rating > 0 && (_jsxs("div", { className: "mt-1 flex items-center gap-1.5 text-xs opacity-90", children: [_jsx(Star, { className: "h-3.5 w-3.5 fill-current", style: { color: 'oklch(0.85 0.18 90)' } }), _jsxs("span", { children: [rating, "/10"] })] }))] })] }));
}
export function PreviewCard() {
    const values = useValues();
    const { addEntryPreviewStyle } = usePersonalization();
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "block text-[10px] uppercase tracking-wide text-muted-foreground", children: "\u0422\u0430\u043A \u0431\u0443\u0434\u0435\u0442 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u0442\u044C" }), addEntryPreviewStyle === 'poster' ? (_jsx(PosterPreview, { values: values })) : (_jsx(MirrorPreview, { values: values }))] }));
}
