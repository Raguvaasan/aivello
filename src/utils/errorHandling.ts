/**
 * Error handling utilities for the application
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export class CustomError extends Error implements AppError {
  code?: string;
  statusCode?: number;
  details?: unknown;

  constructor(message: string, code?: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const createError = (
  message: string,
  code?: string,
  statusCode?: number,
  details?: unknown
): CustomError => {
  return new CustomError(message, code, statusCode, details);
};

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof CustomError) {
    return error;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      details: error.stack,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNEXPECTED_ERROR',
    details: error,
  };
};

export const handleFirebaseError = (error: any): AppError => {
  const firebaseErrors: Record<string, string> = {
    'auth/user-not-found': 'No user found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'permission-denied': 'You do not have permission to perform this action',
    'unavailable': 'Service is currently unavailable. Please try again later',
  };

  return {
    message: firebaseErrors[error.code] || error.message || 'An error occurred',
    code: error.code,
    statusCode: 400,
    details: error,
  };
};

export const logError = (error: AppError, context?: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'ERROR'}]`, error);
  }

  // In production, you might want to send errors to a logging service
  // like Sentry, LogRocket, etc.
};

const errorHandler = {
  createError,
  handleApiError,
  handleFirebaseError,
  logError,
  CustomError,
};

export default errorHandler;
