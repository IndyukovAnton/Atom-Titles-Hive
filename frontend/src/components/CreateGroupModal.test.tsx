import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import CreateGroupModal from './CreateGroupModal';
import { server } from '../test/mocks/api';
import { http, HttpResponse } from 'msw';
import { config } from '../config/index';

describe('CreateGroupModal', () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render create form correctly', () => {
        render(
            <CreateGroupModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Создать группу')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Создать' })).toBeInTheDocument();
    });

    it('should render edit form correctly', () => {
        render(
            <CreateGroupModal 
                isOpen={true} 
                onClose={onClose} 
                onSuccess={onSuccess}
                initialData={{ id: 1, name: 'Existing Group' }}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Редактировать группу')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Group')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
    });

    it('should submit new group successfully', async () => {
        const user = userEvent.setup();

        render(
            <CreateGroupModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        await user.type(screen.getByLabelText(/название/i), 'New Group');
        await user.click(screen.getByRole('button', { name: 'Создать' }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('should update existing group successfully', async () => {
        const user = userEvent.setup();

        render(
            <CreateGroupModal 
                isOpen={true} 
                onClose={onClose} 
                onSuccess={onSuccess}
                initialData={{ id: 1, name: 'Existing Group' }}
            />
        );

        const input = screen.getByLabelText(/название/i);
        await user.clear(input);
        await user.type(input, 'Updated Group');
        
        await user.click(screen.getByRole('button', { name: 'Сохранить' }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('should handle API error', async () => {
        const user = userEvent.setup();

        server.use(
            http.post(`${config.apiUrl}/groups`, () => {
                return HttpResponse.json(
                    { message: 'Error creating group' },
                    { status: 400 }
                );
            })
        );

        render(
            <CreateGroupModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        await user.type(screen.getByLabelText(/название/i), 'New Group');
        await user.click(screen.getByRole('button', { name: 'Создать' }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Error creating group');
        });
    });

    it('should close on cancel button click', async () => {
        const user = userEvent.setup();

        render(
            <CreateGroupModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        await user.click(screen.getByRole('button', { name: 'Отмена' }));
        
        expect(onClose).toHaveBeenCalled();
    });
});
