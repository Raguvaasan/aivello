/**
 * API service utilities for external API calls
 */

import { handleApiError, createError, logError } from '../utils/errorHandling';
import { auth } from '../config/firebase';
import { MAX_UPLOAD_SIZE } from '../constants/limits';

// Re-exported for existing callers; the value lives in constants/limits.ts so that
// importing it does not drag in the Firebase SDK.
export { MAX_UPLOAD_SIZE };

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
}

class ApiService {
  private static async request<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: body instanceof FormData
          ? headers  // Let browser set Content-Type with boundary for FormData
          : { 'Content-Type': 'application/json', ...headers },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Our API routes return { error: "..." } with a message meant for the user
        // (rate limits, expired sessions, oversized files). Prefer it over statusText.
        let message = `API request failed: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error) message = errorBody.error;
        } catch {
          // Non-JSON error body; keep the generic message.
        }

        throw createError(message, 'API_ERROR', response.status);
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        return (await response.text()) as unknown as T;
      } else {
        return (await response.blob()) as unknown as T;
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw createError('Request timeout', 'TIMEOUT_ERROR', 408);
      }
      
      const apiError = handleApiError(error);
      logError(apiError, 'ApiService');
      throw apiError;
    }
  }

  /**
   * The /api/remove-bg proxy requires a Firebase ID token: it spends a paid
   * remove.bg quota, so it is never callable anonymously.
   */
  static async removeBg(imageFile: Blob, size: 'auto' | 'regular' | 'full' = 'auto'): Promise<Blob> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw createError('Please sign in to use this tool.', 'UNAUTHENTICATED', 401);
    }

    // getIdToken refreshes automatically when the cached token is close to expiry.
    const idToken = await currentUser.getIdToken();

    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('size', size);

    return this.request<Blob>('/api/remove-bg', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${idToken}` },
    });
  }

  static async validateImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (!validTypes.includes(file.type)) {
        throw createError(
          'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
          'INVALID_FILE_TYPE',
          400
        );
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        throw createError(
          'File size too large. Please upload an image smaller than 4MB.',
          'FILE_TOO_LARGE',
          400
        );
      }

      resolve(true);
    });
  }
}

export default ApiService;
