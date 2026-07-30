import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(() => 'success-id'),
    info: vi.fn(() => 'info-id'),
    warning: vi.fn(() => 'warning-id'),
    error: vi.fn(() => 'error-id'),
    message: vi.fn(() => 'message-id'),
    loading: vi.fn(() => 'loading-id'),
    promise: vi.fn(() => 'promise-id'),
    dismiss: vi.fn(),
  },
}));

import { toast as sonnerToast } from 'sonner';
import { toast } from './app-toast';

const writeTextMock = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
  });
});

describe('app-toast: уровни без копирования', () => {
  it('success проксируется без кнопки копирования', () => {
    toast.success('Готово');

    expect(sonnerToast.success).toHaveBeenCalledWith('Готово');
  });

  it('info проксируется без кнопки копирования', () => {
    toast.info('Инфо', { duration: 5000 });

    expect(sonnerToast.info).toHaveBeenCalledWith('Инфо', { duration: 5000 });
  });
});

describe('app-toast: warning/error с копированием', () => {
  it('error добавляет кнопку «Копировать» в слот action', () => {
    toast.error('Что-то сломалось');

    expect(sonnerToast.error).toHaveBeenCalledWith(
      'Что-то сломалось',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Копировать' }),
      }),
    );
  });

  it('warning добавляет кнопку «Копировать» в слот action', () => {
    toast.warning('Внимание');

    expect(sonnerToast.warning).toHaveBeenCalledWith(
      'Внимание',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Копировать' }),
      }),
    );
  });

  it('клик по кнопке копирует заголовок и описание через перенос строки', async () => {
    toast.error('Заголовок ошибки', { description: 'stack trace line' });

    const options = vi.mocked(sonnerToast.error).mock.calls[0][1];
    options?.action?.onClick({} as never);

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('Заголовок ошибки\nstack trace line');
      expect(sonnerToast.success).toHaveBeenCalledWith('Скопировано в буфер обмена', {
        duration: 1500,
      });
    });
  });

  it('не перетирает action вызывающего кода — копирование уходит в cancel', () => {
    const ownAction = { label: 'Открыть', onClick: vi.fn() };

    toast.error('Сбой обновления', { action: ownAction });

    expect(sonnerToast.error).toHaveBeenCalledWith('Сбой обновления', {
      action: ownAction,
      cancel: expect.objectContaining({ label: 'Копировать' }),
    });
  });

  it('оба слота кнопок заняты — опции остаются нетронутыми', () => {
    const ownAction = { label: 'A', onClick: vi.fn() };
    const ownCancel = { label: 'B', onClick: vi.fn() };

    toast.error('Ошибка', { action: ownAction, cancel: ownCancel });

    expect(sonnerToast.error).toHaveBeenCalledWith('Ошибка', {
      action: ownAction,
      cancel: ownCancel,
    });
  });

  it('не-строковое описание не попадает в буфер — копируется только заголовок', async () => {
    toast.error('Только заголовок', { description: { toString: () => 'node' } as never });

    const options = vi.mocked(sonnerToast.error).mock.calls[0][1];
    options?.action?.onClick({} as never);

    await vi.waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('Только заголовок');
    });
  });
});
