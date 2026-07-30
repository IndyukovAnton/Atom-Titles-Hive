import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/app-toast';
import { groupsApi } from '../api/groups';
import { logger } from '../utils/logger';
export const GROUPS_STATS_QUERY_KEY = ['groups', 'stats'];
export function useGroupManagement(selectedGroupId, setSelectedGroupId) {
    const queryClient = useQueryClient();
    const query = useQuery({
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
    const setGroupStats = useCallback((stats) => {
        queryClient.setQueryData(GROUPS_STATS_QUERY_KEY, stats ?? undefined);
    }, [queryClient]);
    const loadGroups = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['groups'] });
    }, [queryClient]);
    // Modal state (not cache-backed)
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [targetParentId, setTargetParentId] = useState(undefined);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const deleteGroup = useCallback(async (id) => {
        try {
            await groupsApi.delete(id);
            if (selectedGroupId === id)
                setSelectedGroupId('all');
            await queryClient.invalidateQueries({ queryKey: ['groups'] });
            await queryClient.invalidateQueries({ queryKey: ['media'] });
            toast.success('Группа удалена');
        }
        catch (error) {
            logger.error('Failed to delete group', error);
            toast.error('Ошибка при удалении группы');
        }
    }, [selectedGroupId, setSelectedGroupId, queryClient]);
    const confirmDelete = useCallback((id) => {
        setGroupToDelete(id);
        setIsDeleteConfirmOpen(true);
    }, []);
    const moveGroup = useCallback(async (id, data) => {
        try {
            await groupsApi.move(id, data);
            await queryClient.invalidateQueries({ queryKey: ['groups'] });
            toast.success('Группа перемещена');
        }
        catch (error) {
            logger.error('Failed to move group', error);
            toast.error('Ошибка при перемещении группы');
        }
    }, [queryClient]);
    const openCreateGroupModal = useCallback((parentId) => {
        setEditingGroup(null);
        setTargetParentId(parentId);
        setIsGroupModalOpen(true);
    }, []);
    const openEditGroupModal = useCallback((id) => {
        const group = groupStats?.groups.find((g) => g.id === id);
        if (group) {
            setEditingGroup({
                id: group.id,
                name: group.name,
                parentId: group.parentId ?? null,
            });
            setTargetParentId(undefined);
            setIsGroupModalOpen(true);
        }
    }, [groupStats]);
    const closeGroupModal = useCallback(() => {
        setIsGroupModalOpen(false);
        setEditingGroup(null);
        setTargetParentId(undefined);
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
