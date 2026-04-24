import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { mediaApi, type MediaEntry } from '../api/media';
import type { MediaFilters } from './useFilters';

interface UseMediaDataParams {
  selectedGroupId: number | null | 'all';
  searchQuery?: string;
  filters?: MediaFilters;
}

export const MEDIA_QUERY_KEY = ['media'] as const;

function buildQueryKey(groupId: number | null | 'all', search?: string) {
  return [
    ...MEDIA_QUERY_KEY,
    { groupId, search: search?.trim() || '' },
  ] as const;
}

// Backwards-compatible signature: accepts either a params object or the
// original positional arguments (selectedGroupId, searchQuery, filters).
export function useMediaData(
  selectedGroupIdOrParams:
    | number
    | null
    | 'all'
    | UseMediaDataParams,
  searchQueryParam?: string,
  filtersParam?: MediaFilters,
) {
  const { selectedGroupId, searchQuery, filters } = useMemo(() => {
    if (
      typeof selectedGroupIdOrParams === 'object' &&
      selectedGroupIdOrParams !== null
    ) {
      return selectedGroupIdOrParams;
    }
    return {
      selectedGroupId: selectedGroupIdOrParams,
      searchQuery: searchQueryParam,
      filters: filtersParam,
    };
  }, [selectedGroupIdOrParams, searchQueryParam, filtersParam]);

  const queryClient = useQueryClient();
  const queryKey = buildQueryKey(selectedGroupId, searchQuery);

  const query = useQuery<MediaEntry[]>({
    queryKey,
    queryFn: () =>
      mediaApi.getAll({
        groupId: selectedGroupId === 'all' ? undefined : selectedGroupId,
        search: searchQuery,
      }),
    // Каждая (groupId, search)-пара кэшируется отдельно. 30s staleTime
    // даёт мгновенный возврат при переключении между уже посещёнными
    // группами, а CRUD-мутации точечно инвалидируют кэш.
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const mediaList = query.data ?? [];

  // Client-side filters — жанры/теги/категория/рейтинг/даты.
  // Сервер уже знает про groupId и search; остальное считаем локально,
  // чтобы не плодить сетевые запросы при смене фильтра.
  const filteredList = useMemo(() => {
    if (!filters) return mediaList;
    let result = mediaList;

    if (filters.category) {
      result = result.filter((item) => item.category === filters.category);
    }
    if (filters.minRating !== undefined) {
      result = result.filter((item) => item.rating >= filters.minRating!);
    }
    if (filters.maxRating !== undefined) {
      result = result.filter((item) => item.rating <= filters.maxRating!);
    }
    if (filters.startDate) {
      result = result.filter(
        (item) => item.startDate && item.startDate >= filters.startDate!,
      );
    }
    if (filters.endDate) {
      result = result.filter(
        (item) => item.endDate && item.endDate <= filters.endDate!,
      );
    }
    if (filters.genres && filters.genres.length > 0) {
      result = result.filter((item) =>
        item.genres?.some((genre) => filters.genres!.includes(genre)),
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter((item) =>
        item.tags?.some((tag) => filters.tags!.includes(tag)),
      );
    }

    return result;
  }, [mediaList, filters]);

  const loadMedia = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
  }, [queryClient]);

  // Direct cache write for optimistic updates — same semantics as the old
  // setMediaList setter: subscribers re-render with the new value.
  const setMediaList = useCallback(
    (next: MediaEntry[]) => {
      queryClient.setQueryData(queryKey, next);
    },
    [queryClient, queryKey],
  );

  const axiosError = query.error as AxiosError<{ message: string }> | null;
  const error =
    axiosError?.response?.data?.message ??
    (query.error ? 'Не удалось загрузить данные' : null);

  return {
    mediaList: filteredList,
    isLoading: query.isLoading,
    error,
    loadMedia,
    setMediaList,
  };
}
