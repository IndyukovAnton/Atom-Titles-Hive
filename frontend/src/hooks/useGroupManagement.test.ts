import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGroupManagement } from './useGroupManagement';
import { mockGroup } from '../test/mocks/api';

describe('useGroupManagement', () => {
  let setSelectedGroupId: Mock<(id: number | null | 'all') => void>;

  beforeEach(() => {
    setSelectedGroupId = vi.fn();
  });

  it('should load group stats on mount', async () => {
    const { result } = renderHook(() =>
      useGroupManagement('all', setSelectedGroupId)
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groupStats).toBeDefined();
  });

  it('should handle modal state for creating group', () => {
    const { result } = renderHook(() =>
      useGroupManagement('all', setSelectedGroupId)
    );

    expect(result.current.isGroupModalOpen).toBe(false);
    expect(result.current.editingGroup).toBeNull();

    act(() => {
      result.current.openCreateGroupModal();
    });

    expect(result.current.isGroupModalOpen).toBe(true);
    expect(result.current.editingGroup).toBeNull();
  });

  it('should handle modal state for editing group', async () => {
    const { result } = renderHook(() =>
      useGroupManagement('all', setSelectedGroupId)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock group stats with a group
    act(() => {
      result.current.setGroupStats({
        groups: [{ ...mockGroup, count: 0 }],
        ungrouped: 0,
      });
    });

    act(() => {
      result.current.openEditGroupModal(1);
    });

    expect(result.current.isGroupModalOpen).toBe(true);
    expect(result.current.editingGroup).toEqual({
      id: mockGroup.id,
      name: mockGroup.name,
    });
  });

  it('should close modal and clear editing group', async () => {
    const { result } = renderHook(() =>
      useGroupManagement('all', setSelectedGroupId)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.openCreateGroupModal();
    });

    expect(result.current.isGroupModalOpen).toBe(true);

    act(() => {
      result.current.closeGroupModal();
    });

    expect(result.current.isGroupModalOpen).toBe(false);
    expect(result.current.editingGroup).toBeNull();
  });

  it('should delete group and update selected group if needed', async () => {
    const { result } = renderHook(() =>
      useGroupManagement(1, setSelectedGroupId)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteGroup(1);
    });

    expect(setSelectedGroupId).toHaveBeenCalledWith('all');
  });

  it('should not delete group if user cancels confirmation', async () => {
    const { result } = renderHook(() =>
      useGroupManagement(1, setSelectedGroupId)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.confirmDelete(1);
    });

    expect(result.current.isDeleteConfirmOpen).toBe(true);
    expect(result.current.groupToDelete).toBe(1);

    // Simulate user cancelling the confirmation dialog
    act(() => {
      result.current.setIsDeleteConfirmOpen(false);
    });

    expect(setSelectedGroupId).not.toHaveBeenCalled();
  });

  it('should reload groups when loadGroups is called', async () => {
    const { result } = renderHook(() =>
      useGroupManagement('all', setSelectedGroupId)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loadGroups();
    });

    expect(result.current.groupStats).toBeDefined();
  });

  it('should not open edit modal if group not found', async () => {
    const { result } = renderHook(() =>
      useGroupManagement('all', setSelectedGroupId)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setGroupStats({
        groups: [],
        ungrouped: 0,
      });
    });

    act(() => {
      result.current.openEditGroupModal(999);
    });

    expect(result.current.isGroupModalOpen).toBe(false);
    expect(result.current.editingGroup).toBeNull();
  });
});
