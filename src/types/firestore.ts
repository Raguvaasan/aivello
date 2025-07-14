import { Timestamp } from '@firebase/firestore';

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
  }
}

export interface ToolUsage {
  uid: string;
  toolId: string;
  timestamp: Timestamp;
  duration: number;
  metadata: {
    inputSize?: number;
    outputSize?: number;
    success: boolean;
  }
}
