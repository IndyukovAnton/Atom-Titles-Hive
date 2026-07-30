import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Maximize2, GripVertical, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
function SortableItem({ file, index, onDelete, onView }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id: file.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };
    return (_jsxs("div", { ref: setNodeRef, style: style, className: cn('group relative aspect-square rounded-xl overflow-hidden bg-muted border-2 border-transparent', 'transition-all duration-200', isDragging && 'border-primary shadow-2xl scale-105 opacity-90'), children: [_jsx("div", { ...attributes, ...listeners, className: "absolute top-2 left-2 z-20 p-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing", children: _jsx(GripVertical, { className: "h-4 w-4" }) }), file.type === 'video' ? (_jsx("video", { src: file.url, className: "w-full h-full object-cover", muted: true })) : (_jsx("img", { src: file.url, alt: "", className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" })), file.type === 'video' && (_jsx("div", { className: "absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium", children: "VIDEO" })), _jsxs("div", { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3", children: [_jsx(Button, { size: "icon", variant: "secondary", className: "h-10 w-10 rounded-full shadow-lg", onClick: (e) => {
                            e.stopPropagation();
                            onView(index);
                        }, children: _jsx(Maximize2, { className: "h-5 w-5" }) }), _jsx(Button, { size: "icon", variant: "destructive", className: "h-10 w-10 rounded-full shadow-lg", onClick: (e) => {
                            e.stopPropagation();
                            onDelete(file.id);
                        }, children: _jsx(Trash2, { className: "h-5 w-5" }) })] })] }));
}
function AddSlot({ onClick }) {
    return (_jsxs("button", { onClick: onClick, className: cn('group aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30', 'bg-muted/30 hover:bg-muted/50 hover:border-primary/50', 'transition-all duration-200 flex flex-col items-center justify-center gap-2', 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'), children: [_jsx("div", { className: "p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors", children: _jsx(Plus, { className: "h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" }) }), _jsx("span", { className: "text-sm text-muted-foreground group-hover:text-foreground transition-colors", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" })] }));
}
function EmptyState({ onAddClick }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border border-dashed", children: [_jsx("div", { className: "p-4 bg-background rounded-full mb-4 shadow-sm", children: _jsx(Layers, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "\u041D\u0435\u0442 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043D\u044B\u0445 \u043C\u0435\u0434\u0438\u0430" }), _jsx("p", { className: "text-muted-foreground mb-6 text-center max-w-sm", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0442\u0430\u0439\u0442\u043B\u0430. \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u0442\u044C \u0438\u0445 \u0434\u043B\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u043E\u0440\u044F\u0434\u043A\u0430." }), _jsxs(Button, { onClick: onAddClick, className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u0430\u0439\u043B\u044B"] })] }));
}
export default function PhotoGrid({ files, onReorder, onAddClick, onDeleteFile, onViewFile, }) {
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = files.findIndex((f) => f.id === active.id);
            const newIndex = files.findIndex((f) => f.id === over.id);
            const newFiles = arrayMove(files, oldIndex, newIndex);
            onReorder(newFiles);
        }
    }, [files, onReorder]);
    if (!files || files.length === 0) {
        return _jsx(EmptyState, { onAddClick: onAddClick });
    }
    return (_jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsx(SortableContext, { items: files.map(f => f.id), strategy: rectSortingStrategy, children: _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: [files.map((file, index) => (_jsx(SortableItem, { file: file, index: index, onDelete: onDeleteFile, onView: onViewFile }, file.id))), _jsx(AddSlot, { onClick: onAddClick })] }) }) }));
}
