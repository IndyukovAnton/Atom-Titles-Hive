import { useState, useCallback } from 'react';

export interface MediaFilters {
  category?: string;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  genres?: string[];
  tags?: string[];
}

/**
 * Хук для управления фильтрами медиа
 */
export function useFilters() {
  const [filters, setFilters] = useState<MediaFilters>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const updateFilter = useCallback(<K extends keyof MediaFilters>(
    key: K,
    value: MediaFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: keyof MediaFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(prev => !prev);
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0;

  return {
    filters,
    updateFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
    isFilterPanelOpen,
    toggleFilterPanel,
    setIsFilterPanelOpen,
  };
}
