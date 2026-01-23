import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Server, XCircle } from 'lucide-react';
import { isTauri, waitForBackend, setBackendUrl } from '../../utils/tauri';
import { clearApiUrl } from '../../config';

type BackendStatus = 'loading' | 'ready' | 'error';

interface BackendLoaderProps {
  children: React.ReactNode;
  /** Callback при успешном запуске backend */
  onReady?: (url: string) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
}

/**
 * Компонент-обёртка для ожидания запуска backend sidecar.
 * 
 * В Tauri режиме показывает loading UI пока backend не запустится.
 * В браузере сразу показывает children.
 */
export function BackendLoader({ children, onReady, onError }: BackendLoaderProps) {
  const [status, setStatus] = useState<BackendStatus>(() => 
    isTauri() ? 'loading' : 'ready'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isTauri()) {
      // В браузере сразу готовы
      onReady?.(import.meta.env.VITE_API_URL || '');
      return;
    }

    // Проверяем, это новый запуск Tauri или перезагрузка страницы внутри сессии
    const sessionMarker = sessionStorage.getItem('tauri-session-started');
    
    if (!sessionMarker) {
      // Новый запуск Tauri — очищаем кэш от предыдущего запуска
      // (порт генерируется заново каждый раз)
      clearApiUrl();
      sessionStorage.setItem('tauri-session-started', 'true');
    }

    // В Tauri ждём backend
    waitForBackend(60000) // 60 секунд timeout
      .then((url) => {
        setBackendUrl(url);
        setStatus('ready');
        onReady?.(url);
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error.message);
        onError?.(error);
      });
  }, [onReady, onError]);

  // В браузере или после готовности — показываем children
  if (!isTauri() || status === 'ready') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            {/* Animated icon */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary"
              />
              <Server className="absolute inset-0 m-auto w-8 h-8 text-primary" />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Запуск сервера...
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Подождите, локальный сервер инициализируется
              </p>
            </div>

            {/* Loading indicator */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Инициализация...</span>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            {/* Error icon */}
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Ошибка запуска сервера
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {errorMessage || 'Не удалось запустить локальный сервер'}
              </p>
            </div>

            {/* Retry button */}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Попробовать снова
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
