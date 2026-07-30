import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import HomePage from './HomePage';
import { useAuthStore } from '../store/authStore';
import { mockUser, mockMediaEntry, mockGroup } from '../test/mocks/api';

// Mock router hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Set authenticated user
        useAuthStore.setState({
            user: { ...mockUser, hasCompletedOnboarding: true },
            isAuthenticated: true,
            token: 'mock-token'
        });
    });

    it('should render homepage with user info', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        await waitFor(() => {
            expect(screen.getAllByText(/моя медиатека/i).length).toBeGreaterThan(0);
        });

        // Username живёт внутри дропдауна профиля — открываем меню
        await user.click(screen.getByRole('button', { name: 'Меню пользователя' }));
        expect(await screen.findByText(mockUser.username)).toBeInTheDocument();
    });

    it('should load and display media items', async () => {
        render(<HomePage />);

        await waitFor(() => {
             // Check for mock media title
             expect(screen.getAllByText(mockMediaEntry.title)[0]).toBeInTheDocument();
        });
    });

    it('should load and display groups in sidebar', async () => {
        render(<HomePage />);

        await waitFor(() => {
             expect(screen.getByText(mockGroup.name)).toBeInTheDocument();
        });
    });

    it('should open add media modal', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        // Ждём окончания загрузки, затем жмём кнопку в хедере
        await waitFor(() => expect(screen.queryByText(/загрузка/i)).not.toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: 'Добавить' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText(/добавить новую запись/i)).toBeInTheDocument();
        });
    });

    it('should open create group modal', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        await waitFor(() => expect(screen.queryByText(/загрузка/i)).not.toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: 'Создать группу' }));

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: 'Создать группу' })).toBeInTheDocument();
        });
    });

    it('should handle logout', async () => {
        const user = userEvent.setup();
        render(<HomePage />);

        await waitFor(() => expect(screen.queryByText(/загрузка/i)).not.toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: 'Меню пользователя' }));
        await user.click(await screen.findByRole('menuitem', { name: /выйти/i }));

        await waitFor(() => {
            expect(useAuthStore.getState().isAuthenticated).toBe(false);
            expect(useAuthStore.getState().user).toBeNull();
        });
    });
});
