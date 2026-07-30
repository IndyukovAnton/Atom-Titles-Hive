/**
 * Чистые функции для работы с деревом групп: порядок, потомки,
 * разрешение drag-and-drop в параметры PATCH /groups/:id/move.
 * Без React и сайд-эффектов — легко тестировать.
 */

export interface GroupTreeNode {
  id: number;
  name: string;
  parentId?: number | null;
  sortOrder?: number;
}

export type DropPosition = 'before' | 'after' | 'inside';

export interface GroupDropResolution {
  parentId: number | null;
  /** null — в конец списка siblings */
  beforeId: number | null;
}

/** Сортировка по sortOrder с fallback на имя (backend уже сортирует — это страховка). */
export function sortByOrder<T extends GroupTreeNode>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

/** parentId (null = корень) → отсортированные дочерние группы. */
export function buildChildrenMap<T extends GroupTreeNode>(
  groups: T[],
): Map<number | null, T[]> {
  const map = new Map<number | null, T[]>();
  for (const group of sortByOrder(groups)) {
    const key = group.parentId ?? null;
    const children = map.get(key) ?? [];
    children.push(group);
    map.set(key, children);
  }
  return map;
}

/** id всех потомков группы (не включая её саму). Устойчиво к циклам в данных. */
export function collectDescendantIds(
  groups: GroupTreeNode[],
  rootId: number,
): Set<number> {
  const childrenMap = buildChildrenMap(groups);
  const descendants = new Set<number>();
  const stack = [...(childrenMap.get(rootId) ?? [])];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (descendants.has(current.id)) continue;
    descendants.add(current.id);
    stack.push(...(childrenMap.get(current.id) ?? []));
  }
  return descendants;
}

/** id следующего sibling'а в порядке отображения; null, если группа последняя. */
export function getNextSiblingId(
  groups: GroupTreeNode[],
  id: number,
): number | null {
  const target = groups.find((g) => g.id === id);
  if (!target) return null;

  const siblings = sortByOrder(
    groups.filter(
      (g) => (g.parentId ?? null) === (target.parentId ?? null),
    ),
  );
  const index = siblings.findIndex((g) => g.id === id);
  return index >= 0 && index < siblings.length - 1
    ? siblings[index + 1].id
    : null;
}

/**
 * Переводит дроп (цель + позиция курсора) в параметры move-запроса.
 * Возвращает null, если дроп запрещён (себя/потомка) или ничего не меняет.
 */
export function resolveGroupDrop(params: {
  activeId: number;
  /** null — дроп-зона корня */
  targetId: number | null;
  position: DropPosition;
  groups: GroupTreeNode[];
}): GroupDropResolution | null {
  const { activeId, targetId, position, groups } = params;

  if (targetId === null) {
    return { parentId: null, beforeId: null };
  }

  if (activeId === targetId) return null;
  if (collectDescendantIds(groups, activeId).has(targetId)) return null;

  const target = groups.find((g) => g.id === targetId);
  if (!target) return null;
  const targetParent = target.parentId ?? null;

  switch (position) {
    case 'inside':
      return { parentId: targetId, beforeId: null };
    case 'before':
      return { parentId: targetParent, beforeId: targetId };
    case 'after': {
      const nextId = getNextSiblingId(groups, targetId);
      // Цель — непосредственный сосед сверху: позиция не изменится
      if (nextId === activeId) return null;
      return { parentId: targetParent, beforeId: nextId };
    }
  }
}

/**
 * Приведёт ли move к фактическому изменению. Такие дропы отсекаем
 * до запроса, чтобы не слать бессмысленные PATCH и не дёргать дерево.
 */
export function isNoopMove(
  groups: GroupTreeNode[],
  activeId: number,
  resolution: GroupDropResolution,
): boolean {
  const active = groups.find((g) => g.id === activeId);
  if (!active) return false;
  if ((active.parentId ?? null) !== resolution.parentId) return false;
  return getNextSiblingId(groups, activeId) === resolution.beforeId;
}

export interface ParentOption {
  id: number | null;
  name: string;
  depth: number;
  disabled: boolean;
}

/**
 * Плоский список опций родителя для Select с глубиной вложенности.
 * excludeId и его потомки помечаются disabled — их нельзя выбрать
 * родителем, иначе получится цикл.
 */
export function buildParentOptions(
  groups: GroupTreeNode[],
  excludeId?: number,
): ParentOption[] {
  const childrenMap = buildChildrenMap(groups);
  const excluded =
    excludeId !== undefined
      ? collectDescendantIds(groups, excludeId)
      : new Set<number>();

  const options: ParentOption[] = [
    { id: null, name: 'Без родительской папки', depth: 0, disabled: false },
  ];
  const visited = new Set<number>();

  const walk = (parentId: number | null, depth: number) => {
    for (const child of childrenMap.get(parentId) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);

      options.push({
        id: child.id,
        name: child.name,
        depth,
        disabled: child.id === excludeId || excluded.has(child.id),
      });
      walk(child.id, depth + 1);
    }
  };
  walk(null, 1);

  return options;
}
