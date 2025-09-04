import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiZap } from 'react-icons/fi';
import { Tool } from '../../types';
import { IconWrapper } from '../common/IconWrapper';

interface SidebarProps {
  tools: Tool[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tools,
  searchQuery,
  setSearchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const location = useLocation();

  const filteredTools = useMemo(() => {
    return tools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tools, searchQuery]);

  const toolsByCategory = useMemo(() => {
    const categories: Record<string, Tool[]> = {};
    filteredTools.forEach(tool => {
      if (!categories[tool.category]) {
        categories[tool.category] = [];
      }
      categories[tool.category].push(tool);
    });
    return categories;
  }, [filteredTools]);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="hidden lg:block lg:w-80 lg:h-full lg:relative lg:z-auto">
        <div className="h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700/50 bg-gray-800/50 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <IconWrapper icon={FiZap} className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                AI Tools
              </h2>
            </div>

            {/* Search */}
            <div className="relative">
              <IconWrapper icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl
                         text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-900/50 sidebar-scroll min-h-0">
            {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wide px-2 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryTools.map((tool) => {
                    const isActive = location.pathname === `/app/${tool.path?.replace('/app/', '') || tool.id}`;
                    return (
                      <motion.div
                        key={tool.path || tool.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          to={`/app/${tool.path?.replace('/app/', '') || tool.id}`}
                          className={`
                            flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                            ${isActive 
                              ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50 shadow-lg shadow-purple-500/20' 
                              : 'bg-gray-800/40 hover:bg-gray-700/60 border border-transparent hover:border-gray-600/40 hover:shadow-md'
                            }
                          `}
                        >
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0
                            ${isActive 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                              : 'bg-gray-700/70 text-gray-300 group-hover:bg-gray-600/70 group-hover:text-white'
                            }
                          `}>
                            {tool.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`
                              font-semibold transition-colors truncate text-sm
                              ${isActive ? 'text-white' : 'text-gray-100 group-hover:text-white'}
                            `}>
                              {tool.name}
                            </h4>
                            <p className={`
                              text-xs transition-colors truncate leading-tight mt-0.5
                              ${isActive ? 'text-purple-200' : 'text-gray-400 group-hover:text-gray-300'}
                            `}>
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {filteredTools.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <IconWrapper icon={FiSearch} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 font-medium">No tools found</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : -320,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={`
          lg:hidden fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-80
          transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700/50 bg-gray-800/50 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <IconWrapper icon={FiZap} className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  AI Tools
                </h2>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
              >
                <IconWrapper icon={FiX} className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <IconWrapper icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl
                         text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 bg-gray-900/50 sidebar-scroll">
            {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wide px-2 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryTools.map((tool) => {
                    const isActive = location.pathname === `/app/${tool.path?.replace('/app/', '') || tool.id}`;
                    return (
                      <motion.div
                        key={tool.path || tool.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          to={`/app/${tool.path?.replace('/app/', '') || tool.id}`}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                            ${isActive 
                              ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50 shadow-lg shadow-purple-500/20' 
                              : 'bg-gray-800/40 hover:bg-gray-700/60 border border-transparent hover:border-gray-600/40 hover:shadow-md'
                            }
                          `}
                        >
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0
                            ${isActive 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                              : 'bg-gray-700/70 text-gray-300 group-hover:bg-gray-600/70 group-hover:text-white'
                            }
                          `}>
                            {tool.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`
                              font-semibold transition-colors truncate text-sm
                              ${isActive ? 'text-white' : 'text-gray-100 group-hover:text-white'}
                            `}>
                              {tool.name}
                            </h4>
                            <p className={`
                              text-xs transition-colors truncate leading-tight mt-0.5
                              ${isActive ? 'text-purple-200' : 'text-gray-400 group-hover:text-gray-300'}
                            `}>
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {filteredTools.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <IconWrapper icon={FiSearch} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 font-medium">No tools found</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};
