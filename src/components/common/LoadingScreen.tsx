import React from 'react';

interface LoadingScreenProps {
  /**
   * Full-viewport overlay (initial app load, auth checks) vs. an inline block that
   * leaves the header and sidebar visible (lazy tool routes). The inline variant is
   * the default: a full-screen overlay for every tool navigation hid the whole shell
   * and read as a page reload.
   */
  fullScreen?: boolean;
  label?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ fullScreen = false, label = 'Loading…' }) => (
  <div
    className={
      fullScreen
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-950'
        : 'flex min-h-[50vh] items-center justify-center'
    }
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-4">
      <span
        className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 dark:border-purple-900 dark:border-t-purple-400 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
    </div>
  </div>
);
