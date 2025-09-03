import React from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiShield, FiUsers, FiTrendingUp, FiCpu, FiGlobe } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';
import { useNavigate } from 'react-router-dom';
import { tools } from '../../data/tools';

export const Features: React.FC = () => {
  const navigate = useNavigate();
  const aiTools = tools.filter(tool => tool.category === 'AI').slice(0, 6);
  const popularTools = tools.slice(0, 8);
  
  const features = [
    {
      icon: FiCpu,
      title: 'AI-Powered Intelligence',
      description: 'Cutting-edge AI models for superior results',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description: 'Instant results with optimized performance',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: FiShield,
      title: 'Privacy First',
      description: 'Your data stays secure and private',
      gradient: 'from-green-500 to-blue-500'
    },
    {
      icon: FiGlobe,
      title: 'Global Access',
      description: 'Available worldwide, 24/7 accessibility',
      gradient: 'from-blue-500 to-purple-500'
    }
  ];

  const stats = [
    { number: '20+', label: 'AI Tools', icon: FiCpu },
    { number: '10K+', label: 'Active Users', icon: FiUsers },
    { number: '99.9%', label: 'Uptime', icon: FiShield },
    { number: '4.9/5', label: 'User Rating', icon: FiTrendingUp }
  ];

  return (
    <>
      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
              Trusted by Creators Worldwide
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join thousands of professionals who rely on our AI tools daily
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <IconWrapper icon={stat.icon} className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AiVello?</span>
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              Experience the future of productivity with our comprehensive AI toolkit
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-0.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center">
                    <IconWrapper icon={feature.icon} className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300 blur-xl`}></div>
              </motion.div>
            ))}
          </div>

          {/* AI Tools Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trending <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Tools</span>
            </h3>
            <p className="text-gray-400 text-lg">
              Discover the most popular AI-powered tools on our platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onClick={() => navigate(tool.path, { replace: true })}
                className="group cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-500/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {tool.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {tool.name}
                    </h4>
                    <span className="text-xs text-purple-400 font-medium px-2 py-1 bg-purple-500/20 rounded-full">
                      {tool.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {tool.description}
                </p>
                
                {/* Trending Badge for AI tools */}
                {tool.category === 'AI' && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    🔥 Hot
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mt-16"
          >
            <button
              onClick={() => navigate('/app', { replace: true })}
              className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                Explore All Tools
                <IconWrapper icon={FiZap} className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
};
