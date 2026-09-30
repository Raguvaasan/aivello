import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from './environment';

const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
  measurementId: config.firebase.measurementId,
};

/**
 * Only imported lazily (auth context, tool tracking, history) so the Firebase SDK is
 * never part of the landing page bundle. Do not import this from eagerly loaded code.
 */
export const app = initializeApp(firebaseConfig);
// initializeAuth (not getAuth) so the popup/redirect iframe is only loaded when a user
// actually clicks "Sign in" - AuthContext passes the resolver to signInWithPopup.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
export const db = getFirestore(app);
