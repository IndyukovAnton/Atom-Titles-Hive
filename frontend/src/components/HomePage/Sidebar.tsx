import { Plus, Layers, FolderOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { cn } from "@/lib/utils";
import { SidebarGroupItem } from './SidebarGroupItem';
import type { GroupStats } from '../../api/groups';

interface SidebarProps {
  groupStats: GroupStats | null;
  selectedGroupId: number | null | 'all';
  onSelectGroup: (id: number | null | 'all') => void;
  onCreateGroup: () => void;
  onEditGroup: (id: number) => void;
  onDeleteGroup: (id: number) => void;
  onDragEnd: (result: DropResult) => void;
}

export const Sidebar = ({
  groupStats,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onDragEnd
}: SidebarProps) => {
  return (
    <aside className="w-64 border-r bg-muted/20 flex flex-col shrink-0">
      <div className="p-4 border-b flex items-center justify-between h-14">
        <span className="font-semibold tracking-tight">Группы</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCreateGroup} 
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

          <div className="my-2 border-t border-border/50" />
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="groups">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {groupStats?.groups.map((group, index) => (
                    <SidebarGroupItem
                      key={group.id}
                      group={group}
                      index={index}
                      isSelected={selectedGroupId === group.id}
                      onSelect={onSelectGroup}
                      onEdit={onEditGroup}
                      onDelete={onDeleteGroup}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </ScrollArea>
    </aside>
  );
};
