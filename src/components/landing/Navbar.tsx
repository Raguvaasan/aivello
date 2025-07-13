import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tools } from '../../data/tools';

interface NavbarProps {
  onEnterApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onEnterApp }) => {
  const navigate = useNavigate();
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed w-full z-50 bg-gray-900/80 backdrop-blur-sm"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
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
                    <a
                      key={tool.id}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(tool.path, { replace: true });
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {tool.name}
                    </a>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/app', { replace: true });
                    }}
                    className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    View All Tools →
                  </a>
                </div>
              </div>
              <button
                onClick={onEnterApp}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
              >
                Launch App
              </button>
            </div>
          </div>
          
          <div className="md:hidden">
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
