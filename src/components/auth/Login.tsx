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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4"
            >
              Welcome to AiVello
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-gray-300 text-lg"
            >
              Access all your favorite AI tools in one place
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSigningIn ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full"
                />
              ) : (
                <IconWrapper icon={FcGoogle} className="h-6 w-6" />
              )}
              <span className="text-gray-800 font-semibold text-lg">
                {isSigningIn ? 'Signing in...' : 'Continue with Google'}
              </span>
            </motion.button>

            <motion.button
              onClick={handleGithubSignIn}
              disabled={isSigningIn}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl hover:bg-gray-700/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSigningIn ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full"
                />
              ) : (
                <IconWrapper icon={FaGithub} className="h-6 w-6 text-white" />
              )}
              <span className="text-white font-semibold text-lg">
                {isSigningIn ? 'Signing in...' : 'Continue with GitHub'}
              </span>
            </motion.button>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-sm text-gray-400 text-center leading-relaxed"
          >
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-purple-400 hover:text-purple-300 transition-colors duration-200 font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors duration-200 font-medium">
              Privacy Policy
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </>
  );
};
