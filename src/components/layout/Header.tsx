import React, { memo, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiMoon, FiSun, FiMonitor, FiChevronDown, FiX } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile } from '../auth/UserProfile';
import { AivelloIcon } from '../common/AivelloLogo';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: FiSun },
  { value: 'dark' as const, label: 'Dark', icon: FiMoon },
  { value: 'system' as const, label: 'System', icon: FiMonitor },
];

export const Header: React.FC<HeaderProps> = memo(({ isSidebarOpen, setIsSidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const themeMenuId = useId();

  const currentThemeOption = themeOptions.find((option) => option.value === theme) ?? themeOptions[2];

  useEffect(() => {
    if (!showThemeMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowThemeMenu(false);
        themeButtonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showThemeMenu]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700/50 h-16 shadow-sm dark:shadow-lg">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 transition-colors"
              aria-label={isSidebarOpen ? 'Close tools menu' : 'Open tools menu'}
              aria-expanded={isSidebarOpen}
              aria-controls="mobile-tool-drawer"
            >
              <IconWrapper icon={isSidebarOpen ? FiX : FiMenu} className="h-6 w-6" />
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
              aria-label="Aivello home"
            >
              <AivelloIcon width={32} height={32} title="" />
              <span className="hidden sm:block font-bold text-lg text-gray-900 dark:text-white">Aivello</span>
            </Link>
            <span className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
            <Link
              to="/app"
              className="hidden sm:block font-semibold text-base bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded"
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" ref={themeMenuRef}>
              <button
                ref={themeButtonRef}
                type="button"
                onClick={() => setShowThemeMenu((open) => !open)}
                className="flex items-center gap-1.5 min-h-[40px] px-2.5 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                aria-label={`Theme: ${currentThemeOption.label}. Change theme`}
                aria-haspopup="menu"
                aria-expanded={showThemeMenu}
                aria-controls={themeMenuId}
              >
                <IconWrapper icon={currentThemeOption.icon} className="h-5 w-5" />
                <IconWrapper
                  icon={FiChevronDown}
                  className={`h-3 w-3 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    id={themeMenuId}
                    role="menu"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={theme === option.value}
                        onClick={() => {
                          setTheme(option.value);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          theme === option.value
                            ? 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <IconWrapper icon={option.icon} className="h-4 w-4" />
                        <span className="text-sm font-medium">{option.label}</span>
                        {theme === option.value && (
                          <span className="ml-auto w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
