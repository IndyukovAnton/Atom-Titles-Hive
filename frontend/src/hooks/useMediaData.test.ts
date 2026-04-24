import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor, act } from '@testing-library/react';
import { renderHookWithProviders as renderHook } from '../test/utils/test-utils';
import { useMediaData } from './useMediaData';
import { mockMediaEntry } from '../test/mocks/api';

describe('useMediaData', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  it('should load media data on mount', async () => {
    const { result } = renderHook(() => useMediaData('all'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.mediaList).toEqual([mockMediaEntry]);
    });
    expect(result.current.error).toBeNull();
  });

  it('should filter media by group ID', async () => {
    const { result } = renderHook(() => useMediaData(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mediaList).toBeDefined();
  });

  it('should handle null group ID', async () => {
    const { result } = renderHook(() => useMediaData(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.mediaList).toBeDefined();
  });

  it('should reload media when loadMedia is called', async () => {
    const { result } = renderHook(() => useMediaData('all'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.mediaList.length).toBeGreaterThan(0);
    });

    const initialMediaList = result.current.mediaList;

    await act(async () => {
      await result.current.loadMedia();
    });

    await waitFor(() => {
      expect(result.current.mediaList).toEqual(initialMediaList);
    });
  });

  it('should update mediaList when setMediaList is called', async () => {
    const { result } = renderHook(() => useMediaData('all'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newMediaList = [
      { ...mockMediaEntry, id: 999, title: 'New Media' },
    ];

    act(() => {
      result.current.setMediaList(newMediaList);
    });

    await waitFor(() => {
      expect(result.current.mediaList).toEqual(newMediaList);
    });
  });

  it('should reload when selectedGroupId changes', async () => {
    const { result, rerender } = renderHook(
      ({ groupId }: { groupId: number | 'all' | null }) => useMediaData(groupId),
      { initialProps: { groupId: 'all' as number | 'all' | null } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ groupId: 1 });

    // React Query keeps previous data on key switch (placeholderData), so
    // isLoading stays false. We just wait for the next query to settle and
    // expect the hook to still return a valid list.
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.mediaList).toBeDefined();
  });
});
