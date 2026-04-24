import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi, type MediaEntry } from '@/api/media';
import { logger } from '@/utils/logger';

export function useMediaDetail(id: string | undefined) {
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        } catch (e) {
          logger.error(e);
          alert('Не удалось загрузить файл');
        }
      };
      reader.readAsDataURL(file);
    },
    [media, fetchMedia],
  );

  const deleteFile = useCallback(
    async (fileId: number) => {
      if (!confirm('Удалить этот файл?')) return;
      try {
        await mediaApi.removeFile(fileId);
        fetchMedia();
      } catch (e) {
        logger.error(e);
        alert('Не удалось удалить файл');
      }
    },
    [fetchMedia],
  );

  const deleteRecord = useCallback(async () => {
    if (!media || !confirm('Вы уверены, что хотите удалить эту запись?')) return;
    try {
      await mediaApi.delete(media.id);
      navigate('/');
    } catch (e) {
      logger.error(e);
      alert('Не удалось удалить запись');
    }
  }, [media, navigate]);

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
