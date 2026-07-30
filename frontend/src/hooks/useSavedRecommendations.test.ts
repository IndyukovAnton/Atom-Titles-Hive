import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders as renderHook } from '@/test/utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/api';
import {
  SAVED_RECS_QUERY_KEY,
  useSavedRecommendations,
} from './useSavedRecommendations';

const API_URL = 'http://localhost:3553';

const mockRow = {
  id: 7,
  userId: 1,
  title: 'Апгрейд',
  type: 'movie',
  status: 'considering',
  whyRecommended: 'AI pick',
  createdAt: '2026-07-29T23:57:19Z',
  updatedAt: '2026-07-29T23:57:19Z',
};

describe('useSavedRecommendations', () => {
  it('loads saved recommendations under the shared query key', async () => {
    server.use(
      http.get(`${API_URL}/library/saved-recommendations`, () =>
        HttpResponse.json([mockRow]),
      ),
    );

    const { result } = renderHook(() => useSavedRecommendations());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockRow]);
    expect(SAVED_RECS_QUERY_KEY).toEqual(['saved-recommendations']);
  });
});
