import { cn } from '../../lib/utils'; // Adjust the import path as necessary
import * as React from 'react';
 // if you have a utility for class merging

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'default', className = '', ...props }) => {
  const baseStyle = 'px-4 py-2 rounded font-medium transition-colors';
  
  const variants: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-100',
    link: 'text-blue-600 underline hover:text-blue-800',
  };

  return (
    <button
      className={cn(baseStyle, variants[variant], className)}
      {...props}
    />
  );
};
