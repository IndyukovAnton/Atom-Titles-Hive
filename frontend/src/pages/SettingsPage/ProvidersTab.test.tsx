import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { ProvidersTab } from './ProvidersTab';

const { updateProfile } = vi.hoisted(() => ({ updateProfile: vi.fn() }));

vi.mock('@/store/authStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/authStore')>();
  const state = {
    user: { id: 42, preferences: {} },
    updateProfile,
  };
  const mockStore = Object.assign(
    (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
    {
      getState: () => state,
    },
  );
  return {
    ...actual,
    useAuthStore: mockStore as unknown as typeof actual.useAuthStore,
  };
});

vi.mock('@/hooks/usePersonalization', () => ({
  usePersonalization: () => ({ aiKey: '', setAiKey: vi.fn() }),
}));

describe('ProvidersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    updateProfile.mockResolvedValue(undefined);
  });

  it('renders provider fields and save button', () => {
    render(<ProvidersTab />);

    expect(screen.getByText('Дополнительные провайдеры')).toBeInTheDocument();
    expect(screen.getByLabelText('Провайдер')).toBeInTheDocument();
    expect(screen.getByLabelText('API key')).toBeInTheDocument();
    expect(screen.getByLabelText(/Лимит запросов/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Максимум токенов/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /сохранить/i }),
    ).toBeInTheDocument();
  });

  it('saves provider settings without aiKey in payload', async () => {
    const user = userEvent.setup();
    render(<ProvidersTab />);

    await user.type(screen.getByLabelText('API key'), 'sk-test-123');
    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledTimes(1);
    });

    const payload = updateProfile.mock.calls[0][0] as {
      preferences: Record<string, unknown>;
    };
    expect(payload.preferences).not.toHaveProperty('aiKey');
    expect(localStorage.getItem('ai_secure_key_42')).toBe('sk-test-123');
  });

  it('stores limits in preferences', async () => {
    const user = userEvent.setup();
    render(<ProvidersTab />);

    await user.type(screen.getByLabelText(/Лимит запросов/i), '50');
    await user.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalled();
    });
    const payload = updateProfile.mock.calls[0][0] as {
      preferences: { aiLimits?: { dailyRequests?: number } };
    };
    expect(payload.preferences.aiLimits?.dailyRequests).toBe(50);
  });
});
