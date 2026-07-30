import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import AddMediaModal from './AddMediaModal';
import { server } from '../test/mocks/api';
import { http, HttpResponse } from 'msw';
import { config } from '../config/index';
import type { MediaEntry } from '@/api/media';

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

        // Step 1: Info → «Далее» существует только на этом шаге
        await user.type(screen.getByLabelText(/что добавим/i), 'New Movie');
        await user.click(screen.getByRole('button', { name: /далее/i }));

        // Step 2: Details
        await waitFor(() => {
            expect(screen.getByLabelText(/заметки и впечатления/i)).toBeInTheDocument();
        });

        // Step 3: Media — переход через таб навигации (footer-«Далее» здесь нет)
        await user.click(screen.getByRole('button', { name: /^медиа$/i }));
        await waitFor(() => {
            // selector='label': слово «Обложка» также встречается в описании диалога
            expect(screen.getByText('Обложка', { selector: 'label' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /создать/i }));

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
        await user.click(screen.getByRole('button', { name: /^медиа$/i }));
        await waitFor(() => screen.getByText('Обложка', { selector: 'label' }));

        await user.click(screen.getByRole('button', { name: /создать/i }));

        // Текст ошибки рендерится внутри MediaStep
        await waitFor(() => {
            expect(screen.getByText('Failed to create')).toBeInTheDocument();
        });
    });

    describe('edit mode', () => {
        const editEntry = {
            id: 1,
            title: 'Existing Movie',
            rating: 7,
            category: 'Movie',
            groupId: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        } as MediaEntry;

        const renderEditModal = () =>
            render(
                <AddMediaModal
                    isOpen={true}
                    onClose={onClose}
                    onSuccess={onSuccess}
                    initialData={editEntry}
                />
            );

        it('shows a separate Save button already on the first step', async () => {
            renderEditModal();

            expect(await screen.findByText('Редактировать запись')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^сохранить$/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /далее/i })).toBeInTheDocument();
        });

        it('Next only navigates between steps without saving', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await screen.findByText('Редактировать запись');
            await user.click(screen.getByRole('button', { name: /далее/i }));

            await waitFor(() => {
                expect(screen.getByLabelText(/заметки и впечатления/i)).toBeInTheDocument();
            });
            expect(onSuccess).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
            expect(screen.getByRole('button', { name: /^сохранить$/i })).toBeInTheDocument();
        });

        it('saves directly from the first step', async () => {
            const user = userEvent.setup();
            renderEditModal();

            await screen.findByText('Редактировать запись');
            await user.click(screen.getByRole('button', { name: /^сохранить$/i }));

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalled();
                expect(onClose).toHaveBeenCalled();
            });
        });
    });

    describe('add from recommendations', () => {
        it('treats prefilled data without id as creation and forwards ai source', async () => {
            let capturedBody: Record<string, unknown> | undefined;
            server.use(
                http.post(`${config.getApiUrl()}/media`, async ({ request }) => {
                    capturedBody = (await request.json()) as Record<string, unknown>;
                    return HttpResponse.json({ id: 2 }, { status: 201 });
                })
            );

            const user = userEvent.setup();
            render(
                <AddMediaModal
                    isOpen={true}
                    onClose={onClose}
                    onSuccess={onSuccess}
                    initialData={
                        {
                            title: 'AI Pick',
                            rating: 5,
                            category: 'Movie',
                            source: 'ai',
                        } as MediaEntry
                    }
                />
            );

            // Без id это создание: заголовок и кнопка «Создать», а не режим редактирования
            expect(await screen.findByText('Добавить новую запись')).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: /далее/i }));
            await waitFor(() => screen.getByLabelText(/заметки и впечатления/i));
            await user.click(screen.getByRole('button', { name: /создать/i }));

            await waitFor(() => {
                expect(capturedBody).toMatchObject({ title: 'AI Pick', source: 'ai' });
            });
        });
    });
});
