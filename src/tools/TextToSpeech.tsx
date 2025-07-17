import React, { useState } from 'react';

export default function TextToSpeech() {
  const [text, setText] = useState('');

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Text to Speech</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded mb-2
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter text to speak..."
      />
      <button onClick={handleSpeak} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Speak
      </button>
    </div>
  );
}