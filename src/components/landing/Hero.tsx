import React from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiArrowRight, FiPlay, FiStar } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';

interface HeroProps {
  onEnterApp: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onEnterApp }) => {
  return (
    <section className="relative pt-20 sm:pt-24 pb-24 sm:pb-40 overflow-hidden">
      {/* Modern Gradient Background with Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-indigo-950 dark:via-purple-900 dark:to-pink-900">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05' class='dark:fill-purple'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Trending Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 dark:border-purple-400/40 rounded-full px-4 py-2 mb-6 backdrop-blur-sm"
            >
              <IconWrapper icon={FiStar} className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-purple-400">20+ AI Tools • Free Forever</span>
            </motion.div>

            {/* Main Headline with Gradient Text */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1]">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 dark:from-purple dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <span className="text-gray-900 dark:text-purple">
                Productivity
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 dark:from-purple-400 dark:via-pink-400 dark:to-yellow-400 bg-clip-text text-transparent">
                Revolution
              </span>
            </h1>

            {/* Modern Subtitle */}
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Transform your workflow with our suite of cutting-edge AI tools. From content creation to business automation — all in one platform, completely free.
            </p>

            {/* Modern CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEnterApp}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-purple px-8 py-4 rounded-2xl font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 min-w-[200px]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <IconWrapper icon={FiZap} className="w-5 h-5" />
                  Start Creating Now
                  <IconWrapper icon={FiArrowRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEnterApp}
                className="group flex items-center gap-2 text-gray-900 dark:text-purple-400 px-6 py-4 rounded-2xl font-medium border border-gray-300 dark:border-purple/20 hover:border-gray-400 dark:hover:border-purple/40 bg-purple/60 dark:bg-purple/5 hover:bg-purple/80 dark:hover:bg-purple/10 backdrop-blur-sm transition-all duration-300 min-w-[200px] justify-center"
              >
                <IconWrapper icon={FiPlay} className="w-4 h-4" />
                Watch Demo
              </motion.button>
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-12 flex items-center gap-8 justify-center lg:justify-start text-sm text-gray-600 dark:text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-purple dark:border-gray-900"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-purple dark:border-gray-900"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-400 border-2 border-purple dark:border-gray-900"></div>
                </div>
                <span>10K+ Users</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★★★★★</span>
                <span>4.9/5 Rating</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Modern Visual Element */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            {/* Floating Tool Cards */}
            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-4 bg-purple/80 dark:bg-gradient-to-r dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-sm border border-gray-200 dark:border-purple/10 rounded-2xl p-4 w-48 shadow-lg dark:shadow-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-purple font-medium text-sm">AI Content</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Generate instantly</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-20 right-0 bg-purple/80 dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-sm border border-gray-200 dark:border-purple/10 rounded-2xl p-4 w-44 shadow-lg dark:shadow-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    🎨
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-purple font-medium text-sm">Design Tools</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Create amazing</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-40 left-12 bg-purple/80 dark:bg-gradient-to-r dark:from-green-500/20 dark:to-blue-500/20 backdrop-blur-sm border border-gray-200 dark:border-purple/10 rounded-2xl p-4 w-52 shadow-lg dark:shadow-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    📊
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-purple font-medium text-sm">Business Tools</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Scale efficiently</p>
                  </div>
                </div>
              </motion.div>

              {/* Central Glow Effect */}
              <div className="w-64 h-64 mx-auto bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
