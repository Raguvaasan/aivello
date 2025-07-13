import React, { useState } from 'react';

export default function WordCounter() {
  const [text, setText] = useState('');
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Word Counter</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-2 border rounded mb-2"
        placeholder="Type your content here..."
      />
      <p>Words: {wordCount}</p>
    </div>
  );
}