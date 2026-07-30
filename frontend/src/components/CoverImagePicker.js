import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useCoverSearch } from '@/hooks/useCoverSearch';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDetailsDialog } from '@/components/ErrorDetailsDialog';
import { AlertTriangle, ChevronRight, Image as ImageIcon, Info, Loader2, Pin, PinOff, RefreshCw, Search, WifiOff, } from 'lucide-react';
import { cn } from '@/lib/utils';
export function CoverImagePicker({ initialQuery, onSelect, className, }) {
    const { query, setQuery, results, loading, downloading, error, hasMore, loadMore, handleSelect, pinnedImages, togglePin, errorLog, clearErrors, } = useCoverSearch({ initialQuery, onSelect });
    const isOnline = useNetworkStatus();
    const [errorsOpen, setErrorsOpen] = useState(false);
    // Track loading state of each image
    const [imageLoadingStates, setImageLoadingStates] = useState({});
    const [imageErrorStates, setImageErrorStates] = useState({});
    const [retryKeys, setRetryKeys] = useState({});
    // Update query when initialQuery changes
    useEffect(() => {
        if (initialQuery !== query) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);
    // Reset loading states when results change. Паттерн "adjust state during
    // render" (react.dev): синхронный setState внутри useEffect ловит правило
    // react-hooks/set-state-in-effect и лишний рендер-цикл.
    const [prevResults, setPrevResults] = useState(results);
    if (prevResults !== results) {
        setPrevResults(results);
        const newStates = {};
        results.forEach((img) => {
            newStates[img.id] = true; // Mark as loading
        });
        setImageLoadingStates(newStates);
        setImageErrorStates({});
    }
    // Add timeout for image loading (5 seconds)
    useEffect(() => {
        const timers = [];
        results.forEach((img) => {
            if (imageLoadingStates[img.id]) {
                const timer = setTimeout(() => {
                    // If still loading after 5s, mark as error
                    setImageLoadingStates((prev) => ({ ...prev, [img.id]: false }));
                    setImageErrorStates((prev) => ({ ...prev, [img.id]: true }));
                }, 5000); // 5 seconds timeout
                timers.push(timer);
            }
        });
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
        };
    }, [results, imageLoadingStates]);
    const handleImageLoad = (imageId) => {
        setImageLoadingStates((prev) => ({ ...prev, [imageId]: false }));
        setImageErrorStates((prev) => ({ ...prev, [imageId]: false }));
    };
    const handleImageError = (imageId) => {
        setImageErrorStates((prev) => ({ ...prev, [imageId]: true }));
        setImageLoadingStates((prev) => ({ ...prev, [imageId]: false }));
    };
    const handleRetry = (imageId) => {
        // Force image reload by changing key
        setRetryKeys((prev) => ({ ...prev, [imageId]: (prev[imageId] || 0) + 1 }));
        setImageLoadingStates((prev) => ({ ...prev, [imageId]: true }));
        setImageErrorStates((prev) => ({ ...prev, [imageId]: false }));
    };
    // Show only 4 images
    const displayedImages = results.slice(0, 4);
    return (_jsxs("div", { className: cn('flex flex-col h-full', className), children: [_jsx("div", { className: "flex gap-2 mb-4", children: _jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "\u041F\u043E\u0438\u0441\u043A \u043E\u0431\u043B\u043E\u0436\u043A\u0438...", className: "pl-9" })] }) }), _jsx(ScrollArea, { className: "flex-1 min-h-[300px] max-h-[500px]", children: _jsxs("div", { className: "pr-4", children: [!isOnline ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-60 text-center gap-3 px-6 rounded-lg border border-dashed bg-muted/30", children: [_jsx("div", { className: "p-3 rounded-full bg-muted", children: _jsx(WifiOff, { className: "h-7 w-7 text-muted-foreground" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-medium", children: "\u041D\u0435\u0442 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F" }), _jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: "\u041F\u043E\u0438\u0441\u043A \u043E\u0431\u043B\u043E\u0436\u0435\u043A \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0432 \u043E\u0444\u043B\u0430\u0439\u043D-\u0440\u0435\u0436\u0438\u043C\u0435. \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u0441\u044C \u043A \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443 \u0438\u043B\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u0430\u0439\u043B \u0432\u0440\u0443\u0447\u043D\u0443\u044E." })] })] })) : error ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-60 text-center gap-3 px-6 rounded-lg border border-destructive/30 bg-destructive/5", children: [_jsx("div", { className: "p-3 rounded-full bg-destructive/10", children: _jsx(AlertTriangle, { className: "h-7 w-7 text-destructive" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-medium text-destructive", children: error }), _jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: "\u041C\u043E\u0436\u043D\u043E \u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0434\u0440\u0443\u0433\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0438\u043B\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u0444\u0430\u0439\u043B\u043E\u043C." })] }), errorLog.length > 0 && (_jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setErrorsOpen(true), children: [_jsx(Info, { className: "mr-2 h-4 w-4" }), "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435 (", errorLog.length, ")"] }))] })) : displayedImages.length === 0 && !loading ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-40 text-muted-foreground", children: [_jsx(ImageIcon, { className: "h-8 w-8 mb-2 opacity-50" }), _jsxs("p", { children: ["\u041D\u0435\u0442 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439 \u043F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0443 \"", query, "\""] })] })) : (_jsx("div", { className: "grid grid-cols-2 gap-4 pb-4", children: displayedImages.map((image) => {
                                const isPinned = pinnedImages.some((p) => p.id === image.id);
                                const isImageLoading = imageLoadingStates[image.id];
                                const hasError = imageErrorStates[image.id];
                                return (_jsxs("div", { className: cn('relative aspect-[2/3] group rounded-lg overflow-hidden border bg-background transition-all', isPinned
                                        ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20'
                                        : 'hover:border-primary/50'), children: [isImageLoading && (_jsx(Skeleton, { className: "absolute inset-0 w-full h-full" })), hasError ? (_jsxs("div", { className: "absolute inset-0 w-full h-full bg-muted flex flex-col items-center justify-center gap-2 p-4", children: [_jsx(ImageIcon, { className: "h-12 w-12 text-muted-foreground/30" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => handleRetry(image.id), className: "gap-2", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C"] })] })) : (_jsx("img", { src: image.thumbnail, alt: "Cover", className: cn('w-full h-full object-cover transition-opacity', isImageLoading ? 'opacity-0' : 'opacity-100'), loading: "lazy", onLoad: () => handleImageLoad(image.id), onError: () => handleImageError(image.id) }, `${image.id}-${retryKeys[image.id] || 0}`)), isPinned && !isImageLoading && !hasError && (_jsxs("div", { className: "absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1", children: [_jsx(Pin, { className: "h-3 w-3 fill-current" }), "\u0417\u0430\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u043E"] })), !isImageLoading && !hasError && (_jsxs("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2", children: [_jsx("div", { className: "absolute top-2 right-2", children: _jsx(Button, { type: "button", size: "icon", variant: "secondary", className: "h-8 w-8 rounded-full shadow-sm bg-white/90 hover:bg-white", onClick: (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            togglePin(image);
                                                        }, children: isPinned ? (_jsx(PinOff, { className: "h-4 w-4 text-primary" })) : (_jsx(Pin, { className: "h-4 w-4 text-muted-foreground" })) }) }), _jsx(Button, { type: "button", onClick: () => handleSelect(image), disabled: !!downloading, size: "sm", className: "w-full max-w-[100px] cursor-pointer", children: downloading === image.id ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(_Fragment, { children: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C" })) })] }))] }, image.id));
                            }) })), isOnline && !error && errorLog.length > 0 && (_jsxs("div", { className: "mt-2 mb-3 flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs", children: [_jsxs("span", { className: "text-muted-foreground", children: ["\u0411\u044B\u043B\u0438 \u0437\u0430\u043C\u0435\u0447\u0435\u043D\u044B \u043E\u0448\u0438\u0431\u043A\u0438 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435: ", errorLog.length] }), _jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 px-2 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10", onClick: () => setErrorsOpen(true), children: [_jsx(Info, { className: "mr-1 h-3.5 w-3.5" }), "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435"] })] })), results.length > 0 && (_jsx("div", { className: "pb-4 flex justify-center w-full", children: loading ? (_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Loader2, { className: "h-5 w-5 animate-spin" }), _jsx("span", { className: "text-sm", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] })) : hasMore ? (_jsxs(Button, { type: "button", variant: "outline", onClick: loadMore, className: "w-full", children: [_jsx(ChevronRight, { className: "h-4 w-4 mr-2" }), "\u0414\u0430\u043B\u0435\u0435"] })) : null }))] }) }), _jsx(ErrorDetailsDialog, { open: errorsOpen, onOpenChange: setErrorsOpen, errors: errorLog, onClear: clearErrors, title: "\u0421\u0442\u0435\u043A \u043E\u0448\u0438\u0431\u043E\u043A \u043F\u043E\u0438\u0441\u043A\u0430 \u043E\u0431\u043B\u043E\u0436\u0435\u043A", description: "\u0412\u0441\u0435 \u043E\u0448\u0438\u0431\u043A\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0441\u043B\u0443\u0447\u0438\u043B\u0438\u0441\u044C \u043F\u0440\u0438 \u043F\u043E\u0438\u0441\u043A\u0435 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u043E\u0431\u043B\u043E\u0436\u0435\u043A \u0432 \u044D\u0442\u043E\u0439 \u0441\u0435\u0441\u0441\u0438\u0438." })] }));
}
