import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';

export default function WordCounter() {
  const [text, setText] = useState('');
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <ToolWrapper
      toolId="word-counter"
      toolName="Word Counter Tool"
      toolDescription="Count words, characters, paragraphs, and reading time instantly. Free online word counting tool"
      toolCategory="Writing"
    >
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Word Counter</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded mb-2
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Type your content here..."
      />
      <p className="text-gray-900 dark:text-white">Words: {wordCount}</p>
    </div>
    </ToolWrapper>
  );
}