import React from 'react';
import { Loading } from './Loading';
import { ErrorMessage } from './ErrorMessage';

interface BaseToolProps {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: Error | null;
  children: React.ReactNode;
}

export const BaseTool: React.FC<BaseToolProps> = ({
  title,
  description,
  isLoading = false,
  error = null,
  children
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">{description}</p>

      {error && (
        <div className="mb-6">
          <ErrorMessage error={error} />
        </div>
      )}

      {isLoading ? (
        <div className="py-8">
          <Loading message="Processing your request..." />
        </div>
      ) : (
        children
      )}
    </div>
  );
};
