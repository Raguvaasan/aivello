import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconWrapper } from '../common/IconWrapper';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

export const Login: React.FC = () => {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/app', { replace: true });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signInWithGithub();
      navigate('/app', { replace: true });
    } catch (error) {
      console.error('Error signing in with Github:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Welcome to Aivello</h2>
        <p className="text-gray-400 text-center mb-8">
          Access all your favorite AI tools in one place
        </p>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition"
          >
            <IconWrapper icon={FcGoogle} className="h-6 w-6" />
            <span className="text-gray-800 font-medium">Continue with Google</span>
          </button>

          <button
            onClick={handleGithubSignIn}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <IconWrapper icon={FaGithub} className="h-6 w-6 text-white" />
            <span className="text-white font-medium">Continue with GitHub</span>
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-400 text-center">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-blue-400 hover:text-blue-300">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
