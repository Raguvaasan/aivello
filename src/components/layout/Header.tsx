import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMenu, FiMoon, FiSun, FiHome } from 'react-icons/fi';
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
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
      <div className="px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-none"
              aria-label="Toggle sidebar"
            >
              <IconWrapper icon={FiMenu} className="h-6 w-6" />
            </button>
            <div className="ml-2 sm:ml-4 flex items-center space-x-2 sm:space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                aria-label="Go to homepage"
              >
                <AivelloIcon width={24} height={24} />
                <IconWrapper icon={FiHome} className="h-5 w-5 hidden sm:block" />
              </Link>
              <span className="font-semibold text-lg sm:text-xl text-gray-800 dark:text-white">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <IconWrapper icon={FiSun} className="h-5 w-5" />
              ) : (
                <IconWrapper icon={FiMoon} className="h-5 w-5" />
              )}
            </motion.button>
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
});
