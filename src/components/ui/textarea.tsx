import * as React from 'react';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Multiline input primitive. Was dark-only; both themes are defined here now.
 * Kept visually in step with `Input`.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full px-4 py-3 rounded-xl resize-none
                  bg-white dark:bg-gray-800/50
                  border border-gray-300 dark:border-gray-600/50
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
