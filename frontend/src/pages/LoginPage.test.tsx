import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import { server } from '../test/mocks/api';
import { http, HttpResponse } from 'msw';
import { config } from '../config/index';
// Mock router hooks
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should render login form', () => {
        render(<LoginPage />);

        expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    });

    it('should submit form and redirect on success', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
        await user.type(screen.getByLabelText(/^Пароль/i), 'password');
        await user.click(screen.getByRole('button', { name: /войти/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('should display error on invalid credentials', async () => {
        const user = userEvent.setup();
        
        server.use(
            http.post(`${config.apiUrl}/auth/login`, () => {
                return HttpResponse.json(
                    { message: 'Invalid credentials' },
                    { status: 401 }
                );
            })
        );

        render(<LoginPage />);

        await user.type(screen.getByLabelText(/имя пользователя/i), 'wrong');
        await user.type(screen.getByLabelText(/^Пароль/i), 'wrong');
        await user.click(screen.getByRole('button', { name: /войти/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('should toggle password visibility', async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        const passwordInput = screen.getByLabelText(/^Пароль/i);
        expect(passwordInput).toHaveAttribute('type', 'password');

        const toggleButton = screen.getByLabelText('Показать пароль');
        await user.click(toggleButton);

        expect(passwordInput).toHaveAttribute('type', 'text');
        
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
    });
});
