import { useState, useCallback, useEffect } from 'react';
import { mediaApi, type MediaEntry } from '../api/media';
import { useDebounce } from './useDebounce';
import { logger } from '../utils/logger';

/**
 * Хук для поиска медиа с автодополнением
 */
export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MediaEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 300);

  const searchMedia = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await mediaApi.search(query);
      setSuggestions(results.slice(0, 5)); // Ограничиваем 5 подсказками
    } catch (error) {
      logger.error('Search failed:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    searchMedia(debouncedQuery);
  }, [debouncedQuery, searchMedia]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSuggestions([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearching,
    clearSearch,
  };
}
