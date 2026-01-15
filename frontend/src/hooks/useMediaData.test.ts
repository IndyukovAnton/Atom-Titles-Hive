import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

    expect(result.current.mediaList).toEqual([mockMediaEntry]);
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

    const initialMediaList = result.current.mediaList;

    await waitFor(async () => {
      await result.current.loadMedia();
    });

    expect(result.current.mediaList).toEqual(initialMediaList);
  });

  it('should update mediaList when setMediaList is called', async () => {
    const { result } = renderHook(() => useMediaData('all'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newMediaList = [
      { ...mockMediaEntry, id: 999, title: 'New Media' },
    ];

    result.current.setMediaList(newMediaList);

    expect(result.current.mediaList).toEqual(newMediaList);
  });

  it('should reload when selectedGroupId changes', async () => {
    const { result, rerender } = renderHook(
      ({ groupId }: { groupId: number | 'all' | null }) => useMediaData(groupId),
      { initialProps: { groupId: 'all' } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ groupId: 1 });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
