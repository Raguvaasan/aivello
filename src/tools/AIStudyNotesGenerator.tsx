import React, { useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaBook, FaCopy, FaTrash, FaMagic, FaLightbulb } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

type NotesType = 'summary' | 'detailed' | 'flashcards' | 'mindmap' | 'quiz';

const generateNotesContent = (content: string, subject: string, type: NotesType): string => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = content.split(/\s+/);
  const keyTerms = words.filter(w => w.length > 6 && w[0] === w[0].toUpperCase()).slice(0, 8);
  const uniqueKeyTerms = [...new Set(keyTerms)];

  switch (type) {
    case 'summary':
      return `📋 STUDY SUMMARY: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Overview
${sentences.slice(0, 3).map(s => `• ${s.trim()}`).join('\n')}

🔑 Key Points
${sentences.slice(3, 8).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}

${uniqueKeyTerms.length > 0 ? `📝 Key Terms\n${uniqueKeyTerms.map(t => `• ${t} — [Define this term]`).join('\n')}` : ''}

💡 Main Takeaway
${sentences[0]?.trim() || 'Review the material for the main concept.'}

📈 Study Statistics
• Total words: ${words.length}
• Key sentences: ${sentences.length}
• Estimated study time: ${Math.max(5, Math.ceil(words.length / 200))} minutes`;

    case 'detailed':
      const chunks = [];
      for (let i = 0; i < sentences.length; i += 3) {
        chunks.push(sentences.slice(i, i + 3));
      }
      return `📖 DETAILED NOTES: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${chunks.map((chunk, i) => `
📌 Section ${i + 1}
${chunk.map(s => `  ${s.trim()}.`).join('\n')}
  
  → Key insight: Focus on understanding this concept deeply.
  → Connection: How does this relate to previous sections?
`).join('\n')}

📝 Review Checklist
${sentences.slice(0, 5).map((s, i) => `☐ Can I explain: "${s.trim().substring(0, 60)}..."?`).join('\n')}

🔗 Connections Between Concepts
• How do the sections relate to each other?
• What is the overarching theme?
• Where can you apply this knowledge?`;

    case 'flashcards':
      return `🗂️ FLASHCARDS: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sentences.slice(0, 10).map((s, i) => `
╔══════════════════════════════╗
  Card ${i + 1}
╠══════════════════════════════╣
  Q: What is the significance of:
     "${s.trim().substring(0, 80)}..."?
╠══════════════════════════════╣
  A: [Write your answer here]
     
  Hint: Review the context around
  this statement in your notes.
╚══════════════════════════════╝`).join('\n')}

📊 Study Tips for Flashcards:
• Review cards using spaced repetition
• Mix the order each study session
• Mark cards as Easy/Medium/Hard
• Focus more time on Hard cards`;

    case 'mindmap':
      return `🧠 MIND MAP: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    ┌─────────────┐
                    │   ${subject.substring(0, 12).padEnd(12)}│
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐
    │ Concept 1 │   │ Concept 2 │   │ Concept 3 │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
${sentences.slice(0, 3).map(s => `    • ${s.trim().substring(0, 40)}...`).join('\n')}

📋 Branch Details:

🔵 Branch 1: Core Concepts
${sentences.slice(0, 3).map(s => `   → ${s.trim()}`).join('\n')}

🟢 Branch 2: Applications
${sentences.slice(3, 6).map(s => `   → ${s.trim()}`).join('\n')}

🟡 Branch 3: Advanced Topics
${sentences.slice(6, 9).map(s => `   → ${s.trim()}`).join('\n')}

💡 Tip: Recreate this mind map by hand for better retention!`;

    case 'quiz':
      return `📝 PRACTICE QUIZ: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Questions: ${Math.min(sentences.length, 8)}
Time Limit: ${Math.min(sentences.length, 8) * 2} minutes

${sentences.slice(0, 8).map((s, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Question ${i + 1} of ${Math.min(sentences.length, 8)}

Based on: "${s.trim().substring(0, 80)}..."

Q: Explain the key concept described above in your own words.

A) [Option A - Write your understanding]
B) [Option B - Alternative interpretation]
C) [Option C - Common misconception]
D) [Option D - Correct detailed answer]

Your Answer: ___

✅ Correct Answer: D
📝 Explanation: Review the original text carefully.
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SCORING:
• ${Math.min(sentences.length, 8)}/${Math.min(sentences.length, 8)} = Excellent! You've mastered this topic.
• ${Math.max(1, Math.min(sentences.length, 8) - 2)}/${Math.min(sentences.length, 8)} = Good! Review a few areas.
• Below ${Math.max(1, Math.min(sentences.length, 8) - 4)}/${Math.min(sentences.length, 8)} = Re-study the material.`;

    default:
      return '';
  }
};

const AIStudyNotesGenerator: React.FC = () => {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [notesType, setNotesType] = useState<NotesType>('summary');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateNotes = async () => {
    if (!content.trim() || !subject.trim()) return;
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGeneratedNotes(generateNotesContent(content, subject, notesType));
    } catch (error) {
      console.error('Error generating notes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const noteTypeInfo: Record<NotesType, { icon: string; desc: string }> = {
    summary: { icon: '📋', desc: 'Condensed key points' },
    detailed: { icon: '📖', desc: 'In-depth section notes' },
    flashcards: { icon: '🗂️', desc: 'Q&A study cards' },
    mindmap: { icon: '🧠', desc: 'Visual concept map' },
    quiz: { icon: '📝', desc: 'Practice questions' },
  };

  return (
    <ToolWrapper
      toolId="ai-study-notes"
      toolName="AI Study Notes Generator"
      toolDescription="Transform your study material into organized, easy-to-learn notes"
      toolCategory="Education"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 md:p-8 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <IconWrapper icon={FaBook} className="text-2xl text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Study Notes Generator
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transform study material into organized notes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Biology, World History, Physics..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(noteTypeInfo) as NotesType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNotesType(type)}
                      className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                        notesType === type
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400 dark:border-emerald-500'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="text-lg">{noteTypeInfo[type].icon}</span>
                      <div className="capitalize mt-1">{type}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <IconWrapper icon={FaLightbulb} className="text-yellow-500" />
                  {noteTypeInfo[notesType].desc}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Study Material
                </label>
                <textarea
                  className="w-full h-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-colors"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your study material, textbook content, or lecture notes here..."
                />
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                  {content.split(/\s+/).filter(w => w).length} words
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-emerald-500/25"
                  onClick={generateNotes}
                  disabled={isGenerating || !content.trim() || !subject.trim()}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconWrapper icon={FaMagic} />
                      Generate Notes
                    </>
                  )}
                </button>
                <button
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => { setContent(''); setSubject(''); setGeneratedNotes(''); }}
                >
                  <IconWrapper icon={FaTrash} />
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated Notes
                </label>
                {generatedNotes && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <IconWrapper icon={FaCopy} className="text-xs" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <textarea
                className="w-full h-[480px] p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                value={generatedNotes}
                readOnly
                placeholder="Your study notes will appear here..."
              />
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIStudyNotesGenerator;
