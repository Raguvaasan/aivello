/**
 * Pure helpers for the Background Remover: upload validation, output naming and
 * error normalisation. Kept free of React and Firebase so they can be unit tested.
 */
import { MAX_UPLOAD_SIZE } from '../../constants/limits';

/** Formats accepted by the remove.bg proxy. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** `accept` attribute for the file input. */
export const ACCEPT_ATTRIBUTE = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

const formatMegabytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`;
};

/** Returns a user-facing problem with `file`, or null when it can be uploaded. */
export const validateImageFile = (file: { type: string; size: number }): string | null => {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Please choose a JPEG, PNG or WebP image.';
  }
  if (file.size === 0) {
    return 'This file is empty.';
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return `This image is ${formatMegabytes(file.size)}. The maximum size is ${formatMegabytes(MAX_UPLOAD_SIZE)}.`;
  }
  return null;
};

/** `holiday.jpg` -> `holiday-no-bg.png` (the service always returns a PNG). */
export const resultFileName = (originalName: string): string => {
  const base = originalName
    .replace(/\.[^./\\]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .trim();
  return `${base || 'image'}-no-bg.png`;
};

export interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * ApiService throws either a CustomError instance or a plain `{ message, code,
 * statusCode }` object (see utils/errorHandling), so read the fields structurally.
 */
export const getErrorDetails = (error: unknown): ErrorDetails => {
  if (typeof error === 'object' && error !== null) {
    const { message, code, statusCode } = error as { message?: unknown; code?: unknown; statusCode?: unknown };
    return {
      message: typeof message === 'string' ? message : '',
      code: typeof code === 'string' ? code : undefined,
      statusCode: typeof statusCode === 'number' ? statusCode : undefined,
    };
  }
  return { message: typeof error === 'string' ? error : '' };
};

/** True when the failure means the visitor must (re-)authenticate. */
export const isAuthError = (details: ErrorDetails): boolean =>
  details.code === 'UNAUTHENTICATED' || details.statusCode === 401;
