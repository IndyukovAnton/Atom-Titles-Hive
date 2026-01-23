import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { MediaEntry } from '@/api/media';
import { cn } from '@/lib/utils';
import { localizeCategory } from '@/utils/localization';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  suggestions: MediaEntry[];
  isSearching: boolean;
  onSelectSuggestion?: (media: MediaEntry) => void;
  className?: string;
}

export const SearchBar = ({
  value,
  onChange,
  onClear,
  suggestions,
  isSearching,
  onSelectSuggestion,
  className,
}: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
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

  const handleSelectSuggestion = (media: MediaEntry) => {
    onSelectSuggestion?.(media);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    onClear();
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div id="search-bar" ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск по названию, описанию, жанрам, тегам..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
          className="pl-10 pr-20 h-10"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Autocomplete Suggestions */}
      {shouldShowSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2">
          <div className="py-1">
            {suggestions.map((media, index) => (
              <button
                key={media.id}
                onClick={() => handleSelectSuggestion(media)}
                className={cn(
                  'w-full px-4 py-2.5 text-left hover:bg-accent transition-colors',
                  'flex items-start gap-3 group',
                  selectedIndex === index && 'bg-accent'
                )}
              >
                {media.image && (
                  <img
                    src={media.image}
                    alt={media.title}
                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {media.title}
                  </p>
                  {media.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {media.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {media.category && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {localizeCategory(media.category)}
                      </span>
                    )}
                    {media.rating > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ★ {media.rating}/10
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
