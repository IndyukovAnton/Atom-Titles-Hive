import { useCallback } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import type { GroupStats } from '../api/groups';

export function useDragAndDrop(
  groupStats: GroupStats | null,
  setGroupStats: (stats: GroupStats | null) => void // Updated to accept null
) {
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !groupStats) return;

    const items = Array.from(groupStats.groups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setGroupStats({ ...groupStats, groups: items });
  }, [groupStats, setGroupStats]);

  return { onDragEnd };
}
