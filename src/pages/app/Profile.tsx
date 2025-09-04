import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiSettings, FiActivity, FiShield, FiMail, FiCalendar } from 'react-icons/fi';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { IconWrapper } from '../../components/common/IconWrapper';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <SEOHelmet
        title={seoData.pages.profile.title}
        description={seoData.pages.profile.description}
        keywords={seoData.pages.profile.keywords}
        url="https://aivello.vercel.app/app/profile"
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl"
          >
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-6 mb-8"
            >
              {user?.photoURL ? (
                <div className="relative">
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-24 h-24 rounded-2xl border-2 border-purple-500/30"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 w-8 h-8 rounded-full flex items-center justify-center">
                    <IconWrapper icon={FiUser} className="w-4 h-4 text-white" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-3xl text-white font-bold border-2 border-purple-500/30">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-600">
                    <IconWrapper icon={FiUser} className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                  {user?.displayName || 'User'}
                </h1>
                <div className="flex items-center gap-2 text-gray-300">
                  <IconWrapper icon={FiMail} className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Account Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-xl">
                    <IconWrapper icon={FiShield} className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Account Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-800/40 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <IconWrapper icon={FiCalendar} className="w-4 h-4 text-gray-400" />
                      <label className="text-sm text-gray-400">Account Created</label>
                    </div>
                    <p className="text-white font-medium">July 13, 2025</p>
                  </div>
                  
                  <div className="bg-gray-800/40 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <IconWrapper icon={FiActivity} className="w-4 h-4 text-gray-400" />
                      <label className="text-sm text-gray-400">Last Login</label>
                    </div>
                    <p className="text-white font-medium">Today</p>
                  </div>
                  
                  <div className="bg-gray-800/40 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <IconWrapper icon={FiShield} className="w-4 h-4 text-gray-400" />
                      <label className="text-sm text-gray-400">Provider</label>
                    </div>
                    <p className="text-white font-medium">
                      {user?.providerData[0]?.providerId === 'google.com'
                        ? 'Google'
                        : 'GitHub'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Preferences */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-xl">
                    <IconWrapper icon={FiSettings} className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Preferences</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-800/40 p-4 rounded-xl">
                    <label className="block text-sm text-gray-400 mb-3">Theme</label>
                    <select className="w-full bg-gray-700/50 backdrop-blur-sm border border-gray-600 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors">
                      <option value="light">Light</option>
                      <option value="dark" selected>Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  
                  <div className="bg-gray-800/40 p-4 rounded-xl">
                    <label className="block text-sm text-gray-400 mb-3">Notifications</label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          defaultChecked 
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full relative transition-colors duration-200">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-purple-500 rounded-full transition-transform duration-200 transform translate-x-5"></div>
                        </div>
                      </div>
                      <span className="text-white">Enable email notifications</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 pt-8 border-t border-gray-700/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-3 rounded-xl">
                  <IconWrapper icon={FiActivity} className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              </div>
              
              <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6">
                <div className="text-center">
                  <div className="bg-gray-800/40 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconWrapper icon={FiActivity} className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-lg">No recent activity</p>
                  <p className="text-gray-500 text-sm mt-2">Your tool usage and activity will appear here</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
