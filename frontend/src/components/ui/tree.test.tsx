import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import { syncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { Tree, TreeItem, TreeItemLabel } from './tree';

interface TestGroup {
  id: number;
  name: string;
  parentId: number | null;
}

// Минимальная копия конфигурации дерева из Sidebar
function Harness({ groups }: { groups: TestGroup[] }) {
  const tree = useTree<TestGroup>({
    features: [syncDataLoaderFeature],
    rootItemId: 'root',
    getItemName: (item) => item.getItemData().name,
    isItemFolder: () => true,
    dataLoader: {
      getItem: (itemId: string) =>
        itemId === 'root'
          ? ({ id: 0, name: 'Root', parentId: null } as TestGroup)
          : groups.find((g) => g.id.toString() === itemId) ||
            ({} as TestGroup),
      getChildren: (itemId: string) => {
        const children =
          itemId === 'root'
            ? groups.filter((g) => !g.parentId)
            : groups.filter((g) => g.parentId?.toString() === itemId);
        return children.map((g) => g.id.toString());
      },
    },
  });

  return (
    <Tree tree={tree}>
      {tree.getItems().map((item) => (
        <TreeItem key={item.getId()} item={item}>
          <TreeItemLabel item={item} />
        </TreeItem>
      ))}
    </Tree>
  );
}

const groups: TestGroup[] = [
  { id: 1, name: 'Фильмы', parentId: null },
  { id: 2, name: 'Аниме', parentId: 1 },
  { id: 3, name: 'Сериалы', parentId: null },
];

describe('TreeItemLabel', () => {
  it('shows expand icon only for folders with children', () => {
    render(<Harness groups={groups} />);

    const parentRow = screen
      .getByText('Фильмы')
      .closest('[data-slot="tree-item"]');
    const leafRow = screen
      .getByText('Сериалы')
      .closest('[data-slot="tree-item"]');

    expect(
      parentRow?.querySelector('svg.lucide-chevron-down'),
    ).not.toBeNull();
    expect(leafRow?.querySelector('svg.lucide-chevron-down')).toBeNull();
  });

  it('keeps label alignment via placeholder for childless folders', () => {
    render(<Harness groups={groups} />);

    const leafRow = screen
      .getByText('Сериалы')
      .closest('[data-slot="tree-item"]');

    expect(
      leafRow?.querySelector('span[aria-hidden="true"].size-4'),
    ).not.toBeNull();
  });
});
