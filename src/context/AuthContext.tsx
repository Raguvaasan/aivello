import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut
} from '@firebase/auth';
import toast from 'react-hot-toast'
import { auth } from '../config/firebase';
import { createUserDocument, updateUserLastLogin } from '../utils/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          // Create or update user document
          await createUserDocument({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          });
          await updateUserLastLogin(user.uid);
        } catch (error) {
          console.error('Error updating user data:', error);
        }
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      toast.error("This email is already linked with GitHub login.")
    } else if (error.code === 'auth/popup-closed-by-user') {
      toast.error("Popup closed. Please try again.")
    } else {
      toast.error("Google login failed. Try again.")
    }

    console.error("Error signing in with Google:", error)
  }
  };

  const signInWithGithub = async () => {
  try {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (error: any) {
  if (error.code === 'auth/account-exists-with-different-credential') {
    toast.error("This email is already registered using a different provider.")
  } else {
    toast.error("GitHub login failed. Try again.")
  }
  console.error("Error signing in with GitHub:", error)
  }
};


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithGithub,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
