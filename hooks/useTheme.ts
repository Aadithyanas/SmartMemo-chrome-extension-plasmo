// src/hooks/useTheme.ts
import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system'; // 'system' for respecting OS preference

const STORAGE_KEY = 'plasmo-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme | undefined>(undefined); // undefined initially

  // Function to apply the 'dark' class to the body
  const applyThemeToBody = useCallback((currentTheme: Theme) => {
    const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (document.body) {
      if (isDark) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }, []);

  // Effect to load theme from storage on mount
  useEffect(() => {
    // Only run in browser environment (not during build/SSR-like stages)
    if (typeof window !== 'undefined' && typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const storedTheme = result[STORAGE_KEY] as Theme || 'system'; // Default to system
        setThemeState(storedTheme);
        applyThemeToBody(storedTheme);
      });
    } else {
      // Fallback for non-browser environments or if chrome.storage is not available
      setThemeState('system'); // Assume system preference
      applyThemeToBody('system');
    }

    // Listener for system theme changes (if 'system' theme is active)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setThemeState(prevTheme => {
        if (prevTheme === 'system') {
          applyThemeToBody('system'); // Re-apply based on new system preference
        }
        return prevTheme;
      });
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [applyThemeToBody]);

  // Function to set theme and persist it
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToBody(newTheme);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY]: newTheme });
    }
  }, [applyThemeToBody]);

  // Determine resolved theme (for display/icons)
  const resolvedTheme = theme === 'system' 
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  return { theme, setTheme, resolvedTheme };
}