import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { Library } from 'lucide-react';
import { recommendationsApi } from '@/api/recommendations';
import { RecommendationsGrid, RecommendationsGridSkeleton, } from './RecommendationsGrid';
import { RecommendationsError } from './RecommendationsError';
export function GenresSection({ onAdd }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['recommendations', 'genres'],
        queryFn: () => recommendationsApi.getByGenres(),
    });
    if (isLoading) {
        return _jsx(RecommendationsGridSkeleton, {});
    }
    if (isError) {
        return _jsx(RecommendationsError, {});
    }
    if (!data || data.length === 0) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card/50", children: [_jsx(Library, { className: "w-12 h-12 text-muted-foreground mb-4" }), _jsx("h3", { className: "text-lg font-semibold", children: "\u041D\u0443\u0436\u043D\u043E \u0431\u043E\u043B\u044C\u0448\u0435 \u0434\u0430\u043D\u043D\u044B\u0445" }), _jsx("p", { className: "text-muted-foreground max-w-sm mt-2", children: "\u0414\u043E\u0431\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0432 \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443, \u043E\u0446\u0435\u043D\u0438\u0432\u0430\u0439\u0442\u0435 \u0438\u0445 \u0438 \u0443\u043A\u0430\u0437\u044B\u0432\u0430\u0439\u0442\u0435 \u0436\u0430\u043D\u0440\u044B \u2014 \u0442\u0430\u043A \u043C\u044B \u0441\u043C\u043E\u0436\u0435\u043C \u043F\u0440\u043E\u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0430\u0448\u0438 \u043B\u044E\u0431\u0438\u043C\u044B\u0435 \u0436\u0430\u043D\u0440\u044B." })] }));
    }
    return _jsx(RecommendationsGrid, { items: data, onAdd: onAdd });
}
