import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

/**
 * Dispatched by AuthContext when an account with a saved theme signs in on this device
 * for the first time, so the preference follows the user across devices.
 */
export const REMOTE_THEME_EVENT = 'aivello:remote-theme';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  darkMode: boolean; // Keep for backward compatibility
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleDarkMode: () => void; // Keep for backward compatibility
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';

export const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system';

/**
 * Reads the stored preference. Mirrors the inline bootstrap script in public/index.html,
 * which applies the theme before first paint to avoid a flash of the wrong theme.
 * Keep the two in sync.
 */
const getStoredTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(saved) ? saved : 'system';
  } catch {
    // localStorage throws in private mode / blocked-cookie contexts.
    return 'system';
  }
};

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

  const actualTheme = theme === 'system' ? systemTheme : theme;
  const darkMode = actualTheme === 'dark';

  // The bootstrap script already applied the correct class before paint, so the
  // first run of the effect below must not animate. Only later changes should.
  const isFirstRun = useRef(true);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Preference simply won't persist; not worth surfacing to the user.
    }

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    root.style.colorScheme = actualTheme;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // `.theme-transition` applies a transition to *every* element, so it is added
    // only for the duration of an actual theme switch. Leaving it on would animate
    // colour changes across the whole app on every render.
    root.classList.add('theme-transition');
    const timer = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);

    return () => window.clearTimeout(timer);
  }, [theme, actualTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const onRemoteTheme = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (isTheme(next)) setThemeState(next);
    };
    window.addEventListener(REMOTE_THEME_EVENT, onRemoteTheme);
    return () => window.removeEventListener(REMOTE_THEME_EVENT, onRemoteTheme);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  /**
   * Cycles light -> dark -> system.
   *
   * The old two-way toggle resolved 'system' to a fixed value on first click, which
   * silently opted the user out of following their OS with no way back from the
   * landing page. Cycling keeps 'system' reachable everywhere.
   */
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        actualTheme,
        darkMode,
        setTheme,
        toggleTheme,
        toggleDarkMode: toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
