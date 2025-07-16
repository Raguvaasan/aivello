import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconWrapper } from '../common/IconWrapper';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { SEOHelmet } from '../common/SEOHelmet';
import { seoData } from '../../data/seoData';

export const Login: React.FC = () => {
  const { signInWithGoogle, signInWithGithub, user, loading: authLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const navigate = useNavigate();

  // Auto redirect if user is already logged in
  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/app', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) {
      console.log('Google sign-in already in progress, ignoring click');
      return; // Prevent double clicks
    }
    
    console.log('Starting Google sign-in...');
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();
      console.log('Google sign-in successful:', result);
      // Navigation will happen through useEffect when user state updates
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setIsSigningIn(false);
    }
  };

  const handleGithubSignIn = async () => {
    if (isSigningIn) {
      console.log('Github sign-in already in progress, ignoring click');
      return; // Prevent double clicks
    }
    
    console.log('Starting Github sign-in...');
    setIsSigningIn(true);
    try {
      const result = await signInWithGithub();
      console.log('Github sign-in successful:', result);
      // Navigation will happen through useEffect when user state updates
    } catch (error) {
      console.error('Error signing in with Github:', error);
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <SEOHelmet
        title={seoData.pages.login.title}
        description={seoData.pages.login.description}
        keywords={seoData.pages.login.keywords}
        url="https://aivello.vercel.app/login"
      />
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
            disabled={isSigningIn}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-800"></div>
            ) : (
              <IconWrapper icon={FcGoogle} className="h-6 w-6" />
            )}
            <span className="text-gray-800 font-medium">
              {isSigningIn ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          <button
            onClick={handleGithubSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <IconWrapper icon={FaGithub} className="h-6 w-6 text-white" />
            )}
            <span className="text-white font-medium">
              {isSigningIn ? 'Signing in...' : 'Continue with GitHub'}
            </span>
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
    </>
  );
};
