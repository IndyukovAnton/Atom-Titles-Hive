import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Layers, FolderOpen, Edit, Trash, Sparkles, Pin, Star, CornerUpLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { syncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { Tree, TreeItem, TreeItemLabel } from '@/components/ui/tree';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, } from "@/components/ui/context-menu";
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { sortByOrder } from '@/utils/group-tree';
export const GROUP_ROOT_DROPPABLE_ID = 'group-root';
const SidebarTreeItem = ({ item, selectedGroupId, onSelectGroup, onCreateGroup, onEditGroup, onDeleteGroup, dropPosition, isForbiddenTarget, }) => {
    const data = item.getItemData();
    const isSelected = selectedGroupId === data.id;
    const { setNodeRef: setDroppableRef } = useDroppable({
        id: `group-${data.id}`,
        data: data,
    });
    const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
        id: `group-${data.id}`,
        data: data,
    });
    const displayCount = data.totalCount ?? data.count ?? 0;
    return (_jsxs("div", { ref: (node) => {
            setDroppableRef(node);
            setDraggableRef(node);
        }, className: cn("relative rounded-md transition-colors", dropPosition === 'inside' && "bg-primary/20 ring-2 ring-primary/50", isForbiddenTarget && "ring-2 ring-destructive/50"), children: [dropPosition === 'before' && (_jsx("div", { className: "pointer-events-none absolute -top-0.5 inset-x-2 z-20 h-0.5 rounded-full bg-primary" })), dropPosition === 'after' && (_jsx("div", { className: "pointer-events-none absolute -bottom-0.5 inset-x-2 z-20 h-0.5 rounded-full bg-primary" })), _jsx(TreeItem, { item: item, className: "w-full", style: { opacity: isDragging ? 0.4 : 1 }, children: _jsxs(ContextMenu, { children: [_jsx(ContextMenuTrigger, { asChild: true, children: _jsxs("div", { className: cn("flex items-center w-full p-2 rounded-md hover:bg-accent/50 cursor-pointer text-sm font-medium transition-colors group/item", isSelected ? "bg-secondary/50 text-secondary-foreground" : "text-muted-foreground", dropPosition === 'inside' && "bg-transparent"), onClick: () => onSelectGroup(data.id), children: [_jsx("div", { ...attributes, ...listeners, className: "mr-2 opacity-0 group-hover/item:opacity-50 cursor-grab active:cursor-grabbing hover:opacity-100 transition-opacity", title: "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044C", "aria-label": `Перетащить группу ${item.getItemName()}`, children: _jsx(Layers, { className: "h-3.5 w-3.5" }) }), _jsx(TreeItemLabel, { item: item, className: "flex-1 bg-transparent hover:bg-transparent p-0 data-[selected=true]:bg-transparent data-[selected=true]:text-current", children: _jsx("span", { className: "truncate", children: item.getItemName() }) }), displayCount > 0 && (_jsx("span", { className: "text-xs ml-2 bg-background/50 px-2 py-0.5 rounded-full opacity-70", title: "\u0417\u0430\u043F\u0438\u0441\u0435\u0439 \u0441 \u0443\u0447\u0451\u0442\u043E\u043C \u043F\u043E\u0434\u043F\u0430\u043F\u043E\u043A", children: displayCount }))] }) }), _jsxs(ContextMenuContent, { children: [_jsxs(ContextMenuItem, { onClick: (e) => { e.stopPropagation(); onCreateGroup(data.id); }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0434\u043F\u0430\u043F\u043A\u0443"] }), _jsxs(ContextMenuItem, { onClick: (e) => { e.stopPropagation(); onEditGroup(data.id); }, children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), " \u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C"] }), _jsxs(ContextMenuItem, { onClick: (e) => { e.stopPropagation(); onDeleteGroup(data.id); }, className: "text-destructive focus:text-destructive", children: [_jsx(Trash, { className: "mr-2 h-4 w-4" }), " \u0423\u0434\u0430\u043B\u0438\u0442\u044C"] })] })] }) })] }));
};
export const Sidebar = ({ groupStats, selectedGroupId, onSelectGroup, onCreateGroup, onEditGroup, onDeleteGroup, isGroupDragging = false, dropIndicator, }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isRecommendationsPage = location.pathname === '/recommendations';
    const isConsiderationsPage = location.pathname === '/considerations';
    const isFavoritesPage = location.pathname === '/favorites';
    const items = useMemo(() => sortByOrder(groupStats?.groups ?? []), [groupStats]);
    const tree = useTree({
        features: [syncDataLoaderFeature],
        rootItemId: 'root',
        getItemName: (item) => item.getItemData().name,
        isItemFolder: () => true,
        dataLoader: {
            getItem: (itemId) => {
                if (itemId === 'root') {
                    return { id: 0, name: 'Root', parentId: null, count: 0 };
                }
                return items.find(i => i.id.toString() === itemId) || {};
            },
            getChildren: (itemId) => {
                const children = itemId === 'root'
                    ? items.filter(i => !i.parentId)
                    : items.filter(i => i.parentId && i.parentId.toString() === itemId);
                return children.map(i => i.id.toString());
            },
        },
        initialState: {
            expandedItems: JSON.parse(localStorage.getItem('sidebar-tree-expanded') || '[]'),
        },
        // @ts-expect-error - onStateChange is not typed but supported
        onStateChange: (state) => {
            if (state.expandedItems) {
                localStorage.setItem('sidebar-tree-expanded', JSON.stringify(state.expandedItems));
            }
        }
    });
    // syncDataLoaderFeature не следит за данными сам — перестраиваем дерево
    // при изменении списка групп (reorder, перенос, создание, удаление).
    useEffect(() => {
        tree.rebuildTree();
    }, [items, tree]);
    const { setNodeRef: setUngroupedRef, isOver: isUngroupedOver } = useDroppable({
        id: 'group-null',
        data: { id: null, name: 'Ungrouped' }
    });
    const { setNodeRef: setRootZoneRef } = useDroppable({
        id: GROUP_ROOT_DROPPABLE_ID,
    });
    const isRootZoneTargeted = dropIndicator?.overId === GROUP_ROOT_DROPPABLE_ID;
    return (_jsxs("aside", { className: "w-64 border-r bg-muted/20 flex flex-col shrink-0", children: [_jsxs("div", { id: "sidebar-tour-header", className: "p-4 border-b flex items-center justify-between h-14", children: [_jsx("span", { className: "font-semibold tracking-tight", children: "\u0413\u0440\u0443\u043F\u043F\u044B" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => onCreateGroup(), title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443", "aria-label": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u0443", className: "h-8 w-8", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsx(ScrollArea, { className: "flex-1", children: _jsxs("div", { className: "p-3 space-y-1", children: [_jsxs(Button, { variant: isRecommendationsPage ? "secondary" : "ghost", className: cn("w-full justify-start text-amber-500 hover:text-amber-600 hover:bg-amber-500/10", isRecommendationsPage && "bg-amber-500/10 text-amber-600"), onClick: () => navigate('/recommendations'), children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438"] }), _jsxs(Button, { variant: isConsiderationsPage ? "secondary" : "ghost", className: cn("w-full justify-start text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10", isConsiderationsPage && "bg-indigo-500/10 text-indigo-600"), onClick: () => navigate('/considerations'), children: [_jsx(Pin, { className: "mr-2 h-4 w-4" }), "\u041F\u043E\u0434\u0443\u043C\u0430\u044E"] }), _jsxs(Button, { variant: isFavoritesPage ? "secondary" : "ghost", className: cn("w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-500/10", isFavoritesPage && "bg-rose-500/10 text-rose-600"), onClick: () => navigate('/favorites'), children: [_jsx(Star, { className: "mr-2 h-4 w-4" }), "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435"] }), _jsx("div", { className: "my-2 border-t border-border/50" }), _jsxs(Button, { variant: selectedGroupId === 'all' ? "secondary" : "ghost", className: cn("w-full justify-start", selectedGroupId === 'all' && "bg-secondary/50 font-medium"), onClick: () => onSelectGroup('all'), children: [_jsx(Layers, { className: "mr-2 h-4 w-4" }), "\u0412\u0441\u0435 \u0437\u0430\u043F\u0438\u0441\u0438"] }), _jsx("div", { ref: setUngroupedRef, className: cn("rounded-md transition-colors", isUngroupedOver && "bg-primary/20 ring-2 ring-primary/50"), children: _jsxs(Button, { variant: selectedGroupId === null ? "secondary" : "ghost", className: cn("w-full justify-start justify-between group", selectedGroupId === null ? "bg-secondary/50 font-medium" : ""), onClick: () => onSelectGroup(null), children: [_jsxs("div", { className: "flex items-center", children: [_jsx(FolderOpen, { className: "mr-2 h-4 w-4" }), "\u0411\u0435\u0437 \u0433\u0440\u0443\u043F\u043F\u044B"] }), groupStats?.ungrouped ? (_jsx("span", { className: "text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full", children: groupStats.ungrouped })) : null] }) }), _jsx("div", { className: "my-2 border-t border-border/50" }), _jsx(Tree, { tree: tree, className: "space-y-1", children: tree.getItems().map((item) => {
                                const itemDndId = `group-${item.getItemData().id}`;
                                const isTarget = dropIndicator?.overId === itemDndId;
                                return (_jsx(SidebarTreeItem, { item: item, selectedGroupId: selectedGroupId, onSelectGroup: onSelectGroup, onCreateGroup: onCreateGroup, onEditGroup: onEditGroup, onDeleteGroup: onDeleteGroup, dropPosition: isTarget && !dropIndicator?.forbidden ? dropIndicator?.position ?? null : null, isForbiddenTarget: isTarget && (dropIndicator?.forbidden ?? false) }, item.getId()));
                            }) }), items.length === 0 && (_jsx("div", { className: "text-center py-4 text-xs text-muted-foreground", children: "\u041D\u0435\u0442 \u0433\u0440\u0443\u043F\u043F" })), isGroupDragging && (_jsxs("div", { ref: setRootZoneRef, className: cn("mt-2 flex items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 py-2.5 text-xs text-muted-foreground transition-colors", isRootZoneTargeted
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border"), children: [_jsx(CornerUpLeft, { className: "h-3.5 w-3.5" }), "\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u0432 \u043A\u043E\u0440\u0435\u043D\u044C"] }))] }) })] }));
};
