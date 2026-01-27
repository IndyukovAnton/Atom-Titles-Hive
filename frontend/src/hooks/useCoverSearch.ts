import { useState, useEffect, useCallback } from 'react';
import {
  searchCovers,
  downloadCover,
  type CoverImage,
} from '../api/coverSearch';
import { toast } from 'sonner';

interface UseCoverSearchProps {
  initialQuery?: string;
  onSelect: (base64: string) => void;
}

export function useCoverSearch({
  initialQuery,
  onSelect,
}: UseCoverSearchProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [allResults, setAllResults] = useState<CoverImage[]>([]); // Все результаты с сервера
  const [results, setResults] = useState<CoverImage[]>([]); // Отображаемые 4 результата
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pinnedImages, setPinnedImages] = useState<CoverImage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0); // Смещение для показа следующих результатов

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query, 0);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string, pageNum: number) => {
    try {
      setLoading(true);
      setError(null);

      const images = await searchCovers(searchQuery, pageNum);

      if (pageNum === 0) {
        // Новый поиск - сбрасываем всё
        setAllResults(images);
        setOffset(0);
        setPage(0);
        updateDisplayedResults(images, 0, pinnedImages);
      } else {
        // Подгрузка следующей страницы
        const newAllResults = [...allResults, ...images];
        setAllResults(newAllResults);
        setPage(pageNum);
        // Важно: обновляем отображение с новыми результатами
        // Используем текущий offset, чтобы показать следующие изображения
        updateDisplayedResults(newAllResults, offset, pinnedImages);
      }

      setHasMore(images.length > 0);
    } catch (err) {
      console.error('Failed to search covers:', err);
      setError('Не удалось найти обложки. Попробуйте другой запрос.');
    } finally {
      setLoading(false);
    }
  };

  // Обновляет отображаемые 4 результата с учётом закрепленных
  const updateDisplayedResults = (
    all: CoverImage[],
    currentOffset: number,
    pinned: CoverImage[],
  ) => {
    const pinnedIds = new Set(pinned.map((p) => p.id));

    // Фильтруем все результаты, исключая закреплённые
    const availableResults = all.filter((img) => !pinnedIds.has(img.id));

    // Берём следующие результаты начиная с offset
    const unpinnedSlots = 4 - pinned.length; // Сколько слотов доступно для незакреплённых
    const nextResults = availableResults.slice(
      currentOffset,
      currentOffset + unpinnedSlots,
    );

    // Комбинируем: сначала закреплённые, потом новые
    const combined = [...pinned, ...nextResults];

    setResults(combined);
  };

  const loadMore = useCallback(() => {
    if (loading) return;

    const pinnedIds = new Set(pinnedImages.map((p) => p.id));
    const availableResults = allResults.filter((img) => !pinnedIds.has(img.id));
    const unpinnedSlots = 4 - pinnedImages.length;

    const nextOffset = offset + unpinnedSlots;

    // Если у нас есть следующие результаты в уже загруженных
    if (nextOffset < availableResults.length) {
      setOffset(nextOffset);
      updateDisplayedResults(allResults, nextOffset, pinnedImages);
    } else if (hasMore) {
      // Нужно загрузить следующую страницу с сервера
      // performSearch сам обновит отображение после загрузки
      setOffset(nextOffset);
      performSearch(query, page + 1);
    }
  }, [loading, allResults, offset, pinnedImages, hasMore, query, page]);

  const handleSelect = async (image: CoverImage) => {
    try {
      setDownloading(image.id);
      const base64 = await downloadCover(image.url);
      onSelect(base64);
    } catch (err) {
      console.error('Failed to download cover:', err);
      toast.error('Не удалось загрузить изображение');
    } finally {
      setDownloading(null);
    }
  };

  const togglePin = (image: CoverImage) => {
    setPinnedImages((prev) => {
      const isPinned = prev.some((p) => p.id === image.id);

      if (isPinned) {
        // Открепить
        const newPinned = prev.filter((p) => p.id !== image.id);
        updateDisplayedResults(allResults, offset, newPinned);
        return newPinned;
      } else {
        // Закрепить (макс 4)
        if (prev.length >= 4) {
          toast.error('Можно закрепить максимум 4 изображения');
          return prev;
        }
        const newPinned = [...prev, image];
        updateDisplayedResults(allResults, offset, newPinned);
        return newPinned;
      }
    });
  };

  return {
    query,
    setQuery,
    results,
    loading,
    downloading,
    error,
    hasMore:
      hasMore ||
      offset + (4 - pinnedImages.length) <
        allResults.length - pinnedImages.length,
    loadMore,
    handleSelect,
    pinnedImages,
    togglePin,
  };
}
