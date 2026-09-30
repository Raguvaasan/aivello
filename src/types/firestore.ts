import { Timestamp } from 'firebase/firestore';

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  preferences?: {
    // Was typed as the literal 'light', so this field could never hold the value a
    // user actually picked. Matches the Theme union in context/ThemeContext.tsx.
    theme: 'light' | 'dark' | 'system';
  }
}
