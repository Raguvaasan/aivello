import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaFileAlt, FaCopy, FaMagic, FaList } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

export default function AITextSummarizer() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryType, setSummaryType] = useState('bullet');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [loading, setLoading] = useState(false);

  const generateSummary = () => {
    if (!inputText.trim()) {
      alert('Please enter text to summarize');
      return;
    }

    setLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const sentences = inputText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      let result = '';

      // Simple extractive summarization algorithm
      const keyPoints = sentences
        .map(sentence => ({
          sentence: sentence.trim(),
          score: calculateSentenceScore(sentence)
        }))
        .sort((a, b) => b.score - a.score);

      const summaryCount = getSummaryCount(sentences.length);
      const topSentences = keyPoints.slice(0, summaryCount);

      if (summaryType === 'bullet') {
        result = topSentences
          .map(item => `• ${item.sentence}.`)
          .join('\n');
      } else if (summaryType === 'paragraph') {
        result = topSentences
          .map(item => item.sentence)
          .join('. ') + '.';
      } else {
        result = `Summary:\n\n${topSentences
          .map(item => item.sentence)
          .join('. ')}.`;
      }

      setSummary(result);
      setLoading(false);
    }, 2000);
  };

  const calculateSentenceScore = (sentence: string): number => {
    const words = sentence.toLowerCase().split(' ');
    const importantWords = ['important', 'key', 'main', 'significant', 'crucial', 'essential', 'major'];
    let score = words.length; // Base score on length

    // Boost score for important words
    importantWords.forEach(word => {
      if (sentence.toLowerCase().includes(word)) {
        score += 5;
      }
    });

    // Boost score for numbers and dates
    if (/\d/.test(sentence)) score += 3;
    
    return score;
  };

  const getSummaryCount = (totalSentences: number): number => {
    switch (summaryLength) {
      case 'short':
        return Math.max(1, Math.floor(totalSentences * 0.2));
      case 'medium':
        return Math.max(2, Math.floor(totalSentences * 0.4));
      case 'long':
        return Math.max(3, Math.floor(totalSentences * 0.6));
      default:
        return Math.max(2, Math.floor(totalSentences * 0.4));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    alert('Summary copied to clipboard!');
  };

  const wordCount = inputText.trim().split(/\s+/).length;
  const summaryWordCount = summary.trim().split(/\s+/).length;

  return (
    <ToolWrapper
      toolId="ai-text-summarizer"
      toolName="AI Text Summarizer"
      toolDescription="Summarize long articles, documents, and texts instantly. Extract key points and main ideas with AI-powered text summarization"
      toolCategory="Writing"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaFileAlt} className="text-3xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              AI Text Summarizer
            </h2>
            <IconWrapper icon={FaMagic} className="text-2xl text-purple-600" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original Text
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your article, document, or long text here..."
                  className="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {wordCount} words
                </p>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Summary Format
                  </label>
                  <select
                    value={summaryType}
                    onChange={(e) => setSummaryType(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bullet">Bullet Points</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="structured">Structured</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Summary Length
                  </label>
                  <select
                    value={summaryLength}
                    onChange={(e) => setSummaryLength(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="short">Short (20%)</option>
                    <option value="medium">Medium (40%)</option>
                    <option value="long">Long (60%)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateSummary}
                disabled={loading || !inputText.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Summarizing...
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaMagic} />
                    Generate Summary
                  </>
                )}
              </button>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Summary
                </label>
                {summary && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <IconWrapper icon={FaCopy} />
                    Copy
                  </button>
                )}
              </div>
              
              <textarea
                value={summary}
                readOnly
                placeholder="Your AI-generated summary will appear here..."
                className="w-full h-80 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {summary && (
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{summaryWordCount} words</span>
                  <span>
                    Compression: {wordCount > 0 ? Math.round((1 - summaryWordCount / wordCount) * 100) : 0}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Features & Tips */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <IconWrapper icon={FaList} />
                Features:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>• Extractive summarization algorithm</li>
                <li>• Multiple output formats</li>
                <li>• Adjustable summary length</li>
                <li>• Word count and compression ratio</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">💡 Best Practices:</h3>
              <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
                <li>• Use well-structured text for better results</li>
                <li>• Longer texts produce better summaries</li>
                <li>• Review and edit the summary as needed</li>
                <li>• Ideal for articles, reports, and research papers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
