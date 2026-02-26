import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeId, Theme, THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/types/theme';

interface ThemeContextValue {
  currentTheme: ThemeId;
  theme: Theme;
  availableThemes: Theme[];
  isChanging: boolean;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_TRANSITION_DURATION = 200; // ms - matches CSS transition

function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'high-contrast')) {
      return stored as ThemeId;
    }
  } catch {
    // localStorage not available
  }
  
  return DEFAULT_THEME;
}

function applyTheme(themeId: ThemeId) {
  const root = document.documentElement;
  
  // Remove all theme classes
  root.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
  root.removeAttribute('data-theme');
  
  // Apply new theme
  root.classList.add(`theme-${themeId}`);
  root.setAttribute('data-theme', themeId);
  
  // Update color-scheme for browser UI
  if (themeId === 'light') {
    root.style.colorScheme = 'light';
  } else {
    root.style.colorScheme = 'dark';
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    // Initialize with stored theme or provided default
    return getStoredTheme() || defaultTheme || DEFAULT_THEME;
  });
  const [isChanging, setIsChanging] = useState(false);

  const setTheme = useCallback((themeId: ThemeId) => {
    if (themeId === currentTheme) return;
    
    // Start loading state
    setIsChanging(true);
    
    // Apply theme immediately
    setCurrentTheme(themeId);
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // localStorage not available
    }
    
    applyTheme(themeId);
    
    // Clear loading state after transition completes
    setTimeout(() => {
      setIsChanging(false);
    }, THEME_TRANSITION_DURATION);
  }, [currentTheme]);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Apply initial theme immediately to prevent flash
  useEffect(() => {
    const storedTheme = getStoredTheme();
    if (storedTheme !== currentTheme) {
      setCurrentTheme(storedTheme);
    }
    applyTheme(storedTheme);
  }, []);

  const value: ThemeContextValue = {
    currentTheme,
    theme: THEMES[currentTheme],
    availableThemes: Object.values(THEMES),
    isChanging,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Export for cases where hook can't be used
export { ThemeContext };
