import { renderHook, act } from '@testing-library/react';
import { useSearch } from './useSearch';
import { mediaApi } from '../api/media';
import type { MediaEntry } from '../api/media';

vi.mock('../api/media');

describe('useSearch', () => {
  const mockMediaList: MediaEntry[] = [
    {
      id: 1,
      title: 'Test Movie',
      rating: 8,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: 2,
      title: 'Another Movie',
      rating: 7,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(mediaApi.search).mockResolvedValue(mockMediaList);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('должен инициализироваться с пустым состоянием', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.searchQuery).toBe('');
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('должен обновить поисковый запрос', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('test');
    });

    expect(result.current.searchQuery).toBe('test');
  });

  it('должен выполнить поиск после debounce', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('movie');
    });

    // Перематываем время для debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mediaApi.search).toHaveBeenCalledWith('movie');
    expect(result.current.suggestions).toEqual(mockMediaList.slice(0, 5));
  });

  it('не должен выполнять поиск для пустого запроса', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mediaApi.search).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('должен ограничивать количество подсказок до 5', async () => {
    const manyResults = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      title: `Movie ${i}`,
      rating: 5,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }));

    vi.mocked(mediaApi.search).mockResolvedValue(manyResults);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('movie');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.suggestions).toHaveLength(5);
  });

  it('должен очистить поиск', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('test');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.suggestions.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.suggestions).toEqual([]);
  });

  it('должен обработать ошибку поиска', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(mediaApi.search).mockRejectedValue(new Error('Search failed'));

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setSearchQuery('error');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isSearching).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
