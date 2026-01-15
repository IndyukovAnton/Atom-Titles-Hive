import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from './useDragAndDrop';
import type { DropResult } from '@hello-pangea/dnd';
import { mockGroup } from '../test/mocks/api';

describe('useDragAndDrop', () => {
  const mockGroupStats = {
    groups: [
      { ...mockGroup, id: 1, name: 'Group 1', count: 0 },
      { ...mockGroup, id: 2, name: 'Group 2', count: 0 },
      { ...mockGroup, id: 3, name: 'Group 3', count: 0 },
    ],
    ungrouped: 0,
  };

  it('should reorder groups on drag end', () => {
    const setGroupStats = vi.fn();
    const { result } = renderHook(() =>
      useDragAndDrop(mockGroupStats, setGroupStats)
    );

    const dropResult: DropResult = {
      draggableId: '1',
      type: 'group',
      source: { index: 0, droppableId: 'groups' },
      destination: { index: 2, droppableId: 'groups' },
      reason: 'DROP',
      mode: 'FLUID',
      combine: null,
    };

    act(() => {
      result.current.onDragEnd(dropResult);
    });

    expect(setGroupStats).toHaveBeenCalledWith({
      ...mockGroupStats,
      groups: [
        { ...mockGroup, id: 2, name: 'Group 2', count: 0 },
        { ...mockGroup, id: 3, name: 'Group 3', count: 0 },
        { ...mockGroup, id: 1, name: 'Group 1', count: 0 },
      ],
    });
  });

  it('should not reorder if no destination', () => {
    const setGroupStats = vi.fn();
    const { result } = renderHook(() =>
      useDragAndDrop(mockGroupStats, setGroupStats)
    );

    const dropResult: DropResult = {
      draggableId: '1',
      type: 'group',
      source: { index: 0, droppableId: 'groups' },
      destination: null,
      reason: 'CANCEL',
      mode: 'FLUID',
      combine: null,
    };

    act(() => {
      result.current.onDragEnd(dropResult);
    });

    expect(setGroupStats).not.toHaveBeenCalled();
  });

  it('should not reorder if groupStats is null', () => {
    const setGroupStats = vi.fn();
    const { result } = renderHook(() =>
      useDragAndDrop(null, setGroupStats)
    );

    const dropResult: DropResult = {
      draggableId: '1',
      type: 'group',
      source: { index: 0, droppableId: 'groups' },
      destination: { index: 2, droppableId: 'groups' },
      reason: 'DROP',
      mode: 'FLUID',
      combine: null,
    };

    act(() => {
      result.current.onDragEnd(dropResult);
    });

    expect(setGroupStats).not.toHaveBeenCalled();
  });

  it('should handle drag to same position', () => {
    const setGroupStats = vi.fn();
    const { result } = renderHook(() =>
      useDragAndDrop(mockGroupStats, setGroupStats)
    );

    const dropResult: DropResult = {
      draggableId: '1',
      type: 'group',
      source: { index: 1, droppableId: 'groups' },
      destination: { index: 1, droppableId: 'groups' },
      reason: 'DROP',
      mode: 'FLUID',
      combine: null,
    };

    act(() => {
      result.current.onDragEnd(dropResult);
    });

    // Should still call setGroupStats even if position is same
    expect(setGroupStats).toHaveBeenCalled();
  });

  it('should move item from end to beginning', () => {
    const setGroupStats = vi.fn();
    const { result } = renderHook(() =>
      useDragAndDrop(mockGroupStats, setGroupStats)
    );

    const dropResult: DropResult = {
      draggableId: '3',
      type: 'group',
      source: { index: 2, droppableId: 'groups' },
      destination: { index: 0, droppableId: 'groups' },
      reason: 'DROP',
      mode: 'FLUID',
      combine: null,
    };

    act(() => {
      result.current.onDragEnd(dropResult);
    });

    expect(setGroupStats).toHaveBeenCalledWith({
      ...mockGroupStats,
      groups: [
        { ...mockGroup, id: 3, name: 'Group 3', count: 0 },
        { ...mockGroup, id: 1, name: 'Group 1', count: 0 },
        { ...mockGroup, id: 2, name: 'Group 2', count: 0 },
      ],
    });
  });
});
