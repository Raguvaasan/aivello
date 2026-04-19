import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiZap, FiStar, FiArrowRight } from 'react-icons/fi';
import { tools } from '../../data/tools';
import { IconWrapper } from '../../components/common/IconWrapper';

export const AppHome: React.FC = () => {
  const categories = Array.from(new Set(tools.map(tool => tool.category)));
  const featuredTools = tools.slice(0, 6);

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
            Welcome to AiVello
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your productivity with our comprehensive suite of AI-powered tools
          </p>
        </motion.div>

        {/* Featured Tools Section */}
        {featuredTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 md:mb-16"
          >
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-600/20 dark:to-pink-600/20 p-3 rounded-2xl">
                <IconWrapper icon={FiTrendingUp} className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Featured Tools
              </h2>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-600/20 dark:to-pink-600/20 px-3 py-1 rounded-full">
                <span className="text-purple-700 dark:text-purple-300 text-xs sm:text-sm font-medium">🔥 Top Picks</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featuredTools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Link
                    to={tool.path}
                    className="group block h-full"
                  >
                    <div className="h-full bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/50 rounded-2xl p-5 md:p-6 hover:bg-purple-50/80 dark:hover:bg-gray-700/40 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-600/20 dark:to-pink-600/20 p-3 rounded-xl mr-4 group-hover:from-purple-200 group-hover:to-pink-200 dark:group-hover:from-purple-500/30 dark:group-hover:to-pink-500/30 transition-all">
                          <span className="text-2xl">{tool.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors truncate">
                            {tool.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <IconWrapper icon={FiStar} className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Featured</span>
                          </div>
                        </div>
                        <IconWrapper icon={FiArrowRight} className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Categories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + categoryIndex * 0.1 }}
              className="mb-10 md:mb-12"
            >
              <div className="flex items-center gap-3 mb-5 md:mb-6">
                <div className="bg-gray-100 dark:bg-gradient-to-br dark:from-gray-700/50 dark:to-gray-800/50 p-3 rounded-2xl">
                  <IconWrapper icon={FiZap} className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-gray-300" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {category}
                </h2>
                <div className="bg-gray-100 dark:bg-gray-700/30 px-3 py-1 rounded-full">
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {tools.filter(tool => tool.category === category).length} tools
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {tools
                  .filter(tool => tool.category === category)
                  .map((tool, toolIndex) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + categoryIndex * 0.1 + toolIndex * 0.05 }}
                    >
                      <Link
                        to={tool.path}
                        className="group block h-full"
                      >
                        <div className="h-full bg-white/60 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/30 rounded-2xl p-5 md:p-6 hover:bg-purple-50/60 dark:hover:bg-gray-700/30 hover:border-purple-200 dark:hover:border-gray-600/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                          <div className="flex items-center mb-4">
                            <div className="bg-gray-100 dark:bg-gray-700/40 p-3 rounded-xl mr-4 group-hover:bg-purple-100 dark:group-hover:bg-gray-600/40 transition-colors">
                              <span className="text-2xl">{tool.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-gray-200 transition-colors truncate">
                                {tool.name}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
