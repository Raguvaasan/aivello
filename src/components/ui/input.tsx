import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input primitive.
 *
 * Previously hardcoded to `bg-gray-800/50 text-white`, which meant a dark grey box
 * with white text on a white page in light mode. Both themes are defined here now.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full px-4 py-3 rounded-xl
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

Input.displayName = 'Input';
