import { useState, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import type { UserPreferences } from '../api/auth';
import {
  PersonalizationContext,
  type Theme,
  type AddEntryPreviewStyle,
  type SavePreferencesOverrides,
} from './PersonalizationContextDefinition';

const DEFAULT_BACKGROUND = 'default';
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_FONT_FAMILY = 'Inter';
const DEFAULT_ADD_ENTRY_PREVIEW_STYLE: AddEntryPreviewStyle = 'mirror';

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuthStore();
  const [theme, setThemeState] = useState<Theme>(() => {
    const fromUser = user?.preferences?.theme;
    if (fromUser === 'light' || fromUser === 'dark') return fromUser;
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
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

  const [addEntryPreviewStyle, setAddEntryPreviewStyleState] = useState<AddEntryPreviewStyle>(
    () => (user?.preferences?.addEntryPreviewStyle as AddEntryPreviewStyle | undefined) || DEFAULT_ADD_ENTRY_PREVIEW_STYLE
  );

  const [aiKey, setAiKeyState] = useState<string>('');
  
  const [privacySettings, setPrivacySettingsState] = useState({
    shareWatchHistory: false,
    shareBirthDate: false,
  });

  // Synchronize local state with user profile when user changes
  const [lastUserPref, setLastUserPref] = useState(user?.preferences);
  if (user?.preferences !== lastUserPref) {
    setLastUserPref(user?.preferences);
    if (user?.preferences) {
      const prefs = user.preferences;
      if (prefs.theme === 'light' || prefs.theme === 'dark') setThemeState(prefs.theme);
      if (prefs.background) setBackgroundState(prefs.background);
      if (prefs.fontSize) setFontSizeState(prefs.fontSize);
      if (prefs.fontFamily) setFontFamilyState(prefs.fontFamily);

      if (prefs.addEntryPreviewStyle === 'mirror' || prefs.addEntryPreviewStyle === 'poster') {
        setAddEntryPreviewStyleState(prefs.addEntryPreviewStyle);
      }

      if (prefs.privacySettings) {
        setPrivacySettingsState({
          shareWatchHistory: prefs.privacySettings.shareWatchHistory ?? false,
          shareBirthDate: prefs.privacySettings.shareBirthDate ?? false,
        });
      }
    }
  }

  // Load secure key from localStorage when user changes
  const [lastUserId, setLastUserId] = useState(user?.id);
  if (user?.id !== lastUserId) {
    setLastUserId(user?.id);
    if (user?.id) {
       const savedKey = localStorage.getItem(`ai_secure_key_${user.id}`);
       setAiKeyState(savedKey || '');
    }
  }


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

  // Применение семейства шрифта — через CSS-переменную, чтобы Tailwind font-sans
  // тоже подхватывал выбранный шрифт (см. --font-sans в @theme inline в index.css).
  useEffect(() => {
    const stack = `'${fontFamily}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    document.documentElement.style.setProperty('--font-app', stack);
    document.documentElement.style.fontFamily = stack;
  }, [fontFamily]);

  // Применение фона
  useEffect(() => {
    document.body.setAttribute('data-background', background);
  }, [background]);

  // Восстановление кастомного шрифта
  useEffect(() => {
      const customFontCss = localStorage.getItem('custom_font_css');
      if (customFontCss) {
          const style = document.createElement('style');
          style.textContent = customFontCss;
          document.head.appendChild(style);
      }
  }, []);

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

  const setAiKey = (key: string) => {
      setAiKeyState(key);
  };

  const setAddEntryPreviewStyle = (style: AddEntryPreviewStyle) => {
      setAddEntryPreviewStyleState(style);
  };

  const setPrivacySettings = (settings: { shareWatchHistory: boolean; shareBirthDate: boolean }) => {
      setPrivacySettingsState(settings);
  };

  const savePreferences = async (overrides?: SavePreferencesOverrides) => {
    // Безопасно сохраняем ключ локально
    if (user?.id) {
        if (aiKey) {
            localStorage.setItem(`ai_secure_key_${user.id}`, aiKey);
        } else {
            localStorage.removeItem(`ai_secure_key_${user.id}`);
        }
    }

    const preferences: UserPreferences = {
      theme,
      background,
      fontSize,
      fontFamily,
      privacySettings,
      addEntryPreviewStyle,
      // Overrides позволяют слою выше сохранить значения, которые ещё не успели
      // прокатиться в context state (например draft в AppearanceTab).
      ...overrides,
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
        aiKey,
        addEntryPreviewStyle,
        privacySettings,
        toggleTheme,
        setTheme,
        setBackground,
        setFontSize,
        setFontFamily,
        setAiKey,
        setAddEntryPreviewStyle,
        setPrivacySettings,
        savePreferences,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
}






