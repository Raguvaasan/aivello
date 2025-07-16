import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getAnalytics } from '@firebase/analytics';
import { getPerformance } from '@firebase/performance';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDy5QgDR6sFEACDVU4sVnoLwbIWUV994WA",
  authDomain: "aivello.firebaseapp.com",
  projectId: "aivello",
  storageBucket: "aivello.firebasestorage.app",
  messagingSenderId: "348938270936",
  appId: "1:348938270936:web:d5926ccccd8fe63851ffad",
  measurementId: "G-QVEN2BR2RS"
};

// const firestore = firebase.firestore();
// export { firebase, firestore };
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Initialize Analytics and Performance Monitoring
export const analytics = getAnalytics(app);
export const performance = getPerformance(app);
