import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import AddMediaModal from './AddMediaModal';
import { server } from '../test/mocks/api';
import { http, HttpResponse } from 'msw';
import { config } from '../config/index';

// Mock framer-motion unique to this test file
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/hooks/usePersonalization', () => ({
  usePersonalization: () => ({ addEntryPreviewStyle: 'mirror' }),
}));

describe('AddMediaModal', () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(
            <AddMediaModal isOpen={false} onClose={onClose} onSuccess={onSuccess} />
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render form fields on first step when open', async () => {
        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(await screen.findByLabelText(/что добавим/i)).toBeInTheDocument();
        expect(await screen.findByText('Категория', { selector: 'label' })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: /фильм/i })).toBeInTheDocument();
        expect(await screen.findByText('Ваша оценка', { selector: 'label' })).toBeInTheDocument();
    });

    it('renders the live preview updated by the title field', async () => {
        const user = userEvent.setup();
        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        expect(await screen.findByText(/так будет выглядеть/i)).toBeInTheDocument();

        await user.type(screen.getByLabelText(/что добавим/i), 'Inception');
        expect(await screen.findByText('Inception')).toBeInTheDocument();
    });

    it('should navigate through steps and submit form with valid data', async () => {
        const user = userEvent.setup();

        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        // Step 1: Info
        await user.type(screen.getByLabelText(/что добавим/i), 'New Movie');
        
        const nextButton = screen.getByRole('button', { name: /далее/i });
        await user.click(nextButton);

        // Step 2: Details
        await waitFor(() => {
            expect(screen.getByLabelText(/заметки и впечатления/i)).toBeInTheDocument();
        });
        
        const nextButton2 = screen.getByRole('button', { name: /далее/i });
        await user.click(nextButton2);

        // Step 3: Media
        await waitFor(() => {
            expect(screen.getByText(/обложка/i)).toBeInTheDocument();
        });

        const submitButton = screen.getByRole('button', { name: /готово/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('should handle API error on submission', async () => {
        const user = userEvent.setup();

        // Override MSW handler to return error
        server.use(
            http.post(`${config.getApiUrl()}/media`, () => {
                return HttpResponse.json(
                    { message: 'Failed to create' },
                    { status: 400 }
                );
            })
        );

        render(
            <AddMediaModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />
        );

        // Fill info and navigate to final step
        await user.type(screen.getByLabelText(/что добавим/i), 'New Movie');
        await user.click(screen.getByRole('button', { name: /далее/i }));
        
        await waitFor(() => screen.getByLabelText(/заметки и впечатления/i));
        await user.click(screen.getByRole('button', { name: /далее/i }));
        
        await waitFor(() => screen.getByText(/обложка/i));

        const submitButton = screen.getByRole('button', { name: /готово/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Failed to create')).toBeInTheDocument();
        });
    });
});
