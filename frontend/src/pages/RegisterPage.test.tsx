import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import RegisterPage from './RegisterPage';
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

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should render registration form', () => {
        render(<RegisterPage />);

        expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Пароль/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Подтвердите пароль/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
    });

    it('should submit form and redirect on success', async () => {
        const user = userEvent.setup();
        render(<RegisterPage />);

        await user.type(screen.getByLabelText(/имя пользователя/i), 'newuser');
        await user.type(screen.getByLabelText(/email/i), 'new@example.com');
        
        // Select password input specifically using startsWith regex or exact match
        await user.type(screen.getByLabelText(/^Пароль/i), 'password123');
        await user.type(screen.getByLabelText(/^Подтвердите пароль/i), 'password123');

        await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('should validate password mismatch', async () => {
        const user = userEvent.setup();
        render(<RegisterPage />);

        await user.type(screen.getByLabelText(/^Пароль/i), 'password123');
        await user.type(screen.getByLabelText(/^Подтвердите пароль/i), 'passwordMISMATCH');
        
        await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

        await waitFor(() => {
            // Check for Zod error message usually displayed below input
            // Based on common schema for password mismatch
            expect(screen.getByText(/пароли не совпадают/i)).toBeInTheDocument();
        });
    });

    it('should display error on API failure', async () => {
        const user = userEvent.setup();
        
        server.use(
            http.post(`${config.apiUrl}/auth/register`, () => {
                return HttpResponse.json(
                    { message: 'Username already taken' },
                    { status: 400 }
                );
            })
        );

        render(<RegisterPage />);

        await user.type(screen.getByLabelText(/имя пользователя/i), 'takenuser');
        await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
        await user.type(screen.getByLabelText(/^Пароль/i), 'password123');
        await user.type(screen.getByLabelText(/^Подтвердите пароль/i), 'password123');

        await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

        await waitFor(() => {
            expect(screen.getByText('Username already taken')).toBeInTheDocument();
        });
    });
});
