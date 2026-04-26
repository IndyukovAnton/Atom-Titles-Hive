import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { mockAuthResponse, mockUser } from '../test/mocks/api';
import { act } from '@testing-library/react';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { logout } = useAuthStore.getState();
    logout();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const { login } = useAuthStore.getState();
      
      await act(async () => {
        await login('testuser', 'password');
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockAuthResponse.access_token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login failure with invalid credentials', async () => {
      const { login } = useAuthStore.getState();
      
      await act(async () => {
        try {
          await login('wronguser', 'wrongpassword');
        } catch {
          // Expected to throw
        }
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      const { login } = useAuthStore.getState();
      
      const loginPromise = login('testuser', 'password');
      
      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      await act(async () => {
        await loginPromise;
      });
      
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('Register', () => {
    it('should register successfully with valid data', async () => {
      const { register } = useAuthStore.getState();
      
      await act(async () => {
        await register('newuser', 'new@example.com', 'password123');
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockAuthResponse.access_token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle registration failure', async () => {
      const { register } = useAuthStore.getState();
      
      await act(async () => {
        try {
          await register('', '', '');
        } catch {
          // Expected to throw
        }
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });
  });

  describe('Logout', () => {
    it('should clear user data on logout', async () => {
      const { login, logout } = useAuthStore.getState();
      
      // First login
      await act(async () => {
        await login('testuser', 'password');
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then logout
      act(() => {
        logout();
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Clear Error', () => {
    it('should clear error message', async () => {
      const { login, clearError } = useAuthStore.getState();
      
      // Trigger an error
      await act(async () => {
        try {
          await login('wronguser', 'wrongpassword');
        } catch {
          // Expected
        }
      });

      expect(useAuthStore.getState().error).toBeTruthy();
      
      // Clear error
      act(() => {
        clearError();
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('Initialize Auth', () => {
    it('should fetch user profile if token exists', async () => {
      const { login, initializeAuth } = useAuthStore.getState();
      
      // First login to set token
      await act(async () => {
        await login('testuser', 'password');
      });

      // Clear user but keep token (simulating page refresh)
      act(() => {
        useAuthStore.setState({ user: null, isAuthenticated: false });
      });

      // Initialize auth
      await act(async () => {
        await initializeAuth();
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should not fetch profile if no token exists', async () => {
      const { initializeAuth } = useAuthStore.getState();
      
      await act(async () => {
        await initializeAuth();
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should logout on profile fetch failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Manually set an invalid token
      act(() => {
        useAuthStore.setState({ token: 'invalid-token' });
      });

      await act(async () => {
        await useAuthStore.getState().initializeAuth();
      });

      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Persistence', () => {
    it('should persist token to localStorage', async () => {
      const { login } = useAuthStore.getState();
      
      await act(async () => {
        await login('testuser', 'password');
      });

      const storedData = localStorage.getItem('seen-auth-storage');
      expect(storedData).toBeTruthy();
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        expect(parsed.state.token).toBe(mockAuthResponse.access_token);
      }
    });

    it('should not persist user data to localStorage', async () => {
      const { login } = useAuthStore.getState();
      
      await act(async () => {
        await login('testuser', 'password');
      });

      const storedData = localStorage.getItem('seen-auth-storage');
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        expect(parsed.state.user).toBeUndefined();
      }
    });
  });
});
