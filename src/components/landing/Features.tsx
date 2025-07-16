import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';
import { useNavigate } from 'react-router-dom';
import { tools } from '../../data/tools';

export const Features: React.FC = () => {
  const navigate = useNavigate();
  const highlightedTools = tools.slice(0, 4);
  
  const features = [
    {
      title: 'AI Tools Collection',
      description: 'Access over 10+ powerful AI tools in one place'
    },
    {
      title: 'Easy to Use',
      description: 'Simple and intuitive interface for all users'
    },
    {
      title: 'Free Access',
      description: 'Most tools are free to use without any subscription'
    },
    {
      title: 'No Sign Up Required',
      description: 'Start using tools instantly without registration'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-800 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to enhance your productivity
          </p>
        </motion.div>          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-700 rounded-xl p-6 hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => navigate('/app', { replace: true })}
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <IconWrapper icon={FiCheck} className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Popular Tools
            </h2>
            <p className="text-gray-400 text-lg">
              Start with our most used AI tools
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlightedTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => navigate(tool.path, { replace: true })}
                className="bg-gray-700 rounded-xl p-6 hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-2xl">{tool.icon}</div>
                  <h3 className="text-xl font-semibold text-white">{tool.name}</h3>
                </div>
                <p className="text-gray-400">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
