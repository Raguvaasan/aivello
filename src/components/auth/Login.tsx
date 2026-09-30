import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { IconWrapper } from '../common/IconWrapper';
import { SEOHelmet } from '../common/SEOHelmet';
import { AivelloIcon } from '../common/AivelloLogo';
import { seoData } from '../../data/seoData';

interface LocationState {
  from?: { pathname?: string; search?: string };
}

/** Only same-app paths are allowed as a post-login destination (no open redirect). */
const safeRedirect = (state: unknown): string => {
  const from = (state as LocationState | null)?.from;
  const path = from?.pathname;
  if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && path !== '/login') {
    return path + (from?.search ?? '');
  }
  return '/app';
};

type Provider = 'google' | 'github';

export const Login: React.FC = () => {
  const { signInWithGoogle, signInWithGithub, user, ensureAuth } = useAuth();
  const [pending, setPending] = useState<Provider | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const destination = safeRedirect(location.state);

  useEffect(() => {
    ensureAuth();
  }, [ensureAuth]);

  // Send the user back to where they came from (e.g. Background Remover) once signed in.
  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [user, destination, navigate]);

  const handleSignIn = async (provider: Provider) => {
    if (pending) return; // Prevent double clicks
    setPending(provider);
    try {
      await (provider === 'google' ? signInWithGoogle() : signInWithGithub());
      // Navigation happens in the effect above once the auth state updates.
    } catch {
      // The auth context already showed a toast explaining what went wrong.
      setPending(null);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <SEOHelmet
        title={seoData.pages.login.title}
        description={seoData.pages.login.description}
        keywords={seoData.pages.login.keywords}
        url="https://aivello.vercel.app/login"
        noindex
      />
      <main
        id="main-content"
        className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-purple-950 dark:to-gray-950 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-40 h-40 bg-purple-400/20 dark:bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-56 h-56 bg-pink-400/20 dark:bg-pink-500/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-md bg-white/90 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 p-8 rounded-3xl shadow-2xl"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-300 mb-6 min-h-[44px]"
          >
            <IconWrapper icon={FiArrowLeft} className="w-4 h-4" /> Back to home
          </Link>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <AivelloIcon width={56} height={56} title="" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
              Welcome to Aivello
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to save your usage history and use tools that need an account.
              Most tools work without signing in.
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleSignIn('google')}
              disabled={pending !== null}
              className="w-full min-h-[56px] flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-2xl text-gray-800 font-semibold text-lg shadow hover:shadow-lg hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              {pending === 'google' ? (
                <span className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <IconWrapper icon={FcGoogle} className="h-6 w-6" />
              )}
              <span>{pending === 'google' ? 'Signing in…' : 'Continue with Google'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSignIn('github')}
              disabled={pending !== null}
              className="w-full min-h-[56px] flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 dark:bg-gray-900/80 border border-gray-900 dark:border-gray-600 rounded-2xl text-white font-semibold text-lg shadow hover:shadow-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              {pending === 'github' ? (
                <span className="w-6 h-6 border-2 border-gray-500 border-t-white rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <IconWrapper icon={FaGithub} className="h-6 w-6" />
              )}
              <span>{pending === 'github' ? 'Signing in…' : 'Continue with GitHub'}</span>
            </button>
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium underline-offset-2 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.div>
      </main>
    </MotionConfig>
  );
};
