import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl 
                  text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                  transition-all duration-200 resize-none ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
