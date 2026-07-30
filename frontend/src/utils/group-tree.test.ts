import { describe, it, expect } from 'vitest';
import {
  sortByOrder,
  buildChildrenMap,
  collectDescendantIds,
  getNextSiblingId,
  resolveGroupDrop,
  isNoopMove,
  buildParentOptions,
  type GroupTreeNode,
} from './group-tree';

const node = (
  id: number,
  parentId: number | null = null,
  sortOrder = 0,
  name = `Group ${id}`,
): GroupTreeNode => ({ id, name, parentId, sortOrder });

// Дерево:
// ├── 1 (so 0)
// │   ├── 2 (so 0)
// │   │   └── 5 (so 0)
// │   └── 3 (so 1)
// └── 4 (so 1)
const tree: GroupTreeNode[] = [
  node(1, null, 0),
  node(4, null, 1),
  node(2, 1, 0),
  node(3, 1, 1),
  node(5, 2, 0),
];

describe('sortByOrder', () => {
  it('sorts by sortOrder and falls back to name', () => {
    const items = [
      node(3, null, 2, 'B'),
      node(1, null, 0, 'C'),
      node(2, null, 0, 'A'),
    ];

    expect(sortByOrder(items).map((i) => i.id)).toEqual([2, 1, 3]);
  });

  it('puts items without sortOrder at the end', () => {
    const items = [{ id: 1, name: 'B' }, node(2, null, 0), { id: 3, name: 'A' }];

    expect(sortByOrder(items).map((i) => i.id)).toEqual([2, 3, 1]);
  });
});

describe('buildChildrenMap', () => {
  it('groups children by parent keeping display order', () => {
    const map = buildChildrenMap(tree);

    expect(map.get(null)?.map((g) => g.id)).toEqual([1, 4]);
    expect(map.get(1)?.map((g) => g.id)).toEqual([2, 3]);
    expect(map.get(2)?.map((g) => g.id)).toEqual([5]);
  });
});

describe('collectDescendantIds', () => {
  it('collects all nested descendants', () => {
    expect(collectDescendantIds(tree, 1)).toEqual(new Set([2, 3, 5]));
  });

  it('returns empty set for a leaf', () => {
    expect(collectDescendantIds(tree, 5)).toEqual(new Set());
  });

  it('terminates on cyclic data', () => {
    const cyclic = [node(1, 2), node(2, 1)];

    // Обход завершается; при цикле корень попадает в собственные потомки —
    // для cycle-check это даже безопаснее (такой дроп будет запрещён).
    expect(collectDescendantIds(cyclic, 1)).toEqual(new Set([2, 1]));
  });
});

describe('getNextSiblingId', () => {
  it('returns the next sibling in display order', () => {
    expect(getNextSiblingId(tree, 1)).toBe(4);
    expect(getNextSiblingId(tree, 2)).toBe(3);
  });

  it('returns null for the last sibling', () => {
    expect(getNextSiblingId(tree, 4)).toBeNull();
    expect(getNextSiblingId(tree, 3)).toBeNull();
  });
});

describe('resolveGroupDrop', () => {
  it('resolves before: parent of target, beforeId = target', () => {
    expect(
      resolveGroupDrop({ activeId: 3, targetId: 1, position: 'before', groups: tree }),
    ).toEqual({ parentId: null, beforeId: 1 });
  });

  it('resolves after: parent of target, beforeId = next sibling', () => {
    expect(
      resolveGroupDrop({ activeId: 2, targetId: 1, position: 'after', groups: tree }),
    ).toEqual({ parentId: null, beforeId: 4 });
  });

  it('resolves after at the end of siblings: beforeId = null', () => {
    expect(
      resolveGroupDrop({ activeId: 2, targetId: 4, position: 'after', groups: tree }),
    ).toEqual({ parentId: null, beforeId: null });
  });

  it('resolves inside: target becomes parent', () => {
    expect(
      resolveGroupDrop({ activeId: 4, targetId: 1, position: 'inside', groups: tree }),
    ).toEqual({ parentId: 1, beforeId: null });
  });

  it('resolves root drop zone to the end of root', () => {
    expect(
      resolveGroupDrop({ activeId: 2, targetId: null, position: 'inside', groups: tree }),
    ).toEqual({ parentId: null, beforeId: null });
  });

  it('rejects dropping onto itself', () => {
    expect(
      resolveGroupDrop({ activeId: 1, targetId: 1, position: 'inside', groups: tree }),
    ).toBeNull();
  });

  it('rejects dropping into own descendant (cycle)', () => {
    expect(
      resolveGroupDrop({ activeId: 1, targetId: 5, position: 'inside', groups: tree }),
    ).toBeNull();
  });

  it('returns null when position does not change anything', () => {
    // 4 уже идёт сразу после 1 — after-дроп на 1 ничего не меняет
    expect(
      resolveGroupDrop({ activeId: 4, targetId: 1, position: 'after', groups: tree }),
    ).toBeNull();
  });
});

describe('isNoopMove', () => {
  it('detects reorder to the same position (before next sibling)', () => {
    expect(
      isNoopMove(tree, 2, { parentId: 1, beforeId: 3 }),
    ).toBe(true);
  });

  it('detects append to the end of the same parent', () => {
    // 3 — последний ребёнок родителя 1
    expect(isNoopMove(tree, 3, { parentId: 1, beforeId: null })).toBe(true);
  });

  it('detects root drop of the last root group', () => {
    expect(isNoopMove(tree, 4, { parentId: null, beforeId: null })).toBe(true);
  });

  it('returns false when parent changes', () => {
    expect(isNoopMove(tree, 2, { parentId: null, beforeId: null })).toBe(false);
  });

  it('returns false when position changes', () => {
    expect(isNoopMove(tree, 3, { parentId: 1, beforeId: 2 })).toBe(false);
  });
});

describe('buildParentOptions', () => {
  it('flattens the tree with depth in display order', () => {
    const options = buildParentOptions(tree);

    expect(options.map((o) => [o.id, o.depth])).toEqual([
      [null, 0],
      [1, 1],
      [2, 2],
      [5, 3],
      [3, 2],
      [4, 1],
    ]);
  });

  it('disables the edited group and its descendants', () => {
    const options = buildParentOptions(tree, 1);
    const disabledById = new Map(options.map((o) => [o.id, o.disabled]));

    // Сама группа и всё её поддерево запрещены (иначе цикл)
    expect(disabledById.get(1)).toBe(true);
    expect(disabledById.get(2)).toBe(true);
    expect(disabledById.get(5)).toBe(true);
    expect(disabledById.get(3)).toBe(true);
    // Корень и чужая ветка доступны
    expect(disabledById.get(null)).toBe(false);
    expect(disabledById.get(4)).toBe(false);
  });

  it('keeps everything enabled without excludeId', () => {
    expect(buildParentOptions(tree).every((o) => !o.disabled)).toBe(true);
  });
});
