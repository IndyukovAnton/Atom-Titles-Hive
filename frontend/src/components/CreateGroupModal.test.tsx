import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import CreateGroupModal from './CreateGroupModal';
import { groupsApi } from '../api/groups';
import type { GroupStatsItem } from '../api/groups';

vi.mock('../api/groups', () => ({
  groupsApi: {
    create: vi.fn().mockResolvedValue({ id: 10 }),
    update: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

const groups: GroupStatsItem[] = [
  { id: 1, name: 'Фильмы', parentId: null, sortOrder: 0, count: 0 },
  { id: 2, name: 'Сериалы', parentId: null, sortOrder: 1, count: 0 },
];

describe('CreateGroupModal', () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a group in the preselected parent', async () => {
    const user = userEvent.setup();
    render(
      <CreateGroupModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        parentId={1}
        groups={groups}
      />,
    );

    await user.type(screen.getByLabelText(/название/i), 'Аниме');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(groupsApi.create).toHaveBeenCalledWith({
        name: 'Аниме',
        parentId: 1,
      });
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should create a root group when no parent is preselected', async () => {
    const user = userEvent.setup();
    render(
      <CreateGroupModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        groups={groups}
      />,
    );

    await user.type(screen.getByLabelText(/название/i), 'Игры');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    await waitFor(() => {
      expect(groupsApi.create).toHaveBeenCalledWith({
        name: 'Игры',
        parentId: null,
      });
    });
  });

  it('should send explicit null parentId when editing a root group', async () => {
    const user = userEvent.setup();
    render(
      <CreateGroupModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        initialData={{ id: 1, name: 'Фильмы', parentId: null }}
        groups={groups}
      />,
    );

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(groupsApi.update).toHaveBeenCalledWith(1, {
        name: 'Фильмы',
        parentId: null,
      });
    });
  });

  it('should send the current parentId when editing a subgroup', async () => {
    const user = userEvent.setup();
    render(
      <CreateGroupModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        initialData={{ id: 2, name: 'Сериалы', parentId: 1 }}
        groups={groups}
      />,
    );

    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(groupsApi.update).toHaveBeenCalledWith(2, {
        name: 'Сериалы',
        parentId: 1,
      });
    });
  });

  it('should show server error message on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(groupsApi.create).mockRejectedValueOnce({
      response: { data: { message: 'Имя занято' } },
    });

    render(
      <CreateGroupModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        groups={groups}
      />,
    );

    await user.type(screen.getByLabelText(/название/i), 'Дубликат');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Имя занято');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
