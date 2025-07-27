import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';

interface ToolUsage {
  userId: string;
  toolId: string;
  toolName: string;
  timestamp: Date;
  input?: string;
  output?: string;
  duration?: number;
}

export const trackToolUsage = async (
  user: User,
  toolId: string,
  toolName: string,
  input?: string,
  output?: string,
  duration?: number
) => {
  try {
    const usageData: ToolUsage = {
      userId: user.uid,
      toolId,
      toolName,
      timestamp: new Date(),
      input,
      output,
      duration,
    };

    await addDoc(collection(db, 'toolUsage'), usageData);
  } catch (error) {
    console.error('Error tracking tool usage:', error);
  }
};

export const getUserToolHistory = async (userId: string, maxResults = 10) => {
  try {
    const q = query(
      collection(db, 'toolUsage'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tool history:', error);
    return [];
  }
};
