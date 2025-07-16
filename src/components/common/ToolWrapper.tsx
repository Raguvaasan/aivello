import React from 'react';
import { useLocation } from 'react-router-dom';
import { SEOHelmet } from '../common/SEOHelmet';
import { seoData, structuredDataSchemas } from '../../data/seoData';

interface ToolWrapperProps {
  children: React.ReactNode;
  toolId: string;
  toolName: string;
  toolDescription: string;
  toolCategory: string;
}

export const ToolWrapper: React.FC<ToolWrapperProps> = ({ 
  children, 
  toolId, 
  toolName, 
  toolDescription, 
  toolCategory 
}) => {
  const location = useLocation();
  const toolSeoData = seoData.tools[toolId as keyof typeof seoData.tools];
  
  const defaultSeoData = {
    title: `${toolName} - Free AI Tool | AiVello`,
    description: toolDescription,
    keywords: `${toolName.toLowerCase()}, AI tool, free tool, ${toolCategory.toLowerCase()}`,
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      toolName,
      toolDescription,
      'UtilitiesApplication'
    )
  };

  const seoInfo = toolSeoData || defaultSeoData;

  return (
    <>
      <SEOHelmet
        title={seoInfo.title}
        description={seoInfo.description}
        keywords={seoInfo.keywords}
        url={`https://aivello.vercel.app${location.pathname}`}
        structuredData={seoInfo.structuredData}
      />
      {children}
    </>
  );
};
