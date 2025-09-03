import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiMoon, FiSun, FiMenu, FiX, FiArrowRight } from 'react-icons/fi';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const popularTools = tools.slice(0, 6);
  
  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed w-full z-50 bg-gray-900/95 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/')}
            >
              <AivelloIcon width={40} height={40} />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                Aivello
              </h1>
            </motion.div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Features
              </button>
              
              {/* Tools Dropdown */}
              <div className="relative group">
                <button className="text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-1">
                  Tools
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full right-0 w-80 py-4 mt-2 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl">
                  <div className="px-4 mb-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Popular Tools</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 px-4">
                    {popularTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => navigate(tool.path, { replace: true })}
                        className="flex items-center gap-3 p-3 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 group/item"
                      >
                        <span className="text-lg">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tool.name}</p>
                          <p className="text-xs text-gray-500 truncate">{tool.category}</p>
                        </div>
                        <IconWrapper icon={FiArrowRight} className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/10 mt-3 pt-3 px-4">
                    <button
                      onClick={() => navigate('/app', { replace: true })}
                      className="w-full text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:scale-105 transition-transform duration-200"
                    >
                      View All Tools
                    </button>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  const pricingSection = document.getElementById('pricing');
                  if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Pricing
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <IconWrapper icon={FiSun} className="h-5 w-5" />
                ) : (
                  <IconWrapper icon={FiMoon} className="h-5 w-5" />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEnterApp}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
              >
                Launch App
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <IconWrapper icon={FiSun} className="h-5 w-5" />
                ) : (
                  <IconWrapper icon={FiMoon} className="h-5 w-5" />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <IconWrapper icon={isMobileMenuOpen ? FiX : FiMenu} className="h-6 w-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 z-40 bg-gray-900/95 backdrop-blur-md border-b border-white/10 md:hidden"
          >
            <div className="container mx-auto px-6 py-6">
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    const featuresSection = document.getElementById('features');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-300 hover:text-white transition-colors font-medium py-2"
                >
                  Features
                </button>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Popular Tools</p>
                  <div className="grid grid-cols-1 gap-2">
                    {popularTools.slice(0, 4).map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          navigate(tool.path, { replace: true });
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                      >
                        <span className="text-lg">{tool.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tool.name}</p>
                          <p className="text-xs text-gray-500">{tool.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onEnterApp();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25"
                  >
                    Launch App
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
