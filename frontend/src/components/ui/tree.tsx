/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { type ItemInstance } from '@headless-tree/core';
import { ChevronDownIcon, SquareMinus, SquarePlus } from 'lucide-react';
import { Slot as SlotPrimitive } from '@radix-ui/react-slot';

type ToggleIconType = 'chevron' | 'plus-minus';

interface TreeContextValue<T = any> {
  indent: number;
  currentItem?: ItemInstance<T>;
  tree?: any;
  toggleIconType?: ToggleIconType;
}

const TreeContext = React.createContext<TreeContextValue>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
  toggleIconType: 'plus-minus',
});

function useTreeContext<T = any>() {
  return React.useContext(TreeContext) as TreeContextValue<T>;
}

interface TreeProps extends React.HTMLAttributes<HTMLDivElement> {
  indent?: number;
  tree?: any;
  toggleIconType?: ToggleIconType;
}

function Tree({ indent = 20, tree, className, toggleIconType = 'chevron', ...props }: TreeProps) {
  const containerProps = tree && typeof tree.getContainerProps === 'function' ? tree.getContainerProps() : {};
  const mergedProps = { ...props, ...containerProps };

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps;

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    '--tree-indent': `${indent}px`,
  } as React.CSSProperties;

  return (
    <TreeContext.Provider value={{ indent, tree, toggleIconType }}>
      <div data-slot="tree" style={mergedStyle} className={cn('flex flex-col', className)} {...otherProps} />
    </TreeContext.Provider>
  );
}

interface TreeItemProps<T = any> extends React.HTMLAttributes<HTMLButtonElement> {
  item: ItemInstance<T>;
  indent?: number;
  asChild?: boolean;
}

function TreeItem<T = any>({ item, className, asChild, children, ...props }: Omit<TreeItemProps<T>, 'indent'>) {
  const parentContext = useTreeContext<T>();
  const { indent } = parentContext;

  // Безопасное получение props с обработкой ошибок
  let itemProps = {};
  try {
    itemProps = typeof item.getProps === 'function' ? item.getProps() : {};
  } catch (error) {
    console.warn('TreeItem: Failed to get item props', error);
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
  } as React.CSSProperties;

  const Comp = asChild ? SlotPrimitive : 'button';

  // Безопасные проверки методов
  const safeCheckMethod = (method: any) => {
    try {
      return typeof method === 'function' ? method() || false : false;
    } catch {
      return false;
    }
  };

  return (
    <TreeContext.Provider value={{ ...parentContext, currentItem: item }}>
      <Comp
        data-slot="tree-item"
        style={mergedStyle}
        className={cn(
          'z-10 ps-[var(--tree-padding)] outline-none select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className,
        )}
        data-focus={safeCheckMethod(item.isFocused)}
        data-folder={safeCheckMethod(item.isFolder)}
        data-selected={safeCheckMethod(item.isSelected)}
        data-drag-target={safeCheckMethod(item.isDragTarget)}
        data-search-match={safeCheckMethod(item.isMatchingSearch)}
        aria-expanded={typeof item.isExpanded === 'function' ? item.isExpanded() : undefined}
        {...otherProps}
      >
        {children}
      </Comp>
    </TreeContext.Provider>
  );
}

interface TreeItemLabelProps<T = any> extends React.HTMLAttributes<HTMLSpanElement> {
  item?: ItemInstance<T>;
}

function TreeItemLabel<T = any>({ item: propItem, children, className, ...props }: TreeItemLabelProps<T>) {
  const { currentItem, toggleIconType } = useTreeContext<T>();
  const item = propItem || currentItem;

  if (!item) {
    console.warn('TreeItemLabel: No item provided via props or context');
    return null;
  }

  // Безопасная проверка isFolder
  const isFolder = typeof item.isFolder === 'function' ? item.isFolder() : false;
  const isExpanded = typeof item.isExpanded === 'function' ? item.isExpanded() : false;
  const itemName = typeof item.getItemName === 'function' ? item.getItemName() : '';

  return (
    <span
      data-slot="tree-item-label"
      className={cn(
        'group-data-[focus=true]:ring-ring/50 bg-background hover:bg-accent group-data-[selected=true]:bg-accent group-data-[selected=true]:text-accent-foreground group-data-[drag-target=true]:bg-accent flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors data-[folder=false]:ps-7 group-data-[focus=true]:ring-[3px] group-data-[search-match=true]:bg-blue-50! [&_svg]:pointer-events-none [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {isFolder &&
        (toggleIconType === 'plus-minus' ? (
          isExpanded ? (
            <SquareMinus className="text-muted-foreground size-3.5" stroke="currentColor" strokeWidth="1" />
          ) : (
            <SquarePlus className="text-muted-foreground size-3.5" stroke="currentColor" strokeWidth="1" />
          )
        ) : (
          <ChevronDownIcon className="text-muted-foreground size-4 group-aria-[expanded=false]:-rotate-90" />
        ))}
      {children || itemName}
    </span>
  );
}

function TreeDragLine({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext();

  if (!tree || typeof tree.getDragLineStyle !== 'function') {
    console.warn('TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method');
    return null;
  }

  const dragLine = tree.getDragLineStyle();
  return (
    <div
      style={dragLine}
      className={cn(
        'bg-primary before:bg-background before:border-primary absolute z-30 -mt-px h-0.5 w-[unset] before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2',
        className,
      )}
      {...props}
    />
  );
}

export { Tree, TreeItem, TreeItemLabel, TreeDragLine };
