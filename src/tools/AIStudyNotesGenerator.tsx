import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';

const AIStudyNotesGenerator: React.FC = () => {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [notesType, setNotesType] = useState('summary');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNotes = async () => {
    setIsGenerating(true);
    try {
      // Mock AI notes generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const notes = `# ${subject} Study Notes

## Key Concepts
1. First main point
   - Supporting detail
   - Example
2. Second main point
   - Supporting detail
   - Example

## Summary
${content.substring(0, 100)}...

## Practice Questions
1. Question one?
2. Question two?
3. Question three?

## Additional Resources
- Resource 1
- Resource 2
- Resource 3`;

      setGeneratedNotes(notes);
    } catch (error) {
      console.error('Error generating notes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolWrapper
      toolId="ai-study-notes"
      toolName="AI Study Notes Generator"
      toolDescription="Transform your study material into organized, easy-to-learn notes"
      toolCategory="Education"
    >
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter the subject..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes Type</label>
              <select
                className="w-full p-3 border rounded-lg"
                value={notesType}
                onChange={(e) => setNotesType(e.target.value)}
              >
                <option value="summary">Summary</option>
                <option value="detailed">Detailed Notes</option>
                <option value="flashcards">Flashcards</option>
                <option value="mindmap">Mind Map</option>
                <option value="quiz">Practice Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Study Material</label>
              <textarea
                className="w-full h-[200px] p-3 border rounded-lg"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your study material here..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Generated Notes</label>
            <textarea
              className="w-full h-[400px] p-3 border rounded-lg font-mono text-sm"
              value={generatedNotes}
              readOnly
              placeholder="Your study notes will appear here..."
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={generateNotes}
            disabled={isGenerating || !content || !subject}
          >
            {isGenerating ? 'Generating...' : 'Generate Notes'}
          </button>
          <button
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            onClick={() => {
              setContent('');
              setSubject('');
              setGeneratedNotes('');
            }}
          >
            Clear All
          </button>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIStudyNotesGenerator;
