import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { groupsApi } from '../api/groups';
import type { GroupStats } from '../api/groups';
import { logger } from '../utils/logger';

export const GROUPS_STATS_QUERY_KEY = ['groups', 'stats'] as const;

export function useGroupManagement(
  selectedGroupId: number | null | 'all',
  setSelectedGroupId: (id: number | null | 'all') => void,
) {
  const queryClient = useQueryClient();

  const query = useQuery<GroupStats>({
    queryKey: GROUPS_STATS_QUERY_KEY,
    queryFn: () => groupsApi.getStats(),
    // Tree rarely changes and is cheap. 5-min staleTime + invalidate-on-mutation
    // keeps it snappy while staying fresh.
    staleTime: 5 * 60 * 1000,
  });

  const groupStats = query.data ?? null;
  const isLoading = query.isLoading;

  // Kept for backwards compatibility with existing callers and tests that
  // do optimistic updates. Writes directly into the query cache so every
  // subscriber sees the new value immediately.
  const setGroupStats = useCallback(
    (stats: GroupStats | null) => {
      queryClient.setQueryData(GROUPS_STATS_QUERY_KEY, stats ?? undefined);
    },
    [queryClient],
  );

  const loadGroups = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['groups'] });
  }, [queryClient]);

  // Modal state (not cache-backed)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [targetParentId, setTargetParentId] = useState<number | undefined>(
    undefined,
  );
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  const deleteGroup = useCallback(
    async (id: number) => {
      try {
        await groupsApi.delete(id);
        if (selectedGroupId === id) setSelectedGroupId('all');
        await queryClient.invalidateQueries({ queryKey: ['groups'] });
        await queryClient.invalidateQueries({ queryKey: ['media'] });
        toast.success('Группа удалена');
      } catch (error) {
        logger.error('Failed to delete group', error);
        toast.error('Ошибка при удалении группы');
      }
    },
    [selectedGroupId, setSelectedGroupId, queryClient],
  );

  const confirmDelete = useCallback((id: number) => {
    setGroupToDelete(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const moveGroup = useCallback(
    async (id: number, parentId: number | null) => {
      try {
        const group = groupStats?.groups.find((g) => g.id === id);
        if (group) {
          await groupsApi.update(id, {
            name: group.name,
            parentId: parentId ?? undefined,
          });
          await queryClient.invalidateQueries({ queryKey: ['groups'] });
          toast.success('Группа перемещена');
        }
      } catch (error) {
        logger.error('Failed to move group', error);
        toast.error('Ошибка при перемещении группы');
      }
    },
    [groupStats, queryClient],
  );

  const openCreateGroupModal = useCallback((parentId?: number) => {
    setEditingGroup(null);
    setTargetParentId(parentId);
    setIsGroupModalOpen(true);
  }, []);

  const openEditGroupModal = useCallback(
    (id: number) => {
      const group = groupStats?.groups.find((g) => g.id === id);
      if (group) {
        setEditingGroup({ id: group.id, name: group.name });
        setIsGroupModalOpen(true);
      }
    },
    [groupStats],
  );

  const closeGroupModal = useCallback(() => {
    setIsGroupModalOpen(false);
    setEditingGroup(null);
  }, []);

  return {
    groupStats,
    isLoading,
    setGroupStats,
    loadGroups,
    deleteGroup,
    isGroupModalOpen,
    editingGroup,
    openCreateGroupModal,
    openEditGroupModal,
    closeGroupModal,
    targetParentId,
    moveGroup,
    confirmDelete,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    groupToDelete,
  };
}
