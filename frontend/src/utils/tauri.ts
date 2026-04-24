/**
 * Утилиты для работы с Tauri Desktop.
 *
 * Предоставляет функции для определения Tauri окружения
 * и взаимодействия с backend sidecar.
 */

import { logger } from './logger';

/** Проверяет, запущено ли приложение в Tauri */
export const isTauri = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (('__TAURI_INTERNALS__' in window) || ('__TAURI__' in window))
  );
};

/** Тип события backend-ready */
export interface BackendReadyPayload {
  port: number;
}

/**
 * Ожидает готовности backend sidecar.
 * 
 * @returns Promise с URL backend сервера
 * @throws Error если backend не запустился в течение timeout
 */
export const waitForBackend = async (timeoutMs: number = 30000): Promise<string> => {
  if (!isTauri()) {
    // В браузере возвращаем URL из переменных окружения
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) {
      throw new Error('VITE_API_URL is not defined');
    }
    return envUrl;
  }

  // Сначала проверяем, не установлен ли уже URL (race condition fix)
  // Событие могло прийти до того как мы подписались
  const existingUrl = localStorage.getItem('backend-url');
  if (existingUrl) {
    logger.debug(`[Tauri] Using cached backend URL: ${existingUrl}`);
    // return existingUrl; // НЕ ВОЗВРАЩАЕМ КЭШ СРАЗУ, лучше проверить порт через команду, 
    // потому что при перезапуске порт может измениться, а кэш останется старым.
  }

  // В Tauri ждём события от sidecar
  const { listen } = await import('@tauri-apps/api/event');
  const { invoke } = await import('@tauri-apps/api/core');

  return new Promise<string>((resolve, reject) => {
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Backend startup timeout'));
      }
    }, timeoutMs);

    // Сначала проверяем, не запущен ли уже бэкенд (самый надежный способ)
    invoke<number | null>('get_backend_port')
      .then((port) => {
        if (port && !resolved) {
          const url = `http://localhost:${port}`;
          logger.info('[Tauri] Backend already running on port (from command):', port);
          resolved = true;
          clearTimeout(timeout);
          localStorage.setItem('backend-url', url);
          resolve(url);
        }
      })
      .catch((e) => logger.warn('[Tauri] Failed to check backend port via command:', e));

    // Подписываемся на событие готовности (fallback)
    listen<number>('backend-ready', (event) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      const port = event.payload;
      const url = `http://localhost:${port}`;
      logger.info(`[Tauri] Backend ready at ${url} (from event)`);
      localStorage.setItem('backend-url', url);
      resolve(url);
    });

    // Подписываемся на ошибку
    listen<string>('backend-error', (event) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      reject(new Error(`Backend error: ${event.payload}`));
    });

    // Подписываемся на завершение
    listen('backend-terminated', () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      reject(new Error('Backend terminated unexpectedly'));
    });
  });
};

/**
 * Получает текущий backend URL.
 * 
 * В Tauri: URL из локального хранилища (установленный после backend-ready)
 * В браузере: URL из переменных окружения
 */
export const getBackendUrl = (): string | null => {
  if (isTauri()) {
    return localStorage.getItem('backend-url');
  }
  return import.meta.env.VITE_API_URL || null;
};

/**
 * Устанавливает backend URL (для Tauri).
 */
export const setBackendUrl = (url: string): void => {
  localStorage.setItem('backend-url', url);
};
