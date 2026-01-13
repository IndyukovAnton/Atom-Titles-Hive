import { useState, useCallback, useEffect } from 'react';
import { mediaApi, type MediaEntry } from '../api/media';

export function useMediaData(selectedGroupId: number | null | 'all') {
  const [mediaList, setMediaList] = useState<MediaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mediaApi.getAll({ 
        groupId: selectedGroupId === 'all' ? undefined : selectedGroupId 
      });
      setMediaList(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  return { mediaList, isLoading, error, loadMedia, setMediaList };
}
