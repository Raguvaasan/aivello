import React, { useState } from 'react';

export default function TextToSpeech() {
  const [text, setText] = useState('');

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-2">Text to Speech</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-2 border rounded mb-2"
        placeholder="Enter text to speak..."
      />
      <button onClick={handleSpeak} className="bg-blue-600 text-white px-4 py-2 rounded">
        Speak
      </button>
    </div>
  );
}