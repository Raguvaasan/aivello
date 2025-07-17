import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  resize-none ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
