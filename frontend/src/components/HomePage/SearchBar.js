import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { localizeCategory } from '@/utils/localization';
export const SearchBar = ({ value, onChange, onClear, suggestions, isSearching, onSelectSuggestion, className, }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Производное состояние вместо useEffect с setState
    const shouldShowSuggestions = showSuggestions && value && suggestions.length > 0;
    // Сброс selectedIndex когда меняется value или suggestions
    // Adjust state during render to reset selection when input changes
    const [prevValue, setPrevValue] = useState(value);
    const [prevSuggestionsLen, setPrevSuggestionsLen] = useState(suggestions.length);
    if (value !== prevValue || suggestions.length !== prevSuggestionsLen) {
        setPrevValue(value);
        setPrevSuggestionsLen(suggestions.length);
        setSelectedIndex(-1);
    }
    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0)
            return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };
    const handleSelectSuggestion = (media) => {
        onSelectSuggestion?.(media);
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };
    const handleClear = () => {
        onClear();
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };
    return (_jsxs("div", { id: "search-bar", ref: containerRef, className: cn('relative w-full', className), children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E, \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E, \u0436\u0430\u043D\u0440\u0430\u043C, \u0442\u0435\u0433\u0430\u043C...", value: value, onChange: (e) => onChange(e.target.value), onKeyDown: handleKeyDown, onFocus: () => value && suggestions.length > 0 && setShowSuggestions(true), className: "pl-10 pr-20 h-10" }), _jsxs("div", { className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1", children: [isSearching && (_jsx(Loader2, { className: "h-4 w-4 animate-spin text-muted-foreground" })), value && (_jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: handleClear, className: "h-7 w-7 p-0", children: _jsx(X, { className: "h-4 w-4" }) }))] })] }), shouldShowSuggestions && (_jsx("div", { className: "absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2", children: _jsx("div", { className: "py-1", children: suggestions.map((media, index) => (_jsxs("button", { onClick: () => handleSelectSuggestion(media), className: cn('w-full px-4 py-2.5 text-left hover:bg-accent transition-colors', 'flex items-start gap-3 group', selectedIndex === index && 'bg-accent'), children: [media.image && (_jsx("img", { src: media.image, alt: media.title, className: "w-12 h-16 object-cover rounded flex-shrink-0" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-sm truncate group-hover:text-primary transition-colors", children: media.title }), media.description && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 mt-0.5", children: media.description })), _jsxs("div", { className: "flex items-center gap-2 mt-1 flex-wrap", children: [media.category && (_jsx("span", { className: "text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary", children: localizeCategory(media.category) })), media.rating > 0 && (_jsxs("span", { className: "text-xs text-muted-foreground", children: ["\u2605 ", media.rating, "/10"] }))] })] })] }, media.id))) }) }))] }));
};
