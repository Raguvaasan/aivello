/**
 * Environment configuration utility
 * Validates and provides access to environment variables
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
  apiKeys: {
    removeBg: string;
  };
  env: 'development' | 'production' | 'test';
}

const getEnvVar = (key: string, required: boolean = true): string => {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || '';
};

const config: Config = {
  firebase: {
    apiKey: getEnvVar('REACT_APP_FIREBASE_API_KEY'),
    authDomain: getEnvVar('REACT_APP_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('REACT_APP_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('REACT_APP_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('REACT_APP_FIREBASE_APP_ID'),
    measurementId: getEnvVar('REACT_APP_FIREBASE_MEASUREMENT_ID'),
  },
  apiKeys: {
    removeBg: getEnvVar('REACT_APP_REMOVE_BG_API_KEY'),
  },
  env: (getEnvVar('REACT_APP_ENV', false) as Config['env']) || 'development',
};

// Validate configuration on load
const validateConfig = (): void => {
  const requiredKeys = [
    'firebase.apiKey',
    'firebase.authDomain', 
    'firebase.projectId',
    'apiKeys.removeBg'
  ];

  for (const key of requiredKeys) {
    const value = key.split('.').reduce((obj, k) => obj[k], config as any);
    if (!value) {
      console.error(`Missing configuration for: ${key}`);
    }
  }
};

// Only validate in development to avoid console errors in production
if (config.env === 'development') {
  validateConfig();
}

export default config;
