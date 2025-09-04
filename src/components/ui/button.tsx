import { cn } from '../../lib/utils'; // Adjust the import path as necessary
import * as React from 'react';
 // if you have a utility for class merging

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'default', className = '', ...props }) => {
  const baseStyle = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants: Record<string, string> = {
    default: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 focus:ring-purple-500/50',
    outline: 'border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white focus:ring-gray-500/50',
    ghost: 'text-gray-300 hover:bg-gray-700/50 hover:text-white focus:ring-gray-500/50',
    link: 'text-purple-400 underline hover:text-purple-300 focus:ring-purple-500/50',
  };

  return (
    <button
      className={cn(baseStyle, variants[variant], className)}
      {...props}
    />
  );
};
