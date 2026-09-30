import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Auth, AuthProvider as FirebaseAuthProvider, UserCredential } from 'firebase/auth';
import toast from 'react-hot-toast';
import { User } from '../types/user';
import { REMOTE_THEME_EVENT } from './ThemeContext';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** True once Firebase has reported the auth state at least once. */
  initialized: boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithGithub: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  /**
   * Starts the Firebase Auth SDK if it is not running yet. Pages that need to know
   * the signed-in user (the app shell, login) call this on mount; marketing pages do
   * not, so anonymous visitors never download the auth SDK.
   */
  ensureAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Set on sign-in and cleared on sign-out. Lets a returning signed-in user's session
 * be restored on any page, while a first-time visitor to "/" skips the ~270KB auth
 * SDK entirely. Firebase keeps the real session in IndexedDB; this is only a hint.
 */
const SESSION_HINT_KEY = 'aivello_has_session';

const readSessionHint = (): boolean => {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

const writeSessionHint = (signedIn: boolean) => {
  try {
    if (signedIn) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Storage blocked: the session is still restored whenever the app shell loads.
  }
};

let authPromise: Promise<{ auth: Auth; sdk: typeof import('firebase/auth') }> | null = null;

/** Loads config/firebase and the auth SDK exactly once, on demand. */
const loadAuth = () => {
  if (!authPromise) {
    authPromise = Promise.all([import('../config/firebase'), import('firebase/auth')]).then(
      ([firebase, sdk]) => ({ auth: firebase.auth, sdk })
    );
    authPromise.catch(() => {
      // Allow a retry after a transient chunk-load failure (flaky network, deploy).
      authPromise = null;
    });
  }
  return authPromise;
};

const firebaseErrorCode = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // With no session hint we already know the visitor is signed out, so there is
  // nothing to wait for. With a hint, stay "loading" until Firebase confirms.
  const [loading, setLoading] = useState<boolean>(readSessionHint);
  const [initialized, setInitialized] = useState(false);
  const started = useRef(false);
  const unsubscribe = useRef<(() => void) | null>(null);
  // Bumped on unmount so a load that resolves after cleanup (StrictMode re-mounts in
  // development) does not attach a second, leaked listener.
  const generation = useRef(0);

  const ensureAuth = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setLoading(true);
    const gen = ++generation.current;

    loadAuth()
      .then(({ auth, sdk }) => {
        if (gen !== generation.current) return;
        unsubscribe.current = sdk.onAuthStateChanged(auth, async (firebaseUser) => {
          const appUser = firebaseUser as User | null;
          // No hint yet means this device has not seen this session before.
          const isNewOnThisDevice = appUser !== null && !readSessionHint();
          writeSessionHint(appUser !== null);
          setUser(appUser);
          setLoading(false);
          setInitialized(true);

          if (appUser) {
            // Profile sync is best-effort and must not block sign-in: a Firestore
            // outage would otherwise lock everyone out of the app.
            try {
              const { createUserDocument, updateUserLastLogin } = await import('../utils/firestore');
              await createUserDocument({
                uid: appUser.uid,
                displayName: appUser.displayName,
                email: appUser.email,
                photoURL: appUser.photoURL,
              });
              await updateUserLastLogin(appUser.uid);

              if (isNewOnThisDevice) {
                const { getUserData } = await import('../utils/firestore');
                const saved = (await getUserData(appUser.uid))?.preferences?.theme;
                if (saved && saved !== 'system') {
                  window.dispatchEvent(new CustomEvent(REMOTE_THEME_EVENT, { detail: saved }));
                }
              }
            } catch (error) {
              logger.error('Failed to sync user profile', error);
            }
          }
        });
      })
      .catch((error) => {
        started.current = false;
        setLoading(false);
        setInitialized(true);
        logger.error('Failed to load authentication', error);
      });
  }, []);

  useEffect(() => {
    if (readSessionHint()) ensureAuth();
    return () => {
      generation.current += 1;
      started.current = false;
      unsubscribe.current?.();
      unsubscribe.current = null;
    };
  }, [ensureAuth]);

  const signInWith = useCallback(
    async (providerName: 'google' | 'github'): Promise<UserCredential> => {
      ensureAuth();
      const { auth, sdk } = await loadAuth();
      const provider: FirebaseAuthProvider =
        providerName === 'google' ? new sdk.GoogleAuthProvider() : new sdk.GithubAuthProvider();

      try {
        // The user is picked up by onAuthStateChanged.
        return await sdk.signInWithPopup(auth, provider, sdk.browserPopupRedirectResolver);
      } catch (error) {
        const code = firebaseErrorCode(error);
        if (code === 'auth/account-exists-with-different-credential') {
          toast.error('This email is already registered with a different sign-in provider.');
        } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          toast.error('Sign-in popup closed. Please try again.');
        } else if (code === 'auth/popup-blocked') {
          toast.error('Your browser blocked the sign-in popup. Please allow popups and retry.');
        } else if (code === 'auth/network-request-failed') {
          toast.error('Network error. Check your connection and try again.');
        } else {
          toast.error(`${providerName === 'google' ? 'Google' : 'GitHub'} sign-in failed. Try again.`);
        }
        throw error;
      }
    },
    [ensureAuth]
  );

  const signInWithGoogle = useCallback(() => signInWith('google'), [signInWith]);
  const signInWithGithub = useCallback(() => signInWith('github'), [signInWith]);

  const logout = useCallback(async () => {
    try {
      const { auth, sdk } = await loadAuth();
      await sdk.signOut(auth);
      writeSessionHint(false);
    } catch (error) {
      logger.error('Sign out failed', error);
      toast.error('Could not sign you out. Please try again.');
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, initialized, signInWithGoogle, signInWithGithub, logout, ensureAuth }),
    [user, loading, initialized, signInWithGoogle, signInWithGithub, logout, ensureAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
