import React, { useState } from 'react';

export default function ReadTimeEstimator() {
  const [text, setText] = useState('');
  const words = text.trim().split(/\s+/).filter(Boolean);
  const minutes = Math.ceil(words.length / 200);

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Read Time Estimator</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-2 border rounded mb-2"
        placeholder="Paste your content..."
      />
      <p>Estimated read time: {minutes} min</p>
    </div>
  );
}