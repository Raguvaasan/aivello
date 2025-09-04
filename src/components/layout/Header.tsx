import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiMoon, FiSun, FiHome, FiMonitor, FiChevronDown } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile } from '../auth/UserProfile';
import { AivelloIcon } from '../common/AivelloLogo';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = memo(({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: FiSun },
    { value: 'dark' as const, label: 'Dark', icon: FiMoon },
    { value: 'system' as const, label: 'System', icon: FiMonitor },
  ];

  const currentThemeOption = themeOptions.find(option => option.value === theme);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700/50 h-16 shadow-sm dark:shadow-lg">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              aria-label="Toggle sidebar"
            >
              <IconWrapper icon={FiMenu} className="h-6 w-6" />
            </button>
            <div className="ml-4 flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg p-2 transition-all"
                aria-label="Go to homepage"
              >
                <AivelloIcon width={28} height={28} />
                <IconWrapper icon={FiHome} className="h-5 w-5 hidden sm:block" />
              </Link>
              <div className="hidden sm:block">
                <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Advanced Theme Selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                aria-label="Theme selector"
              >
                <IconWrapper 
                  icon={currentThemeOption?.icon || FiSun} 
                  className="h-5 w-5" 
                />
                <IconWrapper 
                  icon={FiChevronDown} 
                  className={`h-3 w-3 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} 
                />
              </motion.button>
              
              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTheme(option.value);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          theme === option.value 
                            ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <IconWrapper icon={option.icon} className="h-4 w-4" />
                        <span className="text-sm font-medium">{option.label}</span>
                        {theme === option.value && (
                          <div className="ml-auto w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="ml-2">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
