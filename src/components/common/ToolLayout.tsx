import React from 'react';
import { useLoadingState } from '../../hooks/useLoadingState';
import { Loading } from '../common/Loading';
import { SEO } from '../common/SEO';

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({ title, description, children }) => {
  return (
    <>
      <SEO 
        title={`${title} - Aivello`}
        description={description}
      />
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        {children}
      </div>
    </>
  );
};
