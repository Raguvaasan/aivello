import { describe, it, expect } from 'vitest';
import { getErrorDetails, isAuthError, resultFileName, validateImageFile } from '../../tools/lib/bgRemover';
import { MAX_UPLOAD_SIZE } from '../../constants/limits';

describe('validateImageFile', () => {
  it('accepts JPEG, PNG and WebP within the size limit', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateImageFile({ type: 'image/png', size: MAX_UPLOAD_SIZE })).toBeNull();
    expect(validateImageFile({ type: 'image/webp', size: 1 })).toBeNull();
  });

  it('rejects other types, empty files and oversized files', () => {
    expect(validateImageFile({ type: 'image/gif', size: 10 })).toMatch(/JPEG, PNG or WebP/);
    expect(validateImageFile({ type: 'image/png', size: 0 })).toMatch(/empty/);
    expect(validateImageFile({ type: 'image/png', size: MAX_UPLOAD_SIZE + 1 })).toMatch(/maximum size is 4MB/);
  });
});

describe('resultFileName', () => {
  it('always produces a .png name', () => {
    expect(resultFileName('holiday.jpg')).toBe('holiday-no-bg.png');
    expect(resultFileName('my:pic.webp')).toBe('my_pic-no-bg.png');
    expect(resultFileName('.png')).toBe('image-no-bg.png');
  });
});

describe('error details', () => {
  it('reads CustomError-like objects structurally', () => {
    const details = getErrorDetails({ message: 'Please sign in', code: 'UNAUTHENTICATED', statusCode: 401 });
    expect(details).toEqual({ message: 'Please sign in', code: 'UNAUTHENTICATED', statusCode: 401 });
    expect(isAuthError(details)).toBe(true);
  });

  it('handles unknown values', () => {
    expect(getErrorDetails('oops').message).toBe('oops');
    expect(getErrorDetails(undefined).message).toBe('');
    expect(isAuthError(getErrorDetails({ message: 'x', statusCode: 429 }))).toBe(false);
  });
});
