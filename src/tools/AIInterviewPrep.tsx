import React, { useState, useRef } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import type { InterviewQuestion, AnswerFeedback } from '../types/interview';
import { analyzeAnswer, generateQuestionsForRole } from '../utils/interviewAnalysis';

const AIInterviewPrep: React.FC = () => {
  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('entry');
  const [industry, setIndustry] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const generateQuestions = async () => {
    setIsGenerating(true);
    try {
      const generatedQuestions = generateQuestionsForRole(jobRole, experience, industry);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeFeedback = () => {
    if (!currentAnswer || questions.length === 0) return;
    
    try {
      const currentQuestion = questions[0]; // Get the current question being answered
      const feedback = analyzeAnswer(currentAnswer, currentQuestion, {
        role: jobRole,
        experience,
        industry
      });
      
      setFeedback(feedback);
    } catch (error) {
      console.error('Error analyzing answer:', error);
    }
  };

  return (
    <ToolWrapper
      toolId="ai-interview-prep"
      toolName="AI Interview Preparation"
      toolDescription="Practice interviews with AI feedback and improve your interview skills"
      toolCategory="Career"
    >
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Job Role</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Experience Level</label>
            <select
              className="w-full p-3 border rounded-lg"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead/Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Industry</label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={generateQuestions}
            disabled={isGenerating || !jobRole || !industry}
          >
            {isGenerating ? 'Generating...' : 'Generate Interview Questions'}
          </button>
        </div>

        {questions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Practice Questions</label>
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setCurrentAnswer('')}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">Q{index + 1}:</span> {question.question}
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {question.difficulty}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Category: {question.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Answer</label>
                <textarea
                  className="w-full h-[150px] p-3 border rounded-lg"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                />
              </div>

              <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={analyzeFeedback}
                disabled={!currentAnswer}
              >
                Analyze Answer
              </button>

              {feedback && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Content Feedback</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Content Score:</span>
                        <span className="font-medium">{feedback.content.score}%</span>
                      </div>
                      {feedback.content.strengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Strengths:</h4>
                          <ul className="list-disc pl-5 text-sm">
                            {feedback.content.strengths.map((strength, i) => (
                              <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {feedback.content.improvements.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400">Areas to Improve:</h4>
                          <ul className="list-disc pl-5 text-sm">
                            {feedback.content.improvements.map((improvement, i) => (
                              <li key={i}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Delivery Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm">Confidence:</span>
                        <div className="w-full bg-gray-200 rounded h-2">
                          <div
                            className="bg-blue-600 h-2 rounded"
                            style={{ width: `${feedback.delivery.confidence}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-sm">Clarity:</span>
                        <div className="w-full bg-gray-200 rounded h-2">
                          <div
                            className="bg-green-600 h-2 rounded"
                            style={{ width: `${feedback.delivery.clarity}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Keyword Analysis</h3>
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Found Keywords:</h4>
                        <div className="flex flex-wrap gap-2">
                          {feedback.keywords.found.map((keyword, i) => (
                            <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      {feedback.keywords.missing.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400">Missing Keywords:</h4>
                          <div className="flex flex-wrap gap-2">
                            {feedback.keywords.missing.map((keyword, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Overall Assessment</h3>
                    <p className="text-sm mb-2">{feedback.overall.summary}</p>
                    {feedback.overall.nextSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium">Next Steps:</h4>
                        <ul className="list-disc pl-5 text-sm">
                          {feedback.overall.nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIInterviewPrep;
