import { useMemo } from 'react';
import { Plus, Layers, FolderOpen, Edit, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Group, GroupStats } from '../../api/groups';
import { type ItemInstance, syncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { Tree, TreeItem, TreeItemLabel } from '@/components/ui/tree';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useDroppable } from '@dnd-kit/core';

interface SidebarProps {
  groupStats: GroupStats | null;
  selectedGroupId: number | null | 'all';
  onSelectGroup: (id: number | null | 'all') => void;
  onCreateGroup: (parentId?: number) => void;
  onEditGroup: (id: number) => void;
  onDeleteGroup: (id: number) => void;
  onDragEnd?: (result: unknown) => void;
}
// ...
// ... (SidebarTreeItem component remains same, but let's check if I need to update it? No I will use original context or simple replacement)

const SidebarTreeItem = ({ 
    item, 
    selectedGroupId, 
    onSelectGroup, 
    onCreateGroup, 
    onEditGroup, 
    onDeleteGroup 
}: {
    item: ItemInstance<Group>;
    selectedGroupId: number | null | 'all';
    onSelectGroup: (id: number | null | 'all') => void;
    onCreateGroup: (parentId?: number) => void;
    onEditGroup: (id: number) => void;
    onDeleteGroup: (id: number) => void;
}) => {
    // ... same content
    const { setNodeRef, isOver } = useDroppable({
        id: `group-${(item.getDataRef().current as Group).id}`,
        data: item.getItemData(),
    });

    const data = item.getItemData();
    const isSelected = selectedGroupId === data.id;

    return (
        <div ref={setNodeRef} className={cn("rounded-md transition-colors", isOver && "bg-primary/20 ring-2 ring-primary/50")}>
            <TreeItem 
                item={item}
                className="w-full"
            >
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                    <div 
                        className={cn(
                        "flex items-center w-full p-2 rounded-md hover:bg-accent/50 cursor-pointer text-sm font-medium transition-colors",
                        isSelected ? "bg-secondary/50 text-secondary-foreground" : "text-muted-foreground",
                        isOver && "bg-transparent" // Priority to outer bg
                        )}
                        onClick={() => onSelectGroup(data.id)}
                    >
                        <TreeItemLabel 
                        item={item} 
                        className="flex-1 bg-transparent hover:bg-transparent p-0 data-[selected=true]:bg-transparent data-[selected=true]:text-current"
                        >
                            <span className="truncate">
                            {item.getItemName()}
                            </span>
                        </TreeItemLabel>
                        {(data.count || 0) > 0 && (
                            <span className="text-xs ml-2 bg-background/50 px-2 py-0.5 rounded-full opacity-70">
                            {data.count}
                            </span>
                        )}
                    </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                    <ContextMenuItem onClick={() => onCreateGroup(data.id)}>
                        <Plus className="mr-2 h-4 w-4" /> Создать подпапку
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onEditGroup(data.id)}>
                        <Edit className="mr-2 h-4 w-4" /> Редактировать
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDeleteGroup(data.id)} className="text-destructive focus:text-destructive">
                        <Trash className="mr-2 h-4 w-4" /> Удалить
                    </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            </TreeItem>
        </div>
    );
};

export const Sidebar = ({
  groupStats,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
}: SidebarProps) => {

  const items = useMemo(() => (groupStats?.groups || []).map(g => ({ ...g, id: g.id, name: g.name, parentId: g.parentId })) as unknown as Group[], [groupStats]);

  const tree = useTree<Group>({
    features: [syncDataLoaderFeature],
    rootItemId: 'root',
    getItemName: (item: Group) => item.name,
    dataLoader: {
      getItem: (itemId: string) => {
         if (itemId === 'root') return { id: 0, name: 'Root', parentId: null } as unknown as Group;
         return items.find(i => i.id.toString() === itemId) || {} as Group; 
      },
      getChildren: (itemId: string) => {
        if (itemId === 'root') {
          return items.filter(i => !i.parentId).map(i => i.id.toString());
        }
        return items.filter(i => i.parentId && i.parentId.toString() === itemId).map(i => i.id.toString());
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // Special droppable for "All" or "Ungrouped"? 
  // For now let's just make sure we export a droppable zone for "Ungrouped" if needed.
  // Actually usually you drop into a specific folder.
  
  const { setNodeRef: setUngroupedRef, isOver: isUngroupedOver } = useDroppable({
    id: 'group-null',
    data: { id: null, name: 'Ungrouped' }
  });

  return (
    <aside className="w-64 border-r bg-muted/20 flex flex-col shrink-0">
      <div className="p-4 border-b flex items-center justify-between h-14">
        <span className="font-semibold tracking-tight">Группы</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onCreateGroup()} 
          title="Создать группу"
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          <Button
            variant={selectedGroupId === 'all' ? "secondary" : "ghost"}
            className={cn("w-full justify-start", selectedGroupId === 'all' && "bg-secondary/50 font-medium")}
            onClick={() => onSelectGroup('all')}
          >
            <Layers className="mr-2 h-4 w-4" />
            Все записи
          </Button>

          <div ref={setUngroupedRef} className={cn("rounded-md transition-colors", isUngroupedOver && "bg-primary/20 ring-2 ring-primary/50")}>
            <Button
                variant={selectedGroupId === null ? "secondary" : "ghost"}
                className={cn("w-full justify-start justify-between group", selectedGroupId === null ? "bg-secondary/50 font-medium" : "")}
                onClick={() => onSelectGroup(null)}
            >
                <div className="flex items-center">
                <FolderOpen className="mr-2 h-4 w-4" />
                Без группы
                </div>
                {groupStats?.ungrouped ? (
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">{groupStats.ungrouped}</span>
                ) : null}
            </Button>
          </div>

          <div className="my-2 border-t border-border/50" />
          
          <Tree tree={tree} className="space-y-1">
            {tree.getItems().map((item) => (
              <SidebarTreeItem 
                key={item.getId()} 
                item={item}
                selectedGroupId={selectedGroupId}
                onSelectGroup={onSelectGroup}
                onCreateGroup={onCreateGroup}
                onEditGroup={onEditGroup}
                onDeleteGroup={onDeleteGroup}
              />
            ))}
          </Tree>

          {items.length === 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                  Нет групп
              </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
