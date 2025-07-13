import React from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onEnterApp: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onEnterApp }) => {
  return (
    <section className="relative pt-20 pb-32 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              All-in-One AI Tools Platform
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Access powerful AI tools for content creation, productivity, and more. 
              No sign-up required, start using now!
            </p>
            <div className="space-x-4">
              <button
                onClick={onEnterApp}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition"
              >
                Get Started
              </button>
              <button
                onClick={onEnterApp}
                className="border-2 border-gray-600 text-gray-400 px-8 py-3 rounded-full font-medium hover:border-gray-500 hover:text-gray-300 transition"
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
            <div className="relative z-10">
              <img
                src="/hero-image.png"
                alt="AI Tools Preview"
                className="rounded-lg shadow-2xl"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
