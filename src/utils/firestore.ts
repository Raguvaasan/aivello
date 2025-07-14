import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, Timestamp } from '@firebase/firestore';
import { app } from '../config/firebase';
import { UserData, ToolUsage } from '../types/firestore';

const db = getFirestore(app);

// User operations
export const createUserDocument = async (userData: Omit<UserData, 'createdAt' | 'lastLogin'>) => {
  const userRef = doc(db, 'users', userData.uid);
  const now = Timestamp.now();
  
  await setDoc(userRef, {
    ...userData,
    createdAt: now,
    lastLogin: now,
    preferences: {
      theme: 'light',
      notifications: true
    }
  });
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

export const updateUserPreferences = async (uid: string, preferences: UserData['preferences']) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { preferences });
};

// Tool usage tracking
export const logToolUsage = async (usage: Omit<ToolUsage, 'timestamp'>) => {
  const usageRef = collection(db, 'usage_history');
  await addDoc(usageRef, {
    ...usage,
    timestamp: Timestamp.now()
  });
};
