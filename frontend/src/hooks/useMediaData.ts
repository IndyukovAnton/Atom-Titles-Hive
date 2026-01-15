import { useState, useCallback, useEffect, useMemo } from 'react';
import { mediaApi, type MediaEntry } from '../api/media';
import { AxiosError } from 'axios';
import type { MediaFilters } from './useFilters';

interface UseMediaDataParams {
  selectedGroupId: number | null | 'all';
  searchQuery?: string;
  filters?: MediaFilters;
}

export function useMediaData(
  selectedGroupIdOrParams: number | null | 'all' | UseMediaDataParams,
  searchQueryParam?: string,
  filtersParam?: MediaFilters
) {
  // Поддержка обратной совместимости и нового API
  const params = useMemo(() => {
    if (typeof selectedGroupIdOrParams === 'object' && selectedGroupIdOrParams !== null) {
      return selectedGroupIdOrParams;
    }
    return {
      selectedGroupId: selectedGroupIdOrParams,
      searchQuery: searchQueryParam,
      filters: filtersParam,
    };
  }, [selectedGroupIdOrParams, searchQueryParam, filtersParam]);

  const { selectedGroupId, searchQuery, filters } = params;

  const [mediaList, setMediaList] = useState<MediaEntry[]>([]);
  const [filteredList, setFilteredList] = useState<MediaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mediaApi.getAll({ 
        groupId: selectedGroupId === 'all' ? undefined : selectedGroupId,
        search: searchQuery,
      });
      setMediaList(data);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId, searchQuery]);

  // Применение клиентских фильтров
  useEffect(() => {
    let result = [...mediaList];

    if (filters) {
      // Фильтр по категории
      if (filters.category) {
        result = result.filter(item => item.category === filters.category);
      }

      // Фильтр по рейтингу
      if (filters.minRating !== undefined) {
        result = result.filter(item => item.rating >= filters.minRating!);
      }
      if (filters.maxRating !== undefined) {
        result = result.filter(item => item.rating <= filters.maxRating!);
      }

      // Фильтр по датам
      if (filters.startDate) {
        result = result.filter(item => 
          item.startDate && item.startDate >= filters.startDate!
        );
      }
      if (filters.endDate) {
        result = result.filter(item => 
          item.endDate && item.endDate <= filters.endDate!
        );
      }

      // Фильтр по жанрам
      if (filters.genres && filters.genres.length > 0) {
        result = result.filter(item =>
          item.genres?.some(genre => filters.genres!.includes(genre))
        );
      }

      // Фильтр по тегам
      if (filters.tags && filters.tags.length > 0) {
        result = result.filter(item =>
          item.tags?.some(tag => filters.tags!.includes(tag))
        );
      }
    }

    setFilteredList(result);
  }, [mediaList, filters]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  return { 
    mediaList: filteredList, 
    isLoading, 
    error, 
    loadMedia, 
    setMediaList 
  };
}
