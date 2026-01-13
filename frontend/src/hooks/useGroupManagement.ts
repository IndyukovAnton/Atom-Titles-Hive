import { useState, useCallback, useEffect } from 'react';
import { groupsApi } from '../api/groups';
import type { GroupStats } from '../api/groups';

export function useGroupManagement(selectedGroupId: number | null | 'all', setSelectedGroupId: (id: number | null | 'all') => void) {
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{id: number, name: string} | null>(null);

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
    if (!window.confirm('Вы уверены, что хотите удалить эту группу?')) return;
    try {
      await groupsApi.delete(id);
      if (selectedGroupId === id) setSelectedGroupId('all');
      await loadGroups();
    } catch (e) {
      alert('Ошибка при удалении группы');
    }
  }, [selectedGroupId, setSelectedGroupId, loadGroups]);

  const openCreateGroupModal = useCallback(() => {
    setEditingGroup(null);
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
    closeGroupModal
  };
}
