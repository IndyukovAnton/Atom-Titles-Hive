import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import FavoritesPage from './index';
import { server, mockUser } from '@/test/mocks/api';
import { useAuthStore } from '@/store/authStore';

const API_URL = 'http://localhost:3553';

const mockRec = {
  id: 5,
  userId: 1,
  title: 'Тёмный рыцарь',
  originalTitle: null,
  type: 'movie',
  year: 2008,
  genres: ['Action'],
  whyRecommended: 'Рекомендация AI',
  estimatedRating: 9,
  releasedRecently: false,
  posterUrl: null,
  sourceModel: null,
  status: 'favorited',
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

describe('FavoritesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { ...mockUser, hasCompletedOnboarding: true },
      isAuthenticated: true,
      token: 'mock-token',
    });
  });

  it('removes the saved recommendation after adding it to the library', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi.fn();
    server.use(
      http.get(`${API_URL}/library/saved-recommendations`, () =>
        HttpResponse.json([mockRec]),
      ),
      http.get(`${API_URL}/library/favorites`, () => HttpResponse.json([])),
      http.delete(
        `${API_URL}/library/saved-recommendations/:id`,
        ({ params }) => {
          deleteSpy(Number(params.id));
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    render(<FavoritesPage />);

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
});
