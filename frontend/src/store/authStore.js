import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../api/auth';
import { AxiosError } from 'axios';
import { logger } from '../utils/logger';
export const useAuthStore = create()(persist((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isServerAvailable: true,
    setServerAvailable: (available) => set({ isServerAvailable: available }),
    replayTourRequested: false,
    requestTourReplay: () => set({ replayTourRequested: true }),
    clearTourReplayRequest: () => set({ replayTourRequested: false }),
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
        }
        catch (error) {
            const err = error;
            set({
                error: err.response?.data?.message || 'Login failed',
                isLoading: false,
            });
            throw error;
        }
    },
    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.register(data);
            set({
                user: response.user,
                token: response.access_token,
                isAuthenticated: true,
                isLoading: false,
            });
        }
        catch (error) {
            const err = error;
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
            }
            catch (e) {
                logger.error('Failed to fetch profile', e);
                const err = e;
                if (err.code === 'ERR_NETWORK' || !err.response) {
                    set({ isServerAvailable: false });
                }
                else {
                    get().logout();
                }
            }
        }
    },
    updateProfile: async (data) => {
        try {
            const updatedUser = await authApi.updateProfile(data);
            set({ user: updatedUser });
        }
        catch (error) {
            const err = error;
            set({ error: err.response?.data?.message || 'Failed to update profile' });
            throw error;
        }
    },
    setToken: async (token) => {
        set({ token, isAuthenticated: true });
        await get().initializeAuth();
    },
}), {
    name: 'seen-auth-storage',
    storage: createJSONStorage(() => localStorage),
    // Persist ONLY the token. User data is fetched on init.
    partialize: (state) => ({
        token: state.token,
    }),
}));
