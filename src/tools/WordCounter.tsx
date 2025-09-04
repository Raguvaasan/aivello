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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 p-6">
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
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
              📊 Word Counter
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Count words, characters, paragraphs, and reading time instantly
            </p>
          </div>

          <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-6 shadow-lg dark:shadow-2xl">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 p-4 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl mb-6
                         text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              placeholder="Type or paste your content here to get instant word count statistics..."
            />

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{wordCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Words</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-pink-400 mb-1">{text.length}</div>
                <div className="text-sm text-gray-400">Characters</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{text.replace(/\s/g, '').length}</div>
                <div className="text-sm text-gray-400">No Spaces</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">{Math.ceil(wordCount / 200)}</div>
                <div className="text-sm text-gray-400">Min Read</div>
              </div>
            </div>

            {text && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2">📝 Text Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Paragraphs:</span>
                      <span className="text-white">{text.split('\n\n').filter(p => p.trim()).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sentences:</span>
                      <span className="text-white">{text.split(/[.!?]+/).filter(s => s.trim()).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg. Words/Sentence:</span>
                      <span className="text-white">{Math.round(wordCount / Math.max(1, text.split(/[.!?]+/).filter(s => s.trim()).length))}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2">⏱️ Reading Time</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slow (150 WPM):</span>
                      <span className="text-white">{Math.ceil(wordCount / 150)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average (200 WPM):</span>
                      <span className="text-white">{Math.ceil(wordCount / 200)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fast (250 WPM):</span>
                      <span className="text-white">{Math.ceil(wordCount / 250)} min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}