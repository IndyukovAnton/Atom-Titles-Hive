import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Layers, Search, Star, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { mediaApi } from '@/api/media';
import { logger } from '@/utils/logger';
import { PREDEFINED_GENRES, PREDEFINED_TAGS } from '@/constants/media';
import { cn } from '@/lib/utils';
const ACCENT_CLASSES = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
};
function FilterSection({ accent, icon, label, onReset, children, }) {
    return (_jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-3 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: `p-1.5 rounded-lg ring-1 ${ACCENT_CLASSES[accent]}`, children: icon }), _jsx(Label, { className: "text-sm font-semibold", children: label })] }), onReset && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onReset, className: "h-7 px-2 text-xs text-muted-foreground hover:text-foreground", children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C" }))] }), children] }));
}
function SubLabel({ htmlFor, children, }) {
    return (_jsx(Label, { htmlFor: htmlFor, className: "text-[10px] uppercase tracking-wider text-muted-foreground font-medium", children: children }));
}
// 10 кликабельных звёзд + текущее значение/«—». Повторный клик на ту же звезду
// очищает фильтр, чтобы пользователь мог быстро сбросить порог без выхода из панели.
function RatingStarRow({ label, value, onChange, onClear }) {
    const stars = Array.from({ length: 10 }, (_, i) => i + 1);
    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(SubLabel, { children: label }), _jsx("span", { className: "text-[11px] font-mono text-muted-foreground", children: value !== undefined ? `${value}/10` : '—' })] }), _jsx("div", { className: "flex items-center gap-0.5", children: stars.map((rating) => {
                    const isActive = value !== undefined && rating <= value;
                    return (_jsx("button", { type: "button", onClick: () => {
                            if (value === rating)
                                onClear();
                            else
                                onChange(rating);
                        }, className: cn('p-1 -m-0.5 rounded transition-all hover:scale-110 cursor-pointer', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50'), "aria-label": `${label} ${rating} из 10`, "aria-pressed": isActive, children: _jsx(Star, { className: cn('h-4 w-4 transition-colors', isActive
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/40 hover:text-amber-400/60') }) }, rating));
                }) })] }));
}
function ChipSelector({ options, selected, onToggle, prefix = '', showSearch = false, searchPlaceholder = 'Поиск...', chipSelectedClass, chipIdleClass, }) {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return options;
        return options.filter((o) => o.toLowerCase().includes(q));
    }, [options, query]);
    return (_jsxs("div", { className: "space-y-2.5", children: [showSearch && (_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }), _jsx(Input, { value: query, onChange: (e) => setQuery(e.target.value), placeholder: searchPlaceholder, className: "h-8 pl-8 text-xs" })] })), filtered.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground py-1", children: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" })) : (_jsx("div", { className: "flex flex-wrap gap-1.5", children: filtered.map((option) => {
                    const isSelected = selected.includes(option);
                    return (_jsxs("button", { type: "button", onClick: () => onToggle(option), className: cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer', isSelected ? chipSelectedClass : chipIdleClass), children: [prefix, option] }, option));
                }) }))] }));
}
export const FilterPanel = ({ filters, onUpdateFilter, onRemoveFilter, onClearFilters, hasActiveFilters, isOpen, onOpenChange, }) => {
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    useEffect(() => {
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const data = await mediaApi.getCategories();
                setCategories(data);
            }
            catch (error) {
                logger.error('Failed to load categories:', error);
            }
            finally {
                setIsLoadingCategories(false);
            }
        };
        loadCategories();
    }, []);
    const activeFiltersCount = Object.keys(filters).length;
    const toggleGenre = (genre) => {
        const current = filters.genres || [];
        const next = current.includes(genre)
            ? current.filter((g) => g !== genre)
            : [...current, genre];
        onUpdateFilter('genres', next.length ? next : undefined);
    };
    const toggleTag = (tag) => {
        const current = filters.tags || [];
        const next = current.includes(tag)
            ? current.filter((t) => t !== tag)
            : [...current, tag];
        onUpdateFilter('tags', next.length ? next : undefined);
    };
    // Включаем в доступные варианты и предопределённый список, и уже выбранные
    // (на случай если у пользователя в фильтре остался кастомный тег/жанр,
    // которого нет в predefined — иначе он "пропадёт" из UI).
    const genreOptions = useMemo(() => {
        const all = new Set([...PREDEFINED_GENRES, ...(filters.genres || [])]);
        return Array.from(all);
    }, [filters.genres]);
    const tagOptions = useMemo(() => {
        const all = new Set([...PREDEFINED_TAGS, ...(filters.tags || [])]);
        return Array.from(all);
    }, [filters.tags]);
    return (_jsxs(Sheet, { open: isOpen, onOpenChange: onOpenChange, children: [_jsx(SheetTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "relative", children: [_jsx(Filter, { className: "mr-2 h-4 w-4" }), "\u0424\u0438\u043B\u044C\u0442\u0440\u044B", activeFiltersCount > 0 && (_jsx(Badge, { variant: "default", className: "ml-2 px-1.5 min-w-[20px] h-5 flex items-center justify-center", children: activeFiltersCount }))] }) }), _jsxs(SheetContent, { className: "w-full sm:max-w-md overflow-y-auto p-0 flex flex-col", children: [_jsxs(SheetHeader, { className: "px-6 pt-6 pb-4 border-b", children: [_jsx(SheetTitle, { className: "text-lg", children: "\u0424\u0438\u043B\u044C\u0442\u0440\u044B" }), _jsx(SheetDescription, { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B \u0434\u043B\u044F \u043F\u043E\u0438\u0441\u043A\u0430 \u043D\u0443\u0436\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4 space-y-3", children: [_jsx(FilterSection, { accent: "blue", icon: _jsx(Layers, { className: "h-4 w-4" }), label: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", onReset: filters.category ? () => onRemoveFilter('category') : undefined, children: _jsxs(Select, { value: filters.category ?? 'all', onValueChange: (value) => onUpdateFilter('category', value === 'all' ? undefined : value), disabled: isLoadingCategories, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "\u0412\u0441\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }), categories.map((category) => (_jsx(SelectItem, { value: category, children: category }, category)))] })] }) }), _jsx(FilterSection, { accent: "amber", icon: _jsx(Star, { className: "h-4 w-4" }), label: "\u0420\u0435\u0439\u0442\u0438\u043D\u0433", onReset: filters.minRating !== undefined ||
                                    filters.maxRating !== undefined
                                    ? () => {
                                        onRemoveFilter('minRating');
                                        onRemoveFilter('maxRating');
                                    }
                                    : undefined, children: _jsxs("div", { className: "space-y-3", children: [_jsx(RatingStarRow, { label: "\u041E\u0442", value: filters.minRating, onChange: (value) => onUpdateFilter('minRating', value), onClear: () => onRemoveFilter('minRating') }), _jsx(RatingStarRow, { label: "\u0414\u043E", value: filters.maxRating, onChange: (value) => onUpdateFilter('maxRating', value), onClear: () => onRemoveFilter('maxRating') })] }) }), _jsx(FilterSection, { accent: "purple", icon: _jsx(Calendar, { className: "h-4 w-4" }), label: "\u041F\u0435\u0440\u0438\u043E\u0434", onReset: filters.startDate || filters.endDate
                                    ? () => {
                                        onRemoveFilter('startDate');
                                        onRemoveFilter('endDate');
                                    }
                                    : undefined, children: _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(SubLabel, { htmlFor: "startDate", children: "\u041D\u0430\u0447\u0430\u043B\u043E" }), _jsx(Input, { id: "startDate", type: "date", value: filters.startDate ?? '', onChange: (e) => onUpdateFilter('startDate', e.target.value || undefined) })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(SubLabel, { htmlFor: "endDate", children: "\u041A\u043E\u043D\u0435\u0446" }), _jsx(Input, { id: "endDate", type: "date", value: filters.endDate ?? '', onChange: (e) => onUpdateFilter('endDate', e.target.value || undefined) })] })] }) }), _jsx(FilterSection, { accent: "emerald", icon: _jsx(Tag, { className: "h-4 w-4" }), label: "\u0416\u0430\u043D\u0440\u044B", onReset: filters.genres && filters.genres.length > 0
                                    ? () => onRemoveFilter('genres')
                                    : undefined, children: _jsx(ChipSelector, { options: genreOptions, selected: filters.genres || [], onToggle: toggleGenre, showSearch: true, searchPlaceholder: "\u041D\u0430\u0439\u0442\u0438 \u0436\u0430\u043D\u0440...", chipSelectedClass: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600", chipIdleClass: "bg-transparent text-foreground border-border hover:bg-emerald-500/10 hover:border-emerald-500/40" }) }), _jsx(FilterSection, { accent: "rose", icon: _jsx(Tag, { className: "h-4 w-4" }), label: "\u0422\u0435\u0433\u0438", onReset: filters.tags && filters.tags.length > 0
                                    ? () => onRemoveFilter('tags')
                                    : undefined, children: _jsx(ChipSelector, { options: tagOptions, selected: filters.tags || [], onToggle: toggleTag, prefix: "#", chipSelectedClass: "bg-rose-500 text-white border-rose-500 hover:bg-rose-600", chipIdleClass: "bg-transparent text-foreground border-border hover:bg-rose-500/10 hover:border-rose-500/40" }) })] }), hasActiveFilters && (_jsx("div", { className: "border-t bg-background/80 backdrop-blur px-6 py-4", children: _jsxs(Button, { variant: "outline", onClick: onClearFilters, className: "w-full cursor-pointer", children: [_jsx(X, { className: "mr-2 h-4 w-4" }), "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0441\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B", _jsx(Badge, { variant: "secondary", className: "ml-2 px-1.5 min-w-[20px] h-5", children: activeFiltersCount })] }) }))] })] }));
};
