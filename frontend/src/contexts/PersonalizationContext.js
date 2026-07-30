import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getPresetFontUrl } from '../constants/fonts';
import { PersonalizationContext, } from './PersonalizationContextDefinition';
const DEFAULT_BACKGROUND = 'default';
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_FONT_FAMILY = 'Nunito';
const DEFAULT_ADD_ENTRY_PREVIEW_STYLE = 'mirror';
export function PersonalizationProvider({ children }) {
    const { user, updateProfile } = useAuthStore();
    const [theme, setThemeState] = useState(() => {
        const fromUser = user?.preferences?.theme;
        if (fromUser === 'light' || fromUser === 'dark')
            return fromUser;
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark')
            return saved;
        return 'dark';
    });
    const [background, setBackgroundState] = useState(() => user?.preferences?.background || DEFAULT_BACKGROUND);
    const [fontSize, setFontSizeState] = useState(() => user?.preferences?.fontSize || DEFAULT_FONT_SIZE);
    const [fontFamily, setFontFamilyState] = useState(() => user?.preferences?.fontFamily || DEFAULT_FONT_FAMILY);
    const [addEntryPreviewStyle, setAddEntryPreviewStyleState] = useState(() => user?.preferences?.addEntryPreviewStyle || DEFAULT_ADD_ENTRY_PREVIEW_STYLE);
    const [aiKey, setAiKeyState] = useState('');
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
            if (prefs.theme === 'light' || prefs.theme === 'dark')
                setThemeState(prefs.theme);
            if (prefs.background)
                setBackgroundState(prefs.background);
            if (prefs.fontSize)
                setFontSizeState(prefs.fontSize);
            if (prefs.fontFamily)
                setFontFamilyState(prefs.fontFamily);
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
    // Применение семейства шрифта: CSS-переменная для Tailwind font-sans
    // (см. --font-sans в @theme inline в index.css) + ленивая подгрузка
    // CSS preset-шрифтов из constants/fonts.
    useEffect(() => {
        const stack = `'${fontFamily}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        document.documentElement.style.setProperty('--font-app', stack);
        document.documentElement.style.fontFamily = stack;
        const url = getPresetFontUrl(fontFamily);
        if (url && !document.querySelector(`link[href="${url}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
        }
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
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };
    const setBackground = (newBackground) => {
        setBackgroundState(newBackground);
    };
    const setFontSize = (newFontSize) => {
        setFontSizeState(newFontSize);
    };
    const setFontFamily = (newFontFamily) => {
        setFontFamilyState(newFontFamily);
    };
    const setAiKey = (key) => {
        setAiKeyState(key);
    };
    const setAddEntryPreviewStyle = (style) => {
        setAddEntryPreviewStyleState(style);
    };
    const setPrivacySettings = (settings) => {
        setPrivacySettingsState(settings);
    };
    const savePreferences = async (overrides) => {
        // Безопасно сохраняем ключ локально
        if (user?.id) {
            if (aiKey) {
                localStorage.setItem(`ai_secure_key_${user.id}`, aiKey);
            }
            else {
                localStorage.removeItem(`ai_secure_key_${user.id}`);
            }
        }
        const preferences = {
            theme,
            background,
            fontSize,
            fontFamily,
            privacySettings,
            addEntryPreviewStyle,
            // Overrides позволяют слою выше сохранить значения, которые ещё не успели
            // прокатиться в context state (например draft в AppearanceTab).
            // aiKey намеренно не отправляется — он живёт только в localStorage.
            ...overrides,
        };
        await updateProfile({ preferences });
    };
    return (_jsx(PersonalizationContext.Provider, { value: {
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
        }, children: children }));
}
