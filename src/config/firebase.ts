import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getAnalytics } from '@firebase/analytics';
import { getPerformance } from '@firebase/performance';
import { getFirestore } from 'firebase/firestore';
import config from './environment';

const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
  measurementId: config.firebase.measurementId
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics and Performance Monitoring only in production
export const analytics = config.env === 'production' ? getAnalytics(app) : null;
export const performance = config.env === 'production' ? getPerformance(app) : null;
