import React, { useEffect, useId, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiZap } from 'react-icons/fi';
import { Tool } from '../../types';
import { categories } from '../../data/tools';
import { IconWrapper } from '../common/IconWrapper';

interface SidebarProps {
  tools: Tool[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

interface SidebarContentProps {
  toolsByCategory: [string, Tool[]][];
  hasResults: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigate?: () => void;
  onClose?: () => void;
}

/**
 * Shared by the desktop rail and the mobile drawer. These used to be two ~120-line
 * copies that had already drifted apart (only one closed on navigation).
 */
const SidebarContent: React.FC<SidebarContentProps> = ({
  toolsByCategory,
  hasResults,
  searchQuery,
  setSearchQuery,
  onNavigate,
  onClose,
}) => {
  const { pathname } = useLocation();
  const searchId = useId();

  return (
    <div className="h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700/50 shadow-sm dark:shadow-2xl flex flex-col">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/50 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <IconWrapper icon={FiZap} className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Tools</h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close tools menu"
              className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
            >
              <IconWrapper icon={FiX} className="w-5 h-5 text-gray-700 dark:text-white" />
            </button>
          )}
        </div>

        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Search tools
          </label>
          <IconWrapper
            icon={FiSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          />
          <input
            id={searchId}
            type="search"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      <nav aria-label="Tools" className="flex-1 overflow-y-auto p-4 space-y-6 bg-white/50 dark:bg-gray-900/50 sidebar-scroll min-h-0">
        {toolsByCategory.map(([category, categoryTools]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider px-2 mb-2">
              {category}
            </h3>
            <ul className="space-y-1.5">
              {categoryTools.map((tool) => {
                const isActive = pathname === tool.path;
                return (
                  <li key={tool.id}>
                    <Link
                      to={tool.path}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors duration-200 group border ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-600/40 dark:to-pink-600/40 border-purple-300 dark:border-purple-400/50 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-800/40 hover:bg-purple-50 dark:hover:bg-gray-700/60 border-transparent hover:border-purple-200 dark:hover:border-gray-600/40'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow'
                            : 'bg-gray-100 dark:bg-gray-700/70 group-hover:bg-purple-100 dark:group-hover:bg-gray-600/70'
                        }`}
                      >
                        {tool.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block font-semibold truncate text-sm ${
                            isActive ? 'text-purple-900 dark:text-white' : 'text-gray-800 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-white'
                          }`}
                        >
                          {tool.name}
                        </span>
                        <span
                          className={`block text-xs truncate leading-tight mt-0.5 ${
                            isActive ? 'text-purple-700 dark:text-purple-200' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {tool.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {!hasResults && (
          <div className="text-center py-12" role="status">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50">
              <IconWrapper icon={FiSearch} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">No tools found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try a different search term</p>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  tools,
  searchQuery,
  setSearchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const toolsByCategory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups = new Map<string, Tool[]>();
    for (const tool of tools) {
      if (
        q &&
        !tool.name.toLowerCase().includes(q) &&
        !tool.description.toLowerCase().includes(q) &&
        !tool.category.toLowerCase().includes(q)
      ) {
        continue;
      }
      const list = groups.get(tool.category) ?? [];
      list.push(tool);
      groups.set(tool.category, list);
    }
    const order = (category: string) => {
      const index = (categories as readonly string[]).indexOf(category);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return Array.from(groups.entries()).sort(([a], [b]) => order(a) - order(b));
  }, [tools, searchQuery]);

  const hasResults = toolsByCategory.length > 0;

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen, setIsSidebarOpen]);

  const shared = { toolsByCategory, hasResults, searchQuery, setSearchQuery };

  return (
    <>
      <aside className="hidden lg:block lg:w-80 lg:h-full shrink-0" aria-label="Tool navigation">
        <SidebarContent {...shared} />
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              id="mobile-tool-drawer"
              aria-label="Tool navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-16 left-0 z-50 h-[calc(100dvh-4rem)] w-[min(20rem,85vw)]"
            >
              <SidebarContent
                {...shared}
                onNavigate={() => setIsSidebarOpen(false)}
                onClose={() => setIsSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
