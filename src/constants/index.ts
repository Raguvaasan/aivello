/**
 * Application constants
 */

export const APP_NAME = 'Aivello';
export const APP_DESCRIPTION = 'Free AI-powered daily tools for everyone';

export const ROUTES = {
  HOME: '/',
  APP: '/app',
  LOGIN: '/login',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  TOOLS: {
    GRAMMAR_CHECKER: '/app/grammar-checker',
    PDF_TO_WORD: '/app/pdf-to-word',
    QR_GENERATOR: '/app/qr-generator',
    TEXT_TO_SPEECH: '/app/text-to-speech',
    IMAGE_COMPRESSOR: '/app/image-compressor',
    READ_TIME: '/app/read-time',
    WORD_COUNTER: '/app/word-counter',
    BG_REMOVER: '/app/bg-remover',
    RESUME_BUILDER: '/app/resume-builder',
    YOUTUBE_THUMBNAIL: '/app/youtube-thumbnail',
  },
} as const;

export const TOOL_CATEGORIES = {
  WRITING: 'Writing',
  MEDIA: 'Media',
  DOCUMENT: 'Document',
  UTILITY: 'Utility',
  AUDIO: 'Audio',
} as const;

export const API_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf'],
  REQUEST_TIMEOUT: 30000, // 30 seconds
} as const;

export const LOCAL_STORAGE_KEYS = {
  DARK_MODE: 'darkMode',
  USER_PREFERENCES: 'userPreferences',
  TOOL_HISTORY: 'toolHistory',
} as const;

export const TOAST_MESSAGES = {
  SUCCESS: {
    FILE_PROCESSED: 'File processed successfully!',
    SETTINGS_SAVED: 'Settings saved successfully!',
    DOWNLOAD_READY: 'Download ready!',
  },
  ERROR: {
    FILE_TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type selected',
    NETWORK_ERROR: 'Network error. Please check your connection',
    GENERIC_ERROR: 'Something went wrong. Please try again',
    API_KEY_MISSING: 'Service configuration error. Please contact support',
  },
  LOADING: {
    PROCESSING: 'Processing your request...',
    UPLOADING: 'Uploading file...',
    GENERATING: 'Generating result...',
  },
} as const;

export default {
  APP_NAME,
  APP_DESCRIPTION,
  ROUTES,
  TOOL_CATEGORIES,
  API_LIMITS,
  LOCAL_STORAGE_KEYS,
  TOAST_MESSAGES,
};
