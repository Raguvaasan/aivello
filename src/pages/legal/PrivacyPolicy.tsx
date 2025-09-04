import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLock, FiEye, FiShield } from 'react-icons/fi';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { IconWrapper } from '../../components/common/IconWrapper';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SEOHelmet
        title={seoData.pages.privacy.title}
        description={seoData.pages.privacy.description}
        keywords={seoData.pages.privacy.keywords}
        url="https://aivello.vercel.app/privacy"
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
                <IconWrapper icon={FiLock} className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
                Privacy Policy
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Your privacy is important to us. Learn how we protect and handle your data.
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
                  <IconWrapper icon={FiEye} className="w-6 h-6 text-purple-400" />
                  1. Information We Collect
                </h2>
                <p className="leading-relaxed mb-4">We collect information to provide better services to all our users. This includes:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-300">
                  <li>Information you provide, such as your name and email address</li>
                  <li>Usage data to improve our AI tools and services</li>
                  <li>Technical information like device type and browser version</li>
                  <li>Content you create or upload for processing by our AI tools</li>
                </ul>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                  <IconWrapper icon={FiShield} className="w-6 h-6 text-purple-400" />
                  2. How We Use Information
                </h2>
                <p className="leading-relaxed mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-300">
                  <li>Provide, maintain, and improve our AI-powered services</li>
                  <li>Process your requests and deliver personalized experiences</li>
                  <li>Develop new AI tools and enhance existing ones</li>
                  <li>Communicate with you about updates and new features</li>
                  <li>Ensure security and prevent misuse of our services</li>
                </ul>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">3. Information Sharing</h2>
                <p className="leading-relaxed mb-4">We do not share personal information with companies, organizations and individuals outside of AiVello unless one of the following circumstances applies:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-300">
                  <li>With your explicit consent</li>
                  <li>For external processing with our trusted AI service partners (with strict data protection agreements)</li>
                  <li>For legal reasons when required by law</li>
                  <li>To protect the rights, property, or safety of AiVello, our users, or the public</li>
                </ul>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
                <p className="leading-relaxed">We work hard to protect AiVello and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold. Our security measures include encryption, secure data centers, and regular security audits of our AI processing systems.</p>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">5. AI Data Processing</h2>
                <p className="leading-relaxed">When you use our AI tools, your content is processed to provide the requested service. We do not store or use your content to train our AI models without your explicit consent. Most processing happens in real-time and content is not permanently stored on our servers.</p>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
                <p className="leading-relaxed mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-300">
                  <li>Access, update, or delete your personal information</li>
                  <li>Request a copy of your data</li>
                  <li>Opt-out of certain data processing activities</li>
                  <li>Contact us with any privacy concerns or questions</li>
                </ul>
              </section>

              <section className="bg-gray-700/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/50">
                <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
                <p className="leading-relaxed">We may update our Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "last modified" date.</p>
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

export default PrivacyPolicy;
