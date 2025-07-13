// File: src/App.tsx
import React, { useEffect, useState } from 'react';
import YoutubeThumbnail from './tools/YoutubeThumbnail';
import GrammarChecker from './tools/GrammarChecker';
import PdfToWord from './tools/PdfToWord';
import QrCodeGenerator from './tools/QrCodeGenerator';
import TextToSpeech from './tools/TextToSpeech';
import ImageCompressor from './tools/ImageCompressor';
import ReadTimeEstimator from './tools/ReadTimeEstimator';
import WordCounter from './tools/WordCounter';
import BgRemover from './tools/BgRemover';
import ResumeBuilder from './tools/ResumeBuilder';

const tools = [
  { name: 'YouTube Thumbnail', component: <YoutubeThumbnail /> },
  { name: 'Grammar Checker', component: <GrammarChecker /> },
  { name: 'PDF to Word', component: <PdfToWord /> },
  { name: 'QR Code Generator', component: <QrCodeGenerator /> },
  { name: 'Text to Speech', component: <TextToSpeech /> },
  { name: 'Read Time Estimator', component: <ReadTimeEstimator /> },
  { name: 'Word Counter', component: <WordCounter /> },
  { name: 'Image Compressor', component: <ImageCompressor /> },
  { name: 'Background Remover', component: <BgRemover /> },  
  { name: 'AI Resume Builder', component: <ResumeBuilder /> },
];

export default function App() {
  const [layout, setLayout] = useState<'sidebar' | 'default'>('sidebar');
  const [selectedTool, setSelectedTool] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedLayout = localStorage.getItem('layout') as 'sidebar' | 'default';
    const savedTheme = localStorage.getItem('darkMode');
    if (savedLayout) setLayout(savedLayout);
    if (savedTheme === 'true') setDarkMode(true);
  }, []);

  const handleLayoutChange = (value: 'sidebar' | 'default') => {
    setLayout(value);
    localStorage.setItem('layout', value);
  };

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const themeClasses = darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';

  const renderLayout = () => {
    if (layout === 'sidebar') {
      return (
        <div className={`flex min-h-screen ${themeClasses}`}>
          <aside className="w-72 bg-gradient-to-b from-gray-800 to-gray-900 text-white p-5 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">AiVello</h2>
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 rounded mb-4 text-black"
            />
            <ul className="space-y-2 overflow-y-auto h-[65vh] pr-2">
              {filteredTools.map((tool, index) => (
                <li key={tool.name}>
                  <button
                    onClick={() => setSelectedTool(tools.indexOf(tool))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      selectedTool === tools.indexOf(tool)
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    {tool.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-gray-600 pt-4 text-sm">
              <div className="mb-2">
                <label className="text-gray-400">Layout:</label>
                <select
                  value={layout}
                  onChange={(e) => handleLayoutChange(e.target.value as 'sidebar' | 'default')}
                  className="w-full p-1 text-black rounded mt-1"
                >
                  <option value="sidebar">Sidebar</option>
                  <option value="default">Default</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  id="darkmode"
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => {
                    setDarkMode(!darkMode);
                    localStorage.setItem('darkMode', (!darkMode).toString());
                  }}
                />
                <label htmlFor="darkmode">Dark Mode</label>
              </div>
            </div>
          </aside>
          <main className="flex-1 p-6 overflow-y-auto">{tools[selectedTool].component}</main>
        </div>
      );
    }

    return (
      <div className={`min-h-screen ${themeClasses} p-4`}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">AiVello</h1>
          {tools.map((tool, idx) => (
            <div key={idx} className="mb-8">
              {tool.component}
            </div>
          ))}
        </div>
        <div className="fixed bottom-4 right-4">
          <select
            value={layout}
            onChange={(e) => handleLayoutChange(e.target.value as 'sidebar' | 'default')}
            className="border p-2 rounded text-black"
          >
            <option value="sidebar">Sidebar</option>
            <option value="default">Default</option>
          </select>
        </div>
      </div>
    );
  };

  return <div className={darkMode ? 'dark' : ''}>{renderLayout()}</div>;
}
