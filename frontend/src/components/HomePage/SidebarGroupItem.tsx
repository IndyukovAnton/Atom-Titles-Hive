import { Draggable } from '@hello-pangea/dnd';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { GroupStats } from '../../api/groups';

// Extract Group type helper
type Group = GroupStats['groups'][0];

interface SidebarGroupItemProps {
  group: Group;
  index: number;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export const SidebarGroupItem = ({ group, index, isSelected, onSelect, onEdit, onDelete }: SidebarGroupItemProps) => {
  return (
    <Draggable draggableId={group.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <Button
                variant={isSelected ? "secondary" : "ghost"}
                className={cn("w-full justify-start justify-between font-normal", isSelected && "bg-secondary/50 font-medium")}
                onClick={() => onSelect(group.id)}
              >
                <span className="truncate">{group.name}</span>
                {group.count > 0 && (
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full ml-auto">{group.count}</span>
                )}
              </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onEdit(group.id)}>
                <Edit className="mr-2 h-4 w-4" /> Редактировать
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDelete(group.id)} className="text-destructive focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" /> Удалить
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}
    </Draggable>
  );
};
