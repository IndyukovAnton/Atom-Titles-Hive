import { renderHook, act } from '@testing-library/react';
import { useFilters } from './useFilters';

describe('useFilters', () => {
  it('должен инициализироваться с пустыми фильтрами', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.isFilterPanelOpen).toBe(false);
  });

  it('должен добавить фильтр', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('category', 'Movie');
    });

    expect(result.current.filters.category).toBe('Movie');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('должен обновить существующий фильтр', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('minRating', 5);
    });

    expect(result.current.filters.minRating).toBe(5);

    act(() => {
      result.current.updateFilter('minRating', 7);
    });

    expect(result.current.filters.minRating).toBe(7);
  });

  it('должен удалить фильтр', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('category', 'Movie');
      result.current.updateFilter('minRating', 5);
    });

    expect(Object.keys(result.current.filters)).toHaveLength(2);

    act(() => {
      result.current.removeFilter('category');
    });

    expect(result.current.filters.category).toBeUndefined();
    expect(result.current.filters.minRating).toBe(5);
    expect(Object.keys(result.current.filters)).toHaveLength(1);
  });

  it('должен очистить все фильтры', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('category', 'Movie');
      result.current.updateFilter('minRating', 5);
      result.current.updateFilter('genres', ['Action', 'Drama']);
    });

    expect(Object.keys(result.current.filters)).toHaveLength(3);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('должен переключать панель фильтров', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.isFilterPanelOpen).toBe(false);

    act(() => {
      result.current.toggleFilterPanel();
    });

    expect(result.current.isFilterPanelOpen).toBe(true);

    act(() => {
      result.current.toggleFilterPanel();
    });

    expect(result.current.isFilterPanelOpen).toBe(false);
  });

  it('должен устанавливать состояние панели фильтров', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setIsFilterPanelOpen(true);
    });

    expect(result.current.isFilterPanelOpen).toBe(true);

    act(() => {
      result.current.setIsFilterPanelOpen(false);
    });

    expect(result.current.isFilterPanelOpen).toBe(false);
  });

  it('должен корректно обрабатывать массивы в фильтрах', () => {
    const { result } = renderHook(() => useFilters());

    const genres = ['Action', 'Drama', 'Comedy'];

    act(() => {
      result.current.updateFilter('genres', genres);
    });

    expect(result.current.filters.genres).toEqual(genres);
  });

  it('должен корректно обрабатывать даты в фильтрах', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.updateFilter('startDate', '2024-01-01');
      result.current.updateFilter('endDate', '2024-12-31');
    });

    expect(result.current.filters.startDate).toBe('2024-01-01');
    expect(result.current.filters.endDate).toBe('2024-12-31');
  });
});
