import { useContext } from 'react';
import { PersonalizationContext } from '../contexts/PersonalizationContextDefinition';

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
