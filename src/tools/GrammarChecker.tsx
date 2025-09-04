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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 p-6">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
              ✏️ Grammar Checker
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Check and fix grammar, spelling, and punctuation errors instantly with AI
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <textarea
              className="w-full p-4 bg-white/10 border border-white/20 rounded-xl mb-6 h-40 
                         text-white placeholder-gray-400 resize-none
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              placeholder="Enter your text here to check for grammar, spelling, and punctuation errors..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              onClick={checkGrammar}
              disabled={loading || !text.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                         disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                         text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25 transition-all
                         w-full md:w-auto"
            >
              {loading ? '🔍 Checking...' : '✨ Check Grammar'}
            </button>

            {result.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 text-white">📝 Grammar Suggestions:</h3>
                <div className="space-y-3">
                  {result.map((item, index) => (
                    <div key={index} className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-red-400 font-semibold text-sm">Error:</span>
                          <span className="text-red-300 bg-red-900/30 px-2 py-1 rounded text-sm">
                            "{item.context.text.slice(item.context.offset, item.context.offset + item.context.length)}"
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 font-semibold text-sm">Suggestion:</span>
                          <span className="text-green-300 bg-green-900/30 px-2 py-1 rounded text-sm">
                            {item.replacements.map((r: any) => r.value).join(', ')}
                          </span>
                        </div>
                        {item.message && (
                          <div className="text-gray-400 text-sm">
                            💡 {item.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.length === 0 && text && !loading && (
              <div className="mt-6 text-center">
                <div className="bg-green-900/30 border border-green-500/20 rounded-xl p-6">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="text-green-300 font-semibold mb-2">Great job!</h3>
                  <p className="text-gray-400">No grammar errors found in your text.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
