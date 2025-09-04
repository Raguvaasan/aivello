import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiZap, FiStar } from 'react-icons/fi';
import { tools } from '../../data/tools';
import { IconWrapper } from '../../components/common/IconWrapper';

export const AppHome: React.FC = () => {
  const categories = Array.from(new Set(tools.map(tool => tool.category)));
  const featuredTools = tools.slice(0, 6); // First 6 tools as featured

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/50 to-gray-950 p-6">
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
            Welcome to AiVello
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your productivity with our comprehensive suite of AI-powered tools
          </p>
        </motion.div>

        {/* Featured Tools Section */}
        {featuredTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-2xl">
                <IconWrapper icon={FiTrendingUp} className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Featured Tools
              </h2>
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1 rounded-full">
                <span className="text-purple-300 text-sm font-medium">🔥 Top Picks</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Link
                    to={tool.path}
                    className="group block"
                  >
                    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-700/40 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-xl mr-4">
                          <span className="text-2xl">{tool.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {tool.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <IconWrapper icon={FiStar} className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-gray-400">Featured</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
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
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-3 rounded-2xl">
                  <IconWrapper icon={FiZap} className="w-6 h-6 text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {category}
                </h2>
                <div className="bg-gray-700/30 px-3 py-1 rounded-full">
                  <span className="text-gray-400 text-sm">
                    {tools.filter(tool => tool.category === category).length} tools
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        className="group block"
                      >
                        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 hover:bg-gray-700/30 hover:border-gray-600/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                          <div className="flex items-center mb-4">
                            <div className="bg-gray-700/40 p-3 rounded-xl mr-4 group-hover:bg-gray-600/40 transition-colors">
                              <span className="text-2xl">{tool.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white group-hover:text-gray-200 transition-colors">
                                {tool.name}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
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
