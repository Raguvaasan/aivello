import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';
import { Tool } from '../../types';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  tools: Tool[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tools,
  searchQuery,
  setSearchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const location = useLocation();
  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`fixed md:sticky top-0 left-0 z-40 h-full w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg md:shadow-none transition-transform duration-300 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 overflow-y-auto`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between md:justify-start mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Aivello
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <IconWrapper icon={FiX} className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <nav className="space-y-1">
          {filteredTools.map((tool, index) => (
            <Link
              key={tool.name}
              to={`/app/${tool.id}`}
              onClick={() => setIsSidebarOpen(false)}
              className={`block w-full ${
                location.pathname === `/app/${tool.id}`
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium"
              >
                <span className="mr-3">{tool.icon}</span>
                {tool.name}
              </motion.div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};
