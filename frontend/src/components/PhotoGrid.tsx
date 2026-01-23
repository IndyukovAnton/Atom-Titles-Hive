import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Maximize2, GripVertical, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: number;
  url: string;
  type: 'image' | 'video';
}

interface PhotoGridProps {
  files: MediaFile[];
  onReorder: (files: MediaFile[]) => void;
  onAddClick: () => void;
  onDeleteFile: (fileId: number) => void;
  onViewFile: (index: number) => void;
}

interface SortableItemProps {
  file: MediaFile;
  index: number;
  onDelete: (id: number) => void;
  onView: (index: number) => void;
}

function SortableItem({ file, index, onDelete, onView }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-square rounded-xl overflow-hidden bg-muted border-2 border-transparent',
        'transition-all duration-200',
        isDragging && 'border-primary shadow-2xl scale-105 opacity-90'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-20 p-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Media Content */}
      {file.type === 'video' ? (
        <video 
          src={file.url} 
          className="w-full h-full object-cover" 
          muted 
        />
      ) : (
        <img 
          src={file.url} 
          alt="" 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
      )}

      {/* Type Badge */}
      {file.type === 'video' && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
          VIDEO
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onView(index);
          }}
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
        <Button 
          size="icon" 
          variant="destructive" 
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id);
          }}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function AddSlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30',
        'bg-muted/30 hover:bg-muted/50 hover:border-primary/50',
        'transition-all duration-200 flex flex-col items-center justify-center gap-2',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
        <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        Добавить
      </span>
    </button>
  );
}

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border border-dashed">
      <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
        <Layers className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Нет загруженных медиа</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-sm">
        Загрузите изображения или видео для этого тайтла. 
        Вы можете перетаскивать их для изменения порядка.
      </p>
      <Button onClick={onAddClick} className="gap-2">
        <Plus className="h-4 w-4" />
        Загрузить файлы
      </Button>
    </div>
  );
}

export default function PhotoGrid({
  files,
  onReorder,
  onAddClick,
  onDeleteFile,
  onViewFile,
}: PhotoGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      const newFiles = arrayMove(files, oldIndex, newIndex);
      onReorder(newFiles);
    }
  }, [files, onReorder]);

  if (!files || files.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={files.map(f => f.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <SortableItem
              key={file.id}
              file={file}
              index={index}
              onDelete={onDeleteFile}
              onView={onViewFile}
            />
          ))}
          <AddSlot onClick={onAddClick} />
        </div>
      </SortableContext>
    </DndContext>
  );
}
