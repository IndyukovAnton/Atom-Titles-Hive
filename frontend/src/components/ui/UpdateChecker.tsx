import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';

const RELEASES_URL =
  'https://github.com/IndyukovAnton/Atom-Titles-Hive/releases/latest';

const isTauri = (): boolean =>
  typeof window !== 'undefined' &&
  '__TAURI_INTERNALS__' in window &&
  Boolean(
    (window as unknown as { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__,
  );

interface UpdateCheckerProps {
  /** Override label shown next to the icon. Defaults to current app version. */
  label?: string;
  className?: string;
}

/**
 * Floating "check for updates" button. Used on auth screens so a broken build
 * can always self-recover via the updater without the user reaching Settings.
 */
export function UpdateChecker({ label, className }: UpdateCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);

  const handleClick = async () => {
    if (!isTauri()) {
      window.open(RELEASES_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsChecking(true);
    const checkingToast = toast.loading('Проверяем наличие обновлений…');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (!update) {
        toast.success('Установлена последняя версия', { id: checkingToast });
        return;
      }

      toast.dismiss(checkingToast);
      toast.info(`Доступна версия ${update.version} — скачиваю…`);
      let total = 0;
      let downloaded = 0;
      const progressToast = toast.loading('Загрузка обновления…');
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            total = event.data.contentLength ?? 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (total > 0) {
              const pct = Math.round((downloaded / total) * 100);
              toast.loading(`Загрузка обновления… ${pct}%`, {
                id: progressToast,
              });
            }
            break;
          case 'Finished':
            toast.success('Обновление загружено, перезапускаю…', {
              id: progressToast,
            });
            break;
        }
      });
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (e) {
      logger.error('Update check failed', e);
      toast.error(
        'Не удалось проверить обновления. Откройте страницу релизов вручную.',
        {
          id: checkingToast,
          action: {
            label: 'Открыть',
            onClick: () =>
              window.open(RELEASES_URL, '_blank', 'noopener,noreferrer'),
          },
        },
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isChecking}
      className={className}
      title="Проверить обновления"
    >
      {isChecking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="ml-2 text-xs">{label ?? `v${__APP_VERSION__}`}</span>
    </Button>
  );
}
