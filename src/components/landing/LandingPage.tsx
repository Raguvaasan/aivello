import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Features } from './Features';
import { Hero } from './Hero';
import { Navbar } from './Navbar';
import { SEOHelmet } from '../common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { motion } from 'framer-motion';
import { FiGithub, FiTwitter, FiMail, FiHeart } from 'react-icons/fi';
import { IconWrapper } from '../common/IconWrapper';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigate = () => {
    navigate('/app', { replace: true });
  };

  return (
    <>
      <SEOHelmet
        title={seoData.homepage.title}
        description={seoData.homepage.description}
        keywords={seoData.homepage.keywords}
        url="https://aivello.vercel.app/"
        structuredData={seoData.homepage.structuredData}
      />
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950">
        <Navbar onEnterApp={handleNavigate} />
        <Hero onEnterApp={handleNavigate} />
        <Features />
        
        {/* Modern Footer */}
        <footer className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-white/10 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="container mx-auto px-6 py-16 relative z-10">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6"
                >
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent mb-4">
                    Aivello
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                    Empowering creators and professionals with cutting-edge AI tools. 
                    Transform your workflow and unlock your creative potential.
                  </p>
                </motion.div>
                
                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex items-center gap-4"
                >
                  <a 
                    href="https://github.com/Raguvaasan/aivello" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
                  >
                    <IconWrapper icon={FiGithub} className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://twitter.com/aivello" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
                  >
                    <IconWrapper icon={FiTwitter} className="w-5 h-5" />
                  </a>
                  <a 
                    href="mailto:hello@aivello.com"
                    className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
                  >
                    <IconWrapper icon={FiMail} className="w-5 h-5" />
                  </a>
                </motion.div>
              </div>
              
              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={handleNavigate}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      All Tools
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        const featuresSection = document.getElementById('features');
                        if (featuresSection) {
                          featuresSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Features
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/pricing')}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Pricing
                    </button>
                  </li>
                  <li>
                    <a 
                      href="https://github.com/Raguvaasan/aivello/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Updates
                    </a>
                  </li>
                </ul>
              </motion.div>
              
              {/* Legal Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={() => navigate('/privacy')}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigate('/terms')}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Terms of Service
                    </button>
                  </li>
                  <li>
                    <a 
                      href="https://github.com/Raguvaasan/aivello"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Open Source
                    </a>
                  </li>
                  <li>
                    <a 
                      href="mailto:support@aivello.com"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Support
                    </a>
                  </li>
                </ul>
              </motion.div>
            </div>
            
            {/* Bottom Section */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <p className="text-gray-400 text-sm flex items-center gap-2">
                © 2025 Aivello. Made with 
                <IconWrapper icon={FiHeart} className="w-4 h-4 text-red-400" />
                for creators worldwide.— Raguvaasan
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>v2.0.0</span>
                <span>•</span>
                <span>20+ AI Tools</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  All Systems Operational
                </span>
              </div>
            </motion.div>
          </div>
        </footer>
      </div>
    </>
  );
};
