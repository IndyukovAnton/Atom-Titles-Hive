import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import ConsiderationsPage from './index';
import { server, mockUser } from '@/test/mocks/api';
import { useAuthStore } from '@/store/authStore';

const API_URL = 'http://localhost:3553';

const mockRec = {
  id: 3,
  userId: 1,
  title: 'Апгрейд',
  originalTitle: null,
  type: 'movie',
  year: 2018,
  genres: ['Action'],
  whyRecommended: 'Рекомендация AI',
  estimatedRating: 8,
  releasedRecently: false,
  posterUrl: null,
  sourceModel: null,
  status: 'considering',
  createdAt: '2026-07-29T23:57:19Z',
  updatedAt: '2026-07-29T23:57:19Z',
};

// Стаб модалки: «успешное создание» без прогона всей формы.
vi.mock('@/components/AddMediaModal', () => ({
  default: ({
    isOpen,
    onSuccess,
  }: {
    isOpen: boolean;
    onSuccess: () => void;
  }) =>
    isOpen ? <button onClick={onSuccess}>__modal_success__</button> : null,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ConsiderationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { ...mockUser, hasCompletedOnboarding: true },
      isAuthenticated: true,
      token: 'mock-token',
    });
  });

  it('removes the recommendation from «Подумаю» after adding it to the library', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi.fn();
    server.use(
      http.get(`${API_URL}/library/considerations`, () =>
        HttpResponse.json([mockRec]),
      ),
      http.delete(
        `${API_URL}/library/saved-recommendations/:id`,
        ({ params }) => {
          deleteSpy(Number(params.id));
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    render(<ConsiderationsPage />);

    // AICard CTA + hover-кнопка страницы носят одинаковое имя — берём первую.
    const [addButton] = await screen.findAllByRole('button', {
      name: 'В библиотеку',
    });
    await user.click(addButton);

    await user.click(await screen.findByText('__modal_success__'));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(mockRec.id));
    await waitFor(() =>
      expect(screen.queryByText(mockRec.title)).not.toBeInTheDocument(),
    );
  });

  it('keeps the recommendation when removal fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API_URL}/library/considerations`, () =>
        HttpResponse.json([mockRec]),
      ),
      http.delete(`${API_URL}/library/saved-recommendations/:id`, () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 }),
      ),
    );

    render(<ConsiderationsPage />);

    const [addButton] = await screen.findAllByRole('button', {
      name: 'В библиотеку',
    });
    await user.click(addButton);
    await user.click(await screen.findByText('__modal_success__'));

    // Ошибка удаления не должна убирать карточку из списка.
    await waitFor(() =>
      expect(screen.getByText(mockRec.title)).toBeInTheDocument(),
    );
  });
});
