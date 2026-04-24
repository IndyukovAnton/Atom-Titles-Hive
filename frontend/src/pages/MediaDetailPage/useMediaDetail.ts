import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { mediaApi, type MediaEntry } from '@/api/media';
import { logger } from '@/utils/logger';

export function useMediaDetail(id: string | undefined) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [media, setMedia] = useState<MediaEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const invalidateLists = useCallback(async () => {
    // После любой CRUD-операции со записью — точечно сбрасываем списочные
    // запросы, чтобы HomePage и sidebar-статистика подтянули свежие данные.
    await queryClient.invalidateQueries({ queryKey: ['media'] });
    await queryClient.invalidateQueries({ queryKey: ['groups'] });
  }, [queryClient]);

  const fetchMedia = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await mediaApi.getOne(Number(id));
      setMedia(data);
    } catch (err) {
      setError('Не удалось загрузить информацию о записи');
      logger.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!media) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой (макс 10MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await mediaApi.addFile(media.id, {
            url: reader.result as string,
            type: file.type.startsWith('video') ? 'video' : 'image',
          });
          fetchMedia();
          invalidateLists();
        } catch (e) {
          logger.error(e);
          alert('Не удалось загрузить файл');
        }
      };
      reader.readAsDataURL(file);
    },
    [media, fetchMedia, invalidateLists],
  );

  const deleteFile = useCallback(
    async (fileId: number) => {
      if (!confirm('Удалить этот файл?')) return;
      try {
        await mediaApi.removeFile(fileId);
        fetchMedia();
        invalidateLists();
      } catch (e) {
        logger.error(e);
        alert('Не удалось удалить файл');
      }
    },
    [fetchMedia, invalidateLists],
  );

  const deleteRecord = useCallback(async () => {
    if (!media || !confirm('Вы уверены, что хотите удалить эту запись?')) return;
    try {
      await mediaApi.delete(media.id);
      await invalidateLists();
      navigate('/');
    } catch (e) {
      logger.error(e);
      alert('Не удалось удалить запись');
    }
  }, [media, navigate, invalidateLists]);

  return {
    media,
    isLoading,
    error,
    refresh: fetchMedia,
    uploadFile,
    deleteFile,
    deleteRecord,
  };
}
