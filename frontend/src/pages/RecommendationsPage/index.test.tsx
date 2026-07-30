import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import RecommendationsPage from './index';
import { server, mockUser } from '@/test/mocks/api';
import { useAuthStore } from '@/store/authStore';
import type { RecommendationItem } from '@/api/recommendations';

const API_URL = 'http://localhost:3553';

// Стаб модалки: «успешное создание» и «отмена» без прогона всей формы.
// Порядок onSuccess → onClose повторяет useMediaForm.
vi.mock('@/components/AddMediaModal', () => ({
  default: ({
    isOpen,
    onSuccess,
    onClose,
  }: {
    isOpen: boolean;
    onSuccess: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <button
          onClick={() => {
            onSuccess();
            onClose();
          }}
        >
          __modal_success__
        </button>
        <button onClick={onClose}>__modal_close__</button>
      </div>
    ) : null,
}));

// Секции не тестируем: нужен только прокидываемый наверх onAdd.
vi.mock('@/pages/RecommendationsPage/AiAssistantSection', () => ({
  AiAssistantSection: ({
    onAdd,
  }: {
    onAdd: (item: RecommendationItem, savedRecId?: number) => void;
  }) => (
    <div>
      <button onClick={() => onAdd({ title: 'Saved card' }, 42)}>
        __add_saved__
      </button>
      <button onClick={() => onAdd({ title: 'Plain card' })}>
        __add_plain__
      </button>
    </div>
  ),
}));
vi.mock('@/pages/RecommendationsPage/TopRatedSection', () => ({
  TopRatedSection: () => null,
}));
vi.mock('@/pages/RecommendationsPage/GenresSection', () => ({
  GenresSection: () => null,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

async function openAiTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole('tab', { name: /ai-ассистент/i }),
  );
}

describe('RecommendationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { ...mockUser, hasCompletedOnboarding: true },
      isAuthenticated: true,
      token: 'mock-token',
    });
    server.use(
      http.delete(
        `${API_URL}/library/saved-recommendations/:id`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  });

  it('deletes the pinned recommendation after adding its card to the library', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi.fn();
    server.use(
      http.delete(
        `${API_URL}/library/saved-recommendations/:id`,
        ({ params }) => {
          deleteSpy(Number(params.id));
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    render(<RecommendationsPage />);
    await openAiTab(user);

    await user.click(await screen.findByText('__add_saved__'));
    await user.click(await screen.findByText('__modal_success__'));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(42));
  });

  it('does not delete anything for a non-pinned card', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi.fn();
    server.use(
      http.delete(
        `${API_URL}/library/saved-recommendations/:id`,
        ({ params }) => {
          deleteSpy(Number(params.id));
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    render(<RecommendationsPage />);
    await openAiTab(user);

    await user.click(await screen.findByText('__add_plain__'));
    await user.click(await screen.findByText('__modal_success__'));

    await waitFor(() =>
      expect(screen.queryByText('__modal_success__')).not.toBeInTheDocument(),
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('forgets the pinned id when the modal is cancelled', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi.fn();
    server.use(
      http.delete(
        `${API_URL}/library/saved-recommendations/:id`,
        ({ params }) => {
          deleteSpy(Number(params.id));
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    render(<RecommendationsPage />);
    await openAiTab(user);

    // Открыли с закреплённой карточкой, но отменили — id должен сброситься.
    await user.click(await screen.findByText('__add_saved__'));
    await user.click(await screen.findByText('__modal_close__'));

    // Следующее «пустое» добавление не должно ничего удалять.
    await user.click(await screen.findByText('__add_plain__'));
    await user.click(await screen.findByText('__modal_success__'));

    await waitFor(() =>
      expect(screen.queryByText('__modal_success__')).not.toBeInTheDocument(),
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
