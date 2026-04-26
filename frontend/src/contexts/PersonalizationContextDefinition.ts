import { createContext } from 'react';

export type Theme = 'light' | 'dark';
export type AddEntryPreviewStyle = 'mirror' | 'poster';

export interface PersonalizationContextType {
  theme: Theme;
  background: string;
  fontSize: number;
  fontFamily: string;
  aiKey: string;
  addEntryPreviewStyle: AddEntryPreviewStyle;
  privacySettings: {
    shareWatchHistory: boolean;
    shareBirthDate: boolean;
  };
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setBackground: (background: string) => void;
  setFontSize: (fontSize: number) => void;
  setFontFamily: (fontFamily: string) => void;
  setAiKey: (key: string) => void;
  setAddEntryPreviewStyle: (style: AddEntryPreviewStyle) => void;
  setPrivacySettings: (settings: { shareWatchHistory: boolean; shareBirthDate: boolean }) => void;
  savePreferences: (overrides?: SavePreferencesOverrides) => Promise<void>;
}

export interface SavePreferencesOverrides {
  theme?: Theme;
  background?: string;
  fontSize?: number;
  fontFamily?: string;
  privacySettings?: { shareWatchHistory: boolean; shareBirthDate: boolean };
  addEntryPreviewStyle?: AddEntryPreviewStyle;
}

export const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);
