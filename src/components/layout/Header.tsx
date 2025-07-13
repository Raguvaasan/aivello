import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMenu, FiMoon, FiSun, FiHome } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              <IconWrapper icon={FiMenu} className="h-6 w-6" />
            </button>
            <div className="ml-4 flex items-center space-x-4">
              <Link to="/" className="font-semibold text-xl text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
                <IconWrapper icon={FiHome} className="h-5 w-5" />
              </Link>
              <span className="font-semibold text-xl text-gray-800 dark:text-white">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              {darkMode ? (
                <IconWrapper icon={FiSun} className="h-5 w-5" />
              ) : (
                <IconWrapper icon={FiMoon} className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};
