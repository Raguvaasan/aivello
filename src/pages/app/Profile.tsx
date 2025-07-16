import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';

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
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-2xl p-8 shadow-xl"
      >
        <div className="flex items-center space-x-6 mb-8">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl text-white">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {user?.displayName || 'User'}
            </h1>
            <p className="text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Account Created</label>
                <p className="text-white">July 13, 2025</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Last Login</label>
                <p className="text-white">Today</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Provider</label>
                <p className="text-white">
                  {user?.providerData[0]?.providerId === 'google.com'
                    ? 'Google'
                    : 'GitHub'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Theme</label>
                <select className="w-full bg-gray-800 text-white rounded-lg px-4 py-2">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Notifications</label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="form-checkbox" />
                  <span className="text-white">Enable email notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <p className="text-gray-400">No recent activity</p>
        </div>
      </motion.div>
    </div>
    </>
  );
};
