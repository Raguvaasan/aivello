import React from 'react';
import { SEOHelmet } from '../../components/common/SEOHelmet';
import { seoData } from '../../data/seoData';

const History: React.FC = () => {
  return (
    <>
      <SEOHelmet
        title={seoData.pages.history.title}
        description={seoData.pages.history.description}
        keywords={seoData.pages.history.keywords}
        url="https://aivello.vercel.app/app/history"
      />
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Usage History</h1>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          <p className="text-gray-300">Your tool usage history will appear here.</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default History;
