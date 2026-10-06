import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { SEOHelmet } from '../common/SEOHelmet';
import { IconWrapper } from './IconWrapper';
import { structuredDataSchemas } from '../../data/seoData';
import { toolSeoData } from '../../data/toolSeoData';
import { tools } from '../../data/tools';

interface ToolWrapperProps {
  children: React.ReactNode;
  toolId: string;
  toolName: string;
  toolDescription: string;
  toolCategory: string;
}

const SITE_URL = 'https://aivello.vercel.app';

/**
 * Shared chrome for every tool page: SEO metadata, SoftwareApplication + BreadcrumbList
 * structured data, and a visible breadcrumb trail.
 *
 * The registry entry (src/data/tools.ts) is the source of truth for the display name
 * and category, so the breadcrumb matches the sidebar even if a tool passes a longer
 * marketing name.
 */
export const ToolWrapper: React.FC<ToolWrapperProps> = ({
  children,
  toolId,
  toolName,
  toolDescription,
  toolCategory,
}) => {
  const location = useLocation();
  const registryEntry = tools.find((tool) => tool.id === toolId);
  const name = registryEntry?.name ?? toolName;
  const category = registryEntry?.category ?? toolCategory;
  const url = `${SITE_URL}${location.pathname}`;
  const toolSeo = toolSeoData[toolId as keyof typeof toolSeoData];

  const seoInfo = useMemo(() => {
    const breadcrumbSchema = structuredDataSchemas.createBreadcrumbSchema([
      { name: 'Home', url: `${SITE_URL}/` },
      { name: 'Tools', url: `${SITE_URL}/app` },
      { name, url },
    ]);

    if (toolSeo) {
      return { ...toolSeo, structuredData: [toolSeo.structuredData, breadcrumbSchema] };
    }

    return {
      title: `${name} - Free Online Tool | Aivello`,
      description: toolDescription,
      keywords: `${name.toLowerCase()}, free ${name.toLowerCase()}, online tool, ${category.toLowerCase()}, no signup`,
      structuredData: [
        structuredDataSchemas.createSoftwareApplicationSchema(name, toolDescription, 'UtilitiesApplication'),
        breadcrumbSchema,
      ],
    };
  }, [toolSeo, name, toolDescription, category, url]);

  return (
    <>
      <SEOHelmet
        title={seoInfo.title}
        description={seoInfo.description}
        keywords={seoInfo.keywords}
        url={url}
        structuredData={seoInfo.structuredData}
      />
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <Link to="/" className="hover:text-purple-700 dark:hover:text-purple-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <IconWrapper icon={FiChevronRight} className="w-3.5 h-3.5" />
          </li>
          <li>
            <Link to="/app" className="hover:text-purple-700 dark:hover:text-purple-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50">
              Tools
            </Link>
          </li>
          <li aria-hidden="true">
            <IconWrapper icon={FiChevronRight} className="w-3.5 h-3.5" />
          </li>
          <li>{category}</li>
          <li aria-hidden="true">
            <IconWrapper icon={FiChevronRight} className="w-3.5 h-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[14rem] sm:max-w-none">
            {name}
          </li>
        </ol>
      </nav>
      {children}
    </>
  );
};
