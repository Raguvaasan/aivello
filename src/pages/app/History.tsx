import React from 'react';

const History: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Usage History</h1>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          <p className="text-gray-300">Your tool usage history will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default History;
