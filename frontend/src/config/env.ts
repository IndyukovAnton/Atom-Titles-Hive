import { logger } from '../utils/logger';

export interface EnvConfig {
  readonly apiTimeout: number;
  readonly appName: string;
  /** API URL — может быть динамическим в Tauri */
  getApiUrl(): string;
  setApiUrl(url: string): void;
}

const BACKEND_URL_KEY = 'backend-url';

/** Runtime хранилище для API URL (обновляется мгновенно, в отличие от localStorage) */
let runtimeApiUrl: string | null = null;

const getEnvVar = (key: string, required: boolean = true): string => {
  const value = import.meta.env[key];
  if (required && (value === undefined || value === '')) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value as string;
};

/**
 * Проверяет, запущено ли приложение в Tauri
 */
const isTauri = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (('__TAURI_INTERNALS__' in window) || ('__TAURI__' in window))
  );
};

/**
 * Получает API URL.
 * Приоритет: runtime переменная > localStorage > VITE_API_URL > fallback
 */
const getApiUrl = (): string => {
  // 1. Runtime переменная (устанавливается через setApiUrl)
  if (runtimeApiUrl) {
    return runtimeApiUrl;
  }
  
  // 2. localStorage (для перезагрузки страницы в Tauri)
  if (isTauri()) {
    const storedUrl = localStorage.getItem(BACKEND_URL_KEY);
    if (storedUrl) {
      runtimeApiUrl = storedUrl; // Кэшируем в runtime
      return storedUrl;
    }
  }
  
  // 3. Переменная окружения (для браузера)
  const envUrl = getEnvVar('VITE_API_URL', false);
  if (envUrl) {
    return envUrl;
  }
  
  // 4. Fallback (не должен использоваться в production)
  logger.warn('[Config] No API URL configured, using fallback http://localhost:3553');
  return 'http://localhost:3553';
};

/**
 * Устанавливает API URL (для Tauri sidecar).
 * Сохраняет и в runtime переменную, и в localStorage.
 */
const setApiUrl = (url: string): void => {
  runtimeApiUrl = url;
  localStorage.setItem(BACKEND_URL_KEY, url);
};

export const config: EnvConfig = {
  apiTimeout: Number(getEnvVar('VITE_API_TIMEOUT', false)) || 30000,
  appName: getEnvVar('VITE_APP_NAME', false) || 'Seen',
  getApiUrl,
  setApiUrl,
};

/**
 * Сбрасывает кэш API URL (вызывается при новом запуске Tauri).
 */
export const clearApiUrl = (): void => {
  runtimeApiUrl = null;
  localStorage.removeItem(BACKEND_URL_KEY);
};

/** Для обратной совместимости - реэкспорт из config */
export { getApiUrl };
