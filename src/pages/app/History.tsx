import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiEye, FiTrash2, FiSearch } from 'react-icons/fi';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { IconWrapper } from '../../components/common/IconWrapper';

interface HistoryItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tool: string;
  icon: string;
}

const HistoryItemComponent: React.FC<HistoryItem> = ({ title, description, timestamp, tool, icon }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    whileHover={{ scale: 1.02 }}
    className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-xl">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {title}
          </h3>
          <p className="text-gray-300 text-sm mb-2">
            {description}
          </p>
          <div className="flex items-center gap-2">
            <IconWrapper icon={FiClock} className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {timestamp}
            </span>
            <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
              {tool}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl transition-colors"
          onClick={() => {/* Handle view */}}
        >
          <IconWrapper icon={FiEye} className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-colors"
          onClick={() => {/* Handle delete */}}
        >
          <IconWrapper icon={FiTrash2} className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const History: React.FC = () => {
  const historyItems: HistoryItem[] = [
    {
      id: "1",
      title: "Generated React Component",
      description: "Created a modern dashboard component with TypeScript",
      timestamp: "2 hours ago",
      tool: "AI Code Assistant",
      icon: "🤖"
    },
    {
      id: "2", 
      title: "Compressed Images",
      description: "Optimized 3 images for web performance",
      timestamp: "Yesterday",
      tool: "Image Compressor",
      icon: "🖼️"
    },
    {
      id: "3",
      title: "Background Removed",
      description: "Processed product image for e-commerce",
      timestamp: "2 days ago", 
      tool: "Background Remover",
      icon: "✂️"
    },
    {
      id: "4",
      title: "Generated QR Code",
      description: "Created QR code for website URL",
      timestamp: "3 days ago",
      tool: "QR Generator", 
      icon: "📱"
    }
  ];

  return (
    <>
      <SEOHelmet
        title={seoData.pages.history.title}
        description={seoData.pages.history.description}
        keywords={seoData.pages.history.keywords}
        url="https://aivello.vercel.app/app/history"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950 p-6">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
              Usage History
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Track your AI tool usage and revisit your previous work
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <IconWrapper icon={FiSearch} className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search your history..."
                className="w-full bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl pl-12 pr-6 py-4 text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none transition-colors"
              />
            </div>
          </motion.div>

          {/* History Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {historyItems.length > 0 ? (
              historyItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <HistoryItemComponent {...item} />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-12 text-center"
              >
                <div className="bg-gray-700/40 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <IconWrapper icon={FiClock} className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No History Yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Your tool usage history will appear here once you start using our AI tools.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default History;
