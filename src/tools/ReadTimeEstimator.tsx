import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';

export default function ReadTimeEstimator() {
  const [text, setText] = useState('');
  const words = text.trim().split(/\s+/).filter(Boolean);
  const minutes = Math.ceil(words.length / 200);

  return (
    <ToolWrapper
      toolId="read-time-estimator"
      toolName="Reading Time Calculator"
      toolDescription="Calculate reading time for any text. Perfect for blogs, articles, and content planning"
      toolCategory="Writing"
    >
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Read Time Estimator</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded mb-2
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Paste your content..."
      />
      <p className="text-gray-900 dark:text-white">Estimated read time: {minutes} min</p>
    </div>
    </ToolWrapper>
  );
}