import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export const useThemeStore = create()(persist((set) => ({
    theme: 'light',
    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    setTheme: (theme) => set({ theme }),
}), {
    name: 'titles-tracker-theme-storage',
    storage: createJSONStorage(() => localStorage),
    onRehydrateStorage: () => (state) => {
        if (state) {
            // Принудительно обновляем DOM
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(state.theme);
        }
    }
}));
