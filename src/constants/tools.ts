// Tool Categories
export const TOOL_CATEGORIES = {
  AI: 'AI',
  MEDIA: 'Media',
  WRITING: 'Writing',
  DOCUMENT: 'Document',
  UTILITY: 'Utility',
  AUDIO: 'Audio',
  DESIGN: 'Design',
  BUSINESS: 'Business',
} as const;

// Tool IDs
export const TOOL_IDS = {
  BG_REMOVER: 'bg-remover',
  PDF_TO_WORD: 'pdf-to-word',
  QR_GENERATOR: 'qr-generator',
  TEXT_TO_SPEECH: 'text-to-speech',
  GRAMMAR_CHECKER: 'grammar-checker',
  IMAGE_COMPRESSOR: 'image-compressor',
  READ_TIME: 'read-time',
  WORD_COUNTER: 'word-counter',
  INVOICE_GENERATOR: 'invoice-generator',
  AI_TEXT_SUMMARIZER: 'ai-text-summarizer',
  AI_IMAGE_GENERATOR: 'ai-image-generator',
  LANGUAGE_TRANSLATOR: 'language-translator',
  AI_CODE_ASSISTANT: 'ai-code-assistant',
  AI_EMAIL_WRITER: 'ai-email-writer',
  AI_STORY_GENERATOR: 'ai-story-generator',
  YOUTUBE_THUMBNAIL: 'youtube-thumbnail',
} as const;

// Tool Processing Limits
export const TOOL_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
  REQUESTS_PER_DAY: 100,
  FILE_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  },
} as const;

// Error Messages
export const TOOL_ERRORS = {
  FILE_TOO_LARGE: 'File size exceeds the limit of 10MB',
  INVALID_FILE_TYPE: 'Invalid file type. Please check supported formats',
  UPLOAD_FAILED: 'Failed to upload file. Please try again',
  PROCESSING_FAILED: 'Failed to process file. Please try again',
  RATE_LIMIT: 'Daily usage limit reached. Please try again tomorrow',
} as const;

// Success Messages
export const TOOL_SUCCESS = {
  FILE_UPLOADED: 'File uploaded successfully',
  PROCESSING_COMPLETE: 'Processing completed successfully',
  DOWNLOAD_READY: 'Your file is ready for download',
} as const;

// Tool Status
export const TOOL_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;
