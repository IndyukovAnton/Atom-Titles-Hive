import { useState, useCallback } from 'react';
/**
 * Хук для управления фильтрами медиа
 */
export function useFilters() {
    const [filters, setFilters] = useState({});
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
    }, []);
    const removeFilter = useCallback((key) => {
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
