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

// ✅ AdSense Banner Component
const AdsenseBanner = () => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error', e);
    }
  }, []);

  return (
    <div className="my-4 flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '90px' }}
        data-ad-client="ca-pub-2807800939240640"
        data-ad-slot="1234567890"  // 🔁 Replace with real slot when ready
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default function App() {
  const [layout, setLayout] = useState<'sidebar' | 'default'>('sidebar');
  const [selectedTool, setSelectedTool] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedLayout = localStorage.getItem('layout') as 'sidebar' | 'default';
    const savedTheme = localStorage.getItem('darkMode');
    if (savedLayout) setLayout(savedLayout);
    if (savedTheme === 'true') setDarkMode(true);

    // ✅ Inject AdSense script if not already loaded
    const scriptId = 'adsense-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2807800939240640';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
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
  //const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const Sidebar = (
    <div
      className={`fixed md:static top-0 left-0 z-40 h-full w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white p-5 shadow-xl transition-transform transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:w-72`}
    >
      <div className="flex justify-between items-center md:block">
        <h2 className="text-2xl font-bold mb-6">AiVello</h2>
        <button
          className="md:hidden text-white"
          onClick={() => setIsSidebarOpen(false)}
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        placeholder="Search tools..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 rounded mb-4 text-black"
      />

      <ul className="space-y-2 overflow-y-auto h-[60vh] pr-2">
        {filteredTools.map((tool, index) => (
          <li key={tool.name}>
            <button
              onClick={() => {
                setSelectedTool(tools.indexOf(tool));
                setIsSidebarOpen(false); // close on select (mobile)
              }}
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
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row min-h-screen ${themeClasses}`}>
      {/* Mobile Toggle Button */}
      {layout === 'sidebar' && (
  <div className="md:hidden p-4 flex justify-between items-center bg-gray-800 text-white">
    <h2 className="text-xl font-bold">AiVello</h2>
    <button onClick={() => setIsSidebarOpen(true)} className="text-white">
      ☰
    </button>
  </div>
)}


      {Sidebar}

      <main className="flex-1 p-6 pt-0 overflow-y-auto">
        <AdsenseBanner />
        {tools[selectedTool].component}
      </main>
    </div>
  );
};


  return <div className={darkMode ? 'dark' : ''}>{renderLayout()}</div>;
}
