import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const API_URL = 'http://localhost:3000/api';

// Mock data
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

export const mockAuthResponse = {
  access_token: 'mock-jwt-token',
  user: mockUser,
};

export const mockMediaEntry = {
  id: 1,
  title: 'Test Media',
  type: 'movie',
  status: 'watching',
  rating: 8,
  notes: 'Test notes',
  startDate: '2024-01-01',
  endDate: null,
  groupId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockGroup = {
  id: 1,
  name: 'Test Group',
  color: '#FF5733',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// API handlers
export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    
    if (body.username === 'testuser' && body.password === 'password') {
      return HttpResponse.json(mockAuthResponse);
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as { username: string; email: string; password: string };
    
    if (body.username && body.email && body.password) {
      return HttpResponse.json(mockAuthResponse);
    }
    
    return HttpResponse.json(
      { message: 'Registration failed' },
      { status: 400 }
    );
  }),

  http.get(`${API_URL}/auth/profile`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Media endpoints
  http.get(`${API_URL}/media`, () => {
    return HttpResponse.json([mockMediaEntry]);
  }),

  http.get(`${API_URL}/media/:id`, ({ params }) => {
    return HttpResponse.json({ ...mockMediaEntry, id: Number(params.id) });
  }),

  http.post(`${API_URL}/media`, async ({ request }) => {
    const body = await request.json() as object;
    return HttpResponse.json({ ...mockMediaEntry, ...body, id: 2 });
  }),

  http.put(`${API_URL}/media/:id`, async ({ request, params }) => {
    const body = await request.json() as object;
    return HttpResponse.json({ ...mockMediaEntry, ...body, id: Number(params.id) });
  }),

  http.delete(`${API_URL}/media/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Groups endpoints
  http.get(`${API_URL}/groups`, () => {
    return HttpResponse.json([mockGroup]);
  }),

  http.post(`${API_URL}/groups`, async ({ request }) => {
    const body = await request.json() as object;
    return HttpResponse.json({ ...mockGroup, ...body, id: 2 });
  }),

  http.put(`${API_URL}/groups/:id`, async ({ request, params }) => {
    const body = await request.json() as object;
    return HttpResponse.json({ ...mockGroup, ...body, id: Number(params.id) });
  }),

  http.delete(`${API_URL}/groups/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Profile endpoints
  http.get(`${API_URL}/profile`, () => {
    return HttpResponse.json(mockUser);
  }),

  http.put(`${API_URL}/profile`, async ({ request }) => {
    const body = await request.json() as object;
    return HttpResponse.json({ ...mockUser, ...body });
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);
