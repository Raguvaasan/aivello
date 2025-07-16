import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';

export default function GrammarChecker() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkGrammar = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          text,
          language: 'en-US'
        })
      });
      const data = await res.json();
      setResult(data.matches);
    } catch (err) {
      console.error(err);
      alert('Error checking grammar.');
    }
    setLoading(false);
  };

  return (
    <ToolWrapper
      toolId="grammar-checker"
      toolName="AI Grammar Checker"
      toolDescription="Check and fix grammar, spelling, and punctuation errors instantly with our free AI-powered grammar checker"
      toolCategory="Writing"
    >
    <div className="bg-white dark:bg-gray-800 shadow-md p-4 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Grammar Checker</h2>
      <textarea
        className="w-full p-2 border rounded mb-4 h-32"
        placeholder="Enter your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={checkGrammar}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Checking...' : 'Check Grammar'}
      </button>

      {result.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Suggestions:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {result.map((item, index) => (
              <li key={index}>
                <strong>Error:</strong> "{item.context.text.slice(item.context.offset, item.context.offset + item.context.length)}" → 
                <strong> Suggestion:</strong> {item.replacements.map((r: any) => r.value).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
    </ToolWrapper>
  );
}
