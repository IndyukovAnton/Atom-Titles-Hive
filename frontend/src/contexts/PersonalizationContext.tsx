import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import type { UserPreferences } from '../api/auth';

type Theme = 'light' | 'dark';

interface PersonalizationContextType {
  theme: Theme;
  background: string;
  fontSize: number;
  fontFamily: string;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setBackground: (background: string) => void;
  setFontSize: (fontSize: number) => void;
  setFontFamily: (fontFamily: string) => void;
  savePreferences: () => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

const DEFAULT_BACKGROUND = 'default';
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_FONT_FAMILY = 'Inter';

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuthStore();
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) return saved;
    // По умолчанию темная тема
    return 'dark';
  });

  const [background, setBackgroundState] = useState<string>(
    () => user?.preferences?.background || DEFAULT_BACKGROUND
  );
  const [fontSize, setFontSizeState] = useState<number>(
    () => user?.preferences?.fontSize || DEFAULT_FONT_SIZE
  );
  const [fontFamily, setFontFamilyState] = useState<string>(
    () => user?.preferences?.fontFamily || DEFAULT_FONT_FAMILY
  );

  // Синхронизация с профилем пользователя
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.background) setBackgroundState(user.preferences.background);
      if (user.preferences.fontSize) setFontSizeState(user.preferences.fontSize);
      if (user.preferences.fontFamily) setFontFamilyState(user.preferences.fontFamily);
    }
  }, [user]);

  // Применение темы
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Применение размера шрифта
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  // Применение семейства шрифта
  useEffect(() => {
    document.documentElement.style.fontFamily = fontFamily;
  }, [fontFamily]);

  // Применение фона
  useEffect(() => {
    document.body.setAttribute('data-background', background);
  }, [background]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setBackground = (newBackground: string) => {
    setBackgroundState(newBackground);
  };

  const setFontSize = (newFontSize: number) => {
    setFontSizeState(newFontSize);
  };

  const setFontFamily = (newFontFamily: string) => {
    setFontFamilyState(newFontFamily);
  };

  const savePreferences = async () => {
    const preferences: UserPreferences = {
      background,
      fontSize,
      fontFamily,
    };

    await updateProfile({ preferences });
  };

  return (
    <PersonalizationContext.Provider
      value={{
        theme,
        background,
        fontSize,
        fontFamily,
        toggleTheme,
        setTheme,
        setBackground,
        setFontSize,
        setFontFamily,
        savePreferences,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext);

  if (context === undefined) {
    throw new Error('usePersonalization must be used within PersonalizationProvider');
  }
  return context;
}

// Обратная совместимость с useTheme
export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = usePersonalization();
  return { theme, toggleTheme, setTheme };
};
