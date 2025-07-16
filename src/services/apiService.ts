/**
 * API service utilities for external API calls
 */

import config from '../config/environment';
import { handleApiError, createError, logError } from '../utils/errorHandling';

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
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw createError(
          `API request failed: ${response.statusText}`,
          'API_ERROR',
          response.status
        );
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
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw createError('Request timeout', 'TIMEOUT_ERROR', 408);
      }
      
      const apiError = handleApiError(error);
      logError(apiError, 'ApiService');
      throw apiError;
    }
  }

  static async removeBg(imageFile: File): Promise<Blob> {
    if (!config.apiKeys.removeBg) {
      throw createError(
        'Remove.bg API key not configured',
        'MISSING_API_KEY',
        500
      );
    }

    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('size', 'auto');

    return this.request<Blob>('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKeys.removeBg,
      },
      body: formData,
    });
  }

  static async validateImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        throw createError(
          'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
          'INVALID_FILE_TYPE',
          400
        );
      }

      if (file.size > maxSize) {
        throw createError(
          'File size too large. Please upload an image smaller than 10MB.',
          'FILE_TOO_LARGE',
          400
        );
      }

      resolve(true);
    });
  }
}

export default ApiService;
