import { createError, handleApiError, handleFirebaseError, CustomError } from '../utils/errorHandling';

describe('errorHandling', () => {
  describe('createError', () => {
    test('should create a CustomError with all fields', () => {
      const error = createError('Test error', 'TEST_CODE', 404);
      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(404);
    });

    test('should work with only message', () => {
      const error = createError('Simple error');
      expect(error.message).toBe('Simple error');
      expect(error.code).toBeUndefined();
    });
  });

  describe('handleApiError', () => {
    test('should return CustomError as-is', () => {
      const original = createError('API failed', 'API_ERROR', 500);
      const result = handleApiError(original);
      expect(result.message).toBe('API failed');
      expect(result.code).toBe('API_ERROR');
    });

    test('should wrap standard Error', () => {
      const error = new Error('Network failure');
      const result = handleApiError(error);
      expect(result.message).toBe('Network failure');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });

    test('should handle non-Error objects', () => {
      const result = handleApiError('string error');
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('handleFirebaseError', () => {
    test('should map known Firebase error codes', () => {
      const error = { code: 'auth/user-not-found', message: 'raw message' };
      const result = handleFirebaseError(error);
      expect(result.message).toBe('No user found with this email address');
    });

    test('should fall back to raw message for unknown codes', () => {
      const error = { code: 'auth/unknown-code', message: 'Something else' };
      const result = handleFirebaseError(error);
      expect(result.message).toBe('Something else');
    });

    test('should handle missing message', () => {
      const error = { code: 'unknown' };
      const result = handleFirebaseError(error);
      expect(result.message).toBe('An error occurred');
    });
  });
});
