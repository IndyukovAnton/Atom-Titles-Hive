/**
 * Единая точка показа toast-уведомлений приложения.
 *
 * Обёртка над sonner, которая закрепляет разделение уведомлений на уровни
 * SUCCESS / INFO / WARNING / ERROR и автоматически добавляет кнопку
 * «Копировать» к WARNING и ERROR: текст ошибки (заголовок + описание)
 * уходит в буфер обмена — типичный сценарий для отчётов о сбоях.
 *
 * Прямой импорт `toast` из 'sonner' в коде приложения не используем,
 * чтобы уровни и поведение не разъезжались (исключение — <Toaster/> в App).
 */

import { toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';
import type { ReactNode } from 'react';

const COPY_LABEL = 'Копировать';

type ToastFn = (message: ReactNode, options?: ExternalToast) => string | number;

/** Собирает копируемый текст из строковых частей тоста; ReactNode-описание скопировать нельзя. */
function buildCopyText(message: ReactNode, description: unknown): string | null {
  const parts = [message, description].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );
  return parts.length > 0 ? parts.join('\n') : null;
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback для не-secure контекста/старых webview без async Clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}

async function handleCopy(text: string): Promise<void> {
  const copied = await writeToClipboard(text);
  if (copied) {
    sonnerToast.success('Скопировано в буфер обмена', { duration: 1500 });
  } else {
    sonnerToast.error('Не удалось скопировать текст', { duration: 2000 });
  }
}

/**
 * Добавляет кнопку копирования текста тоста. У sonner два слота кнопок
 * (action и cancel): занимаем первый свободный, чтобы не перетирать
 * собственные кнопки вызывающего кода; если оба заняты — не вмешиваемся.
 */
function withCopyAction(fn: ToastFn): ToastFn {
  return (message, options = {}) => {
    const copyText = buildCopyText(message, options.description);
    if (!copyText) return fn(message, options);

    const copyButton = {
      label: COPY_LABEL,
      onClick: () => {
        void handleCopy(copyText);
      },
    };

    const merged: ExternalToast = { ...options };
    if (!merged.action) {
      merged.action = copyButton;
    } else if (!merged.cancel) {
      merged.cancel = copyButton;
    }

    return fn(message, merged);
  };
}

export const toast = {
  success: sonnerToast.success,
  info: sonnerToast.info,
  warning: withCopyAction(sonnerToast.warning),
  error: withCopyAction(sonnerToast.error),
  message: sonnerToast.message,
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
