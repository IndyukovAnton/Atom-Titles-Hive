import { useState, useCallback, useEffect } from 'react';
import { groupsApi } from '../api/groups';
import type { GroupStats } from '../api/groups';
import { toast } from 'sonner';


export function useGroupManagement(selectedGroupId: number | null | 'all', setSelectedGroupId: (id: number | null | 'all') => void) {
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{id: number, name: string} | null>(null);
  const [targetParentId, setTargetParentId] = useState<number | undefined>(undefined);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      const data = await groupsApi.getStats();
      setGroupStats(data);
    } catch (error) {
      console.error('Failed to load groups', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);




  const deleteGroup = useCallback(async (id: number) => {
    try {
      await groupsApi.delete(id);
      if (selectedGroupId === id) setSelectedGroupId('all');
      await loadGroups();
      toast.success('Группа удалена');
    } catch {
      toast.error('Ошибка при удалении группы');
    }
  }, [selectedGroupId, setSelectedGroupId, loadGroups]);

  const confirmDelete = useCallback((id: number) => {
    setGroupToDelete(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const moveGroup = useCallback(async (id: number, parentId: number | null) => {
    try {
      const group = groupStats?.groups.find(g => g.id === id);
      if (group) {
        await groupsApi.update(id, { name: group.name, parentId: parentId ?? undefined });
        await loadGroups();
        toast.success('Группа перемещена');
      }
    } catch {
      toast.error('Ошибка при перемещении группы');
    }
  }, [groupStats, loadGroups]);

  const openCreateGroupModal = useCallback((parentId?: number) => {
    setEditingGroup(null);
    setTargetParentId(parentId);
    setIsGroupModalOpen(true);
  }, []);

  const openEditGroupModal = useCallback((id: number) => {
    const group = groupStats?.groups.find(g => g.id === id);
    if (group) {
        setEditingGroup({ id: group.id, name: group.name });
        setIsGroupModalOpen(true);
    }
  }, [groupStats]);

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
    groupToDelete
  };
}
