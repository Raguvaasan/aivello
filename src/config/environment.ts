/**
 * Environment configuration.
 *
 * Variables keep their historical REACT_APP_* names (see envPrefix in vite.config.ts)
 * so deployments configured for Create React App keep working. Only prefixed
 * variables are bundled; anything secret must stay unprefixed and server-side.
 */

interface Config {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  env: 'development' | 'production' | 'test';
}

type EnvKey = keyof ImportMetaEnv & `REACT_APP_${string}`;

const env = import.meta.env;
const isTest = env.MODE === 'test';

const getEnvVar = (key: EnvKey, required = true): string => {
  const value = env[key];

  // Missing Firebase config must not crash the whole app at import time: the landing
  // page and every client-side tool work without it. Firebase features report the
  // problem when they are first used instead.
  if (required && !value && !isTest && env.DEV) {
    console.error(`Missing required environment variable: ${key} (see .env.example)`);
  }

  return typeof value === 'string' ? value : '';
};

const resolveEnv = (): Config['env'] => {
  const explicit = env.REACT_APP_ENV;
  if (explicit === 'development' || explicit === 'production' || explicit === 'test') return explicit;
  if (isTest) return 'test';
  return env.PROD ? 'production' : 'development';
};

const config: Config = {
  firebase: {
    apiKey: getEnvVar('REACT_APP_FIREBASE_API_KEY'),
    authDomain: getEnvVar('REACT_APP_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('REACT_APP_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('REACT_APP_FIREBASE_STORAGE_BUCKET', false),
    messagingSenderId: getEnvVar('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', false),
    appId: getEnvVar('REACT_APP_FIREBASE_APP_ID'),
    measurementId: getEnvVar('REACT_APP_FIREBASE_MEASUREMENT_ID', false),
  },
  env: resolveEnv(),
};

export const isFirebaseConfigured = Boolean(config.firebase.apiKey && config.firebase.projectId);

export default config;
