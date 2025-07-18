import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onEnterApp: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onEnterApp }) => {
  return (
    <section className="relative pt-16 sm:pt-20 pb-20 sm:pb-32 bg-gray-900 dark:bg-gray-950 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              All-in-One AI Tools Platform
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 dark:text-gray-500 mb-6 sm:mb-8 leading-relaxed">
              Access powerful AI tools for content creation, productivity, and more. 
              No sign-up required, start using now!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 sm:space-y-0">
              <button
                onClick={onEnterApp}
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Get Started
              </button>
              <button
                onClick={onEnterApp}
                className="border-2 border-gray-600 dark:border-gray-700 text-gray-400 dark:text-gray-500 px-6 sm:px-8 py-3 rounded-full font-medium hover:border-gray-500 dark:hover:border-gray-600 hover:text-gray-300 dark:hover:text-gray-400 transition-colors w-full sm:w-auto min-h-[48px] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Learn More
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* <div className="relative z-10">
              <img
                src="/hero-image.png"
                alt="AI Tools Preview"
                className="rounded-lg shadow-2xl"
              />
            </div> */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
