import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('должен вернуть начальное значение сразу', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('должен обновить значение после задержки', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    expect(result.current).toBe('initial');

    // Обновляем значение
    rerender({ value: 'updated', delay: 300 });

    // Значение не должно измениться сразу
    expect(result.current).toBe('initial');

    // Перематываем время на 300мс
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('должен отменить предыдущий таймер при новом обновлении', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });
    vi.advanceTimersByTime(150);

    rerender({ value: 'second' });
    vi.advanceTimersByTime(150);

    // Значение все еще начальное
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(150);

    await waitFor(() => {
      expect(result.current).toBe('second');
    });
  });

  it('должен использовать кастомную задержку', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    vi.advanceTimersByTime(300);
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });
});
