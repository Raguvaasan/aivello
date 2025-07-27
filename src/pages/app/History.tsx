import React from 'react';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';
import { useTheme } from '../../context/ThemeContext';

interface HistoryItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

const HistoryItemComponent: React.FC<HistoryItem> = ({ title, description, timestamp }) => (
  <div className="py-4 flex items-center justify-between">
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
        {description}
      </p>
      <span className="text-xs text-gray-400 dark:text-gray-500 transition-colors">
        {timestamp}
      </span>
    </div>
    <button 
      className="px-4 py-2 text-sm rounded-md bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      onClick={() => {/* Handle view */}}
    >
      View
    </button>
  </div>
);

const History: React.FC = () => {
  const theme = useTheme();
  
  if (!theme) {
    throw new Error('History must be used within a ThemeProvider');
  }

  return (
    <>
      <SEOHelmet
        title={seoData.pages.history.title}
        description={seoData.pages.history.description}
        keywords={seoData.pages.history.keywords}
        url="https://aivello.vercel.app/app/history"
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 transition-colors">
          Usage History
        </h1>
        <div className="rounded-lg shadow-lg p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors">
          <div className="space-y-4">
            {/* History Items */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
              <HistoryItemComponent
                id="1"
                title="AI Code Assistant"
                description="Generated React component"
                timestamp="2 hours ago"
              />
              <HistoryItemComponent
                id="2"
                title="Image Compressor"
                description="Compressed 3 images"
                timestamp="Yesterday"
              />
              
              {/* Empty State */}
              {false && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-gray-700 dark:text-gray-300 transition-colors">
                    Your tool usage history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default History;
