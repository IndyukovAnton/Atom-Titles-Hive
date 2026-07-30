/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';
import {} from '@headless-tree/core';
import { ChevronDownIcon, SquareMinus, SquarePlus } from 'lucide-react';
import { Slot as SlotPrimitive } from '@radix-ui/react-slot';
const TreeContext = React.createContext({
    indent: 20,
    currentItem: undefined,
    tree: undefined,
    toggleIconType: 'plus-minus',
});
function useTreeContext() {
    return React.useContext(TreeContext);
}
function Tree({ indent = 20, tree, className, toggleIconType = 'chevron', ...props }) {
    const containerProps = tree && typeof tree.getContainerProps === 'function' ? tree.getContainerProps() : {};
    const mergedProps = { ...props, ...containerProps };
    // Extract style from mergedProps to merge with our custom styles
    const { style: propStyle, ...otherProps } = mergedProps;
    // Merge styles
    const mergedStyle = {
        ...propStyle,
        '--tree-indent': `${indent}px`,
    };
    return (_jsx(TreeContext.Provider, { value: { indent, tree, toggleIconType }, children: _jsx("div", { "data-slot": "tree", style: mergedStyle, className: cn('flex flex-col', className), ...otherProps }) }));
}
function TreeItem({ item, className, asChild, children, ...props }) {
    const parentContext = useTreeContext();
    const { indent } = parentContext;
    // Безопасное получение props с обработкой ошибок
    let itemProps = {};
    try {
        itemProps = typeof item.getProps === 'function' ? item.getProps() : {};
    }
    catch (error) {
        logger.warn('TreeItem: Failed to get item props', error);
    }
    const mergedProps = { ...props, ...itemProps };
    // Extract style from mergedProps to merge with our custom styles
    const { style: propStyle, ...otherProps } = mergedProps;
    // Безопасное получение метаданных
    const level = item.getItemMeta?.()?.level ?? 0;
    // Merge styles
    const mergedStyle = {
        ...propStyle,
        '--tree-padding': `${level * indent}px`,
    };
    const Comp = asChild ? SlotPrimitive : 'button';
    // Безопасные проверки методов
    const safeCheckMethod = (method) => {
        try {
            return typeof method === 'function' ? method() || false : false;
        }
        catch {
            return false;
        }
    };
    return (_jsx(TreeContext.Provider, { value: { ...parentContext, currentItem: item }, children: _jsx(Comp, { "data-slot": "tree-item", style: mergedStyle, className: cn('z-10 ps-[var(--tree-padding)] outline-none select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className), "data-focus": safeCheckMethod(item.isFocused), "data-folder": safeCheckMethod(item.isFolder), "data-selected": safeCheckMethod(item.isSelected), "data-drag-target": safeCheckMethod(item.isDragTarget), "data-search-match": safeCheckMethod(item.isMatchingSearch), "aria-expanded": typeof item.isExpanded === 'function' ? item.isExpanded() : undefined, ...otherProps, children: children }) }));
}
function TreeItemLabel({ item: propItem, children, className, ...props }) {
    const { currentItem, toggleIconType } = useTreeContext();
    const item = propItem || currentItem;
    if (!item) {
        logger.warn('TreeItemLabel: No item provided via props or context');
        return null;
    }
    // Безопасная проверка isFolder
    const isFolder = typeof item.isFolder === 'function' ? item.isFolder() : false;
    const isExpanded = typeof item.isExpanded === 'function' ? item.isExpanded() : false;
    const itemName = typeof item.getItemName === 'function' ? item.getItemName() : '';
    // Тоггл раскрытия бессмыслен у папки без детей — скрываем его,
    // оставляя placeholder той же ширины, чтобы текст не съезжал.
    const hasChildren = (() => {
        if (!isFolder || typeof item.getChildren !== 'function')
            return false;
        try {
            return (item.getChildren()?.length ?? 0) > 0;
        }
        catch {
            return false;
        }
    })();
    return (_jsxs("span", { "data-slot": "tree-item-label", className: cn('group-data-[focus=true]:ring-ring/50 bg-background hover:bg-accent group-data-[selected=true]:bg-accent group-data-[selected=true]:text-accent-foreground group-data-[drag-target=true]:bg-accent flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors data-[folder=false]:ps-7 group-data-[focus=true]:ring-[3px] group-data-[search-match=true]:bg-blue-50! [&_svg]:pointer-events-none [&_svg]:shrink-0', className), ...props, children: [isFolder &&
                (hasChildren ? (toggleIconType === 'plus-minus' ? (isExpanded ? (_jsx(SquareMinus, { className: "text-muted-foreground size-3.5", stroke: "currentColor", strokeWidth: "1" })) : (_jsx(SquarePlus, { className: "text-muted-foreground size-3.5", stroke: "currentColor", strokeWidth: "1" }))) : (_jsx(ChevronDownIcon, { className: "text-muted-foreground size-4 group-aria-[expanded=false]:-rotate-90" }))) : (_jsx("span", { "aria-hidden": "true", className: toggleIconType === 'plus-minus' ? 'size-3.5' : 'size-4' }))), children || itemName] }));
}
function TreeDragLine({ className, ...props }) {
    const { tree } = useTreeContext();
    if (!tree || typeof tree.getDragLineStyle !== 'function') {
        logger.warn('TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method');
        return null;
    }
    const dragLine = tree.getDragLineStyle();
    return (_jsx("div", { style: dragLine, className: cn('bg-primary before:bg-background before:border-primary absolute z-30 -mt-px h-0.5 w-[unset] before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2', className), ...props }));
}
export { Tree, TreeItem, TreeItemLabel, TreeDragLine };
