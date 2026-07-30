/**
 * Единая точка логики автообновления приложения.
 *
 * До этого поток check → downloadAndInstall → relaunch был продублирован
 * в UpdateChecker.tsx и SettingsPage/index.tsx — классический источник
 * рассинхрона при правках. Теперь оба потребителя зовут функции отсюда.
 */

import { toast } from '@/utils/app-toast';
import { isTauri } from './tauri';
import { logger } from './logger';

export const RELEASES_URL =
  'https://github.com/IndyukovAnton/Atom-Titles-Hive/releases/latest';

export const openReleasesPage = (): void => {
  window.open(RELEASES_URL, '_blank', 'noopener,noreferrer');
};

type UpdateHandle = NonNullable<
  Awaited<ReturnType<(typeof import('@tauri-apps/plugin-updater'))['check']>>
>;

/** Скачивает и ставит обновление с прогресс-тостом, затем перезапускает приложение. */
async function downloadInstallAndRelaunch(update: UpdateHandle): Promise<void> {
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
          toast.loading(`Загрузка обновления… ${pct}%`, { id: progressToast });
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
}

/**
 * Интерактивная проверка обновлений (кнопка в настройках / на auth-экране):
 * полный цикл с тостами. В браузере открывает страницу релизов.
 */
export async function runInteractiveUpdateCheck(): Promise<void> {
  if (!isTauri()) {
    openReleasesPage();
    return;
  }

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
    await downloadInstallAndRelaunch(update);
  } catch (e) {
    logger.error('Update check failed', e);
    toast.error(
      'Не удалось проверить обновления. Откройте страницу релизов вручную.',
      {
        id: checkingToast,
        action: { label: 'Открыть', onClick: openReleasesPage },
      },
    );
  }
}

let startupCheckScheduled = false;

/**
 * Тихая проверка обновлений при старте приложения (только Tauri, один раз за
 * сессию). Без лоадеров: при наличии новой версии — персистентный тост с
 * действием «Обновить», ошибки сети молча глотаются, чтобы автопроверка
 * никогда не мешала пользователю.
 */
export function scheduleStartupUpdateCheck(): void {
  if (startupCheckScheduled || !isTauri()) return;
  startupCheckScheduled = true;

  void (async () => {
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) return;

      logger.info(`Update available: ${update.version}`);
      toast.info(`Доступна версия ${update.version}`, {
        duration: Infinity,
        action: {
          label: 'Обновить',
          onClick: () => {
            void downloadInstallAndRelaunch(update);
          },
        },
        cancel: { label: 'Позже', onClick: () => undefined },
      });
    } catch (e) {
      logger.warn('Startup update check failed (silent)', e);
    }
  })();
}
