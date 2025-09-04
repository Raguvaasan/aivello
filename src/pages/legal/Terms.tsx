import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiShield, FiFileText } from 'react-icons/fi';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { IconWrapper } from '../../components/common/IconWrapper';

const Terms: React.FC = () => {
  return (
    <>
      <SEOHelmet
        title={seoData.pages.terms.title}
        description={seoData.pages.terms.description}
        keywords={seoData.pages.terms.keywords}
        url="https://aivello.vercel.app/terms"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 py-20">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 md:p-12"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl mb-6">
                <IconWrapper icon={FiFileText} className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
                Terms of Service
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Please read these terms carefully before using AiVello's services
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-8 text-gray-300"
            >
              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <IconWrapper icon={FiShield} className="w-6 h-6 text-purple-400" />
                  1. Introduction
                </h2>
                <p className="leading-relaxed">Welcome to AiVello. By using our service, you agree to these terms. Please read them carefully. These terms govern your use of our AI-powered productivity tools and services.</p>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">2. Using our Services</h2>
                <p className="leading-relaxed">You must follow any policies made available to you within the Services. You may use our Services only as permitted by law. We may suspend or stop providing our Services to you if you do not comply with our terms or policies or if we detect any misuse of our AI tools.</p>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">3. Privacy and Copyright Protection</h2>
                <p className="leading-relaxed">
                  Our <Link to="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors duration-200 font-medium underline decoration-purple-400/50">privacy policy</Link> explains how we treat your personal data and protect your privacy when you use our Services. We are committed to protecting your data and ensuring transparency in our AI processing.
                </p>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">4. Your Content in our Services</h2>
                <p className="leading-relaxed">You retain ownership of any intellectual property rights that you hold in the content you submit or upload to our Services. We process your content only to provide the requested AI services and do not use it for training our models without explicit consent.</p>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">5. Usage Limits and Fair Use</h2>
                <p className="leading-relaxed">We may set limits on the use of our Services to protect our systems and ensure reliable service for all users. Free tier users have specific usage quotas, while premium subscribers enjoy higher limits and priority processing.</p>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">6. AI-Generated Content</h2>
                <p className="leading-relaxed">Content generated by our AI tools is provided "as-is" and should be reviewed before use. While we strive for accuracy, AI-generated content may contain errors or biases. Users are responsible for verifying and validating any AI-generated content before use.</p>
              </section>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 pt-8 border-t border-gray-700/50"
            >
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors duration-200 font-medium"
              >
                <IconWrapper icon={FiArrowLeft} className="w-5 h-5" />
                Back to Home
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Terms;
