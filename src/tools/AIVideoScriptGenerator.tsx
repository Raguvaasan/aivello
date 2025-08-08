import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';

const AIVideoScriptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('5');
  const [style, setStyle] = useState('educational');
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateScript = async () => {
    setIsGenerating(true);
    try {
      // Mock AI script generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const generatedScript = `[Opening Scene]
Camera fades in to show ${topic}

[Narrator]
Welcome to this ${duration}-minute video about ${topic}.

[Main Content]
- Introduction to the topic
- Key points and explanations
- Visual demonstrations
- Expert insights

[Closing]
Thank you for watching! Don't forget to like and subscribe.`;

      setScript(generatedScript);
    } catch (error) {
      console.error('Error generating script:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolWrapper
      toolId="ai-video-script"
      toolName="AI Video Script Generator"
      toolDescription="Generate professional video scripts for YouTube, TikTok, and other platforms"
      toolCategory="Content Creation"
    >
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Video Topic</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your video topic..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="1">1 minute</option>
                <option value="3">3 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Video Style</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="educational">Educational</option>
                <option value="entertaining">Entertaining</option>
                <option value="promotional">Promotional</option>
                <option value="tutorial">Tutorial</option>
                <option value="vlog">Vlog</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Generated Script</label>
            <textarea
              className="w-full h-[300px] p-3 border rounded-lg font-mono text-sm"
              value={script}
              readOnly
              placeholder="Your video script will appear here..."
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={generateScript}
            disabled={isGenerating || !topic}
          >
            {isGenerating ? 'Generating...' : 'Generate Script'}
          </button>
          <button
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            onClick={() => {
              setTopic('');
              setScript('');
            }}
          >
            Clear All
          </button>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIVideoScriptGenerator;
