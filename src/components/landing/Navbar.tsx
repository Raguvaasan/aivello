import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiMoon, FiSun } from 'react-icons/fi';
import { tools } from '../../data/tools';
import { useTheme } from '../../context/ThemeContext';
import { IconWrapper } from '../common/IconWrapper';
import { AivelloIcon } from '../common/AivelloLogo';

interface NavbarProps {
  onEnterApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onEnterApp }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed w-full z-50 bg-gray-900/80 backdrop-blur-sm"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <AivelloIcon width={40} height={40} />
            <h1 className="text-2xl font-bold text-white">Aivello</h1>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-gray-300 hover:text-white transition cursor-pointer"
              >
                Features
              </button>
              <div className="relative group">
                <button className="text-gray-300 hover:text-white transition">
                  Tools
                </button>
                <div className="absolute top-full right-0 w-48 py-2 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {tools.slice(0, 3).map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => navigate(tool.path, { replace: true })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {tool.name}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={() => navigate('/app', { replace: true })}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    View All Tools
                  </button>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <IconWrapper icon={FiSun} className="h-5 w-5" />
                ) : (
                  <IconWrapper icon={FiMoon} className="h-5 w-5" />
                )}
              </motion.button>
              <button
                onClick={onEnterApp}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
              >
                Launch App
              </button>
            </div>
          </div>
          
          <div className="md:hidden flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              title={darkMode ? 'Dark Mode' : 'Light Mode'}
            >
              {darkMode ? (
                <IconWrapper icon={FiMoon} className="h-4 w-4" />
              ) : (
                <IconWrapper icon={FiSun} className="h-4 w-4" />
                
              )}
            </motion.button>
            <button
              onClick={onEnterApp}
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition"
            >
              Launch App
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
