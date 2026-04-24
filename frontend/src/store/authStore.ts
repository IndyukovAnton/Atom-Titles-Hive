import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, type UserProfile } from '../api/auth';
import { AxiosError } from 'axios';
import { logger } from '../utils/logger';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  isServerAvailable: boolean;
  setServerAvailable: (available: boolean) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setToken: (token: string) => Promise<void>;
}

interface ApiErrorResponse {
  message: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isServerAvailable: true,

      setServerAvailable: (available) => set({ isServerAvailable: available }),

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ username, password });
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error: err.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ username, email, password });
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({
            error: err.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      clearError: () => set({ error: null }),

      initializeAuth: async () => {
        const { token } = get();
        if (token) {
          try {
            const userData = await authApi.getProfile();
            set({ user: userData, isAuthenticated: true, isServerAvailable: true });
          } catch (e) {
            logger.error('Failed to fetch profile', e);
            const err = e as AxiosError;
            if (err.code === 'ERR_NETWORK' || !err.response) {
              set({ isServerAvailable: false });
            } else {
              get().logout();
            }
          }
        }
      },

      updateProfile: async (data: Partial<UserProfile>) => {
        try {
          const updatedUser = await authApi.updateProfile(data);
          set({ user: updatedUser });
        } catch (error) {
          const err = error as AxiosError<ApiErrorResponse>;
          set({ error: err.response?.data?.message || 'Failed to update profile' });
          throw error;
        }
      },

      setToken: async (token: string) => {
        set({ token, isAuthenticated: true });
        await get().initializeAuth();
      },
    }),
    {
      name: 'atom-titles-hive-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist ONLY the token. User data is fetched on init.
      partialize: (state) => ({ 
        token: state.token, 
      }),
    }
  )
);
