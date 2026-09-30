import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserData } from '../types/firestore';

// User operations
export const createUserDocument = async (userData: Omit<UserData, 'createdAt' | 'lastLogin'>) => {
  const userRef = doc(db, 'users', userData.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Only create if the document doesn't exist
    const now = Timestamp.now();
    await setDoc(userRef, {
      ...userData,
      createdAt: now,
      lastLogin: now,
      preferences: {
        // 'system' matches the ThemeProvider default. Changed from the Profile page and
        // applied on first sign-in on a new device (see AuthContext).
        theme: 'system',
      }
    });
  }
};

export const updateUserLastLogin = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    lastLogin: Timestamp.now()
  });
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() as UserData : null;
};

/** Merges the given preference fields; other preferences are left untouched. */
export const updateUserPreferences = async (
  uid: string,
  preferences: Partial<NonNullable<UserData['preferences']>>
) => {
  const userRef = doc(db, 'users', uid);
  const updates = Object.fromEntries(
    Object.entries(preferences).map(([key, value]) => [`preferences.${key}`, value])
  );
  await updateDoc(userRef, updates);
};
