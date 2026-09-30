import React, { useId, useMemo, useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import type { AnswerFeedback, ExperienceLevel, InterviewQuestion, StarCoverage } from '../types/interview';
import {
  analyzeAnswer,
  detectRoleFamily,
  generateQuestionsForRole,
  MIN_ANSWER_WORDS,
  questionTip,
} from '../utils/interviewAnalysis';

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500';
const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl shadow-lg dark:shadow-2xl';
const SUB_CARD = 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl';
const PRIMARY_BUTTON =
  'min-h-[44px] px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ' +
  'transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const SECONDARY_BUTTON =
  'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20 ' +
  'hover:bg-gray-200 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50';

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'entry', label: 'Entry level' },
  { value: 'mid', label: 'Mid level' },
  { value: 'senior', label: 'Senior level' },
  { value: 'lead', label: 'Lead / Manager' },
];

const DIFFICULTY_CHIP: Record<InterviewQuestion['difficulty'], string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
};

const STAR_LABELS: Record<keyof StarCoverage, string> = {
  situation: 'Situation',
  task: 'Task',
  action: 'Action',
  result: 'Result',
};

const countWords = (text: string): number => (text.trim() ? text.trim().split(/\s+/).length : 0);

const scoreColor = (score: number): string =>
  score >= 80 ? 'text-green-600 dark:text-green-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

const barColor = (score: number): string => (score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500');

const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className={`font-semibold ${scoreColor(value)}`}>{value}%</span>
    </div>
    <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-white/10" aria-hidden="true">
      <div className={`h-2 rounded-full ${barColor(value)}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const AIInterviewPrep: React.FC = () => {
  const id = useId();
  const track = useToolTracking('ai-interview-prep', 'AI Interview Preparation');
  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('entry');
  const [industry, setIndustry] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [showHints, setShowHints] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [roleFamily, setRoleFamily] = useState<string | null>(null);
  // The job context the current questions were generated for (the inputs may be edited later).
  const [context, setContext] = useState({ role: '', experience: 'entry' as ExperienceLevel, industry: '' });

  const ids = {
    role: `${id}-role`,
    roleError: `${id}-role-error`,
    experience: `${id}-experience`,
    industry: `${id}-industry`,
    answer: `${id}-answer`,
    answerHelp: `${id}-answer-help`,
    answerError: `${id}-answer-error`,
    questionsHeading: `${id}-questions`,
  };

  const current = questions[selectedIndex];
  const currentAnswer = current ? (answers[current.id] ?? '') : '';
  const currentFeedback = current ? feedback[current.id] : undefined;
  const answerWords = useMemo(() => countWords(currentAnswer), [currentAnswer]);
  const answeredCount = questions.filter((q) => feedback[q.id]).length;

  const generateQuestions = () => {
    const role = jobRole.trim();
    if (role.length < 2) {
      setRoleError('Enter the job title you are interviewing for, e.g. "Registered Nurse" or "Data Analyst".');
      return;
    }
    setRoleError(null);
    setAnswerError(null);
    const generated = generateQuestionsForRole(role, experience, industry);
    setQuestions(generated);
    setSelectedIndex(0);
    setAnswers({});
    setFeedback({});
    setShowHints(false);
    setRoleFamily(detectRoleFamily(role));
    setContext({ role, experience, industry: industry.trim() });
    track('generate');
  };

  const selectQuestion = (index: number) => {
    setSelectedIndex(index);
    setAnswerError(null);
    setShowHints(false);
  };

  const analyzeCurrent = () => {
    if (!current) return;
    if (answerWords < MIN_ANSWER_WORDS) {
      setAnswerError(`Write at least ${MIN_ANSWER_WORDS} words so there is enough to analyze (you have ${answerWords}).`);
      return;
    }
    setAnswerError(null);
    const result = analyzeAnswer(currentAnswer, current, context);
    setFeedback((prev) => ({ ...prev, [current.id]: result }));
    track('analyze');
  };

  return (
    <ToolWrapper
      toolId="ai-interview-prep"
      toolName="AI Interview Preparation"
      toolDescription="Practice interviews with AI feedback and improve your interview skills"
      toolCategory="Career"
    >
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className={`${CARD} p-4 sm:p-6`}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Interview Preparation</h2>
          <p className="mt-1 mb-6 text-sm text-gray-600 dark:text-gray-300">
            Get practice questions for your role, write your answer, and get instant feedback on structure, specifics and clarity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={LABEL} htmlFor={ids.role}>
                Job role <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                id={ids.role}
                type="text"
                className={INPUT}
                value={jobRole}
                maxLength={80}
                onChange={(e) => {
                  setJobRole(e.target.value);
                  if (roleError) setRoleError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') generateQuestions();
                }}
                placeholder="e.g. Software Engineer"
                aria-invalid={roleError ? true : undefined}
                aria-describedby={roleError ? ids.roleError : undefined}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor={ids.experience}>
                Experience level
              </label>
              <select
                id={ids.experience}
                className={INPUT}
                value={experience}
                onChange={(e) => setExperience(e.target.value as ExperienceLevel)}
              >
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-white dark:bg-gray-800">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor={ids.industry}>
                Industry <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
              </label>
              <input
                id={ids.industry}
                type="text"
                className={INPUT}
                value={industry}
                maxLength={60}
                onChange={(e) => setIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') generateQuestions();
                }}
                placeholder="e.g. Healthcare"
              />
            </div>
          </div>
          {roleError && (
            <p id={ids.roleError} role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {roleError}
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="button" className={PRIMARY_BUTTON} onClick={generateQuestions}>
              {questions.length > 0 ? 'Generate a New Set' : 'Generate Interview Questions'}
            </button>
            {questions.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
                {roleFamily ? (
                  <>
                    Includes <span className="font-medium text-purple-600 dark:text-purple-400">{roleFamily}</span> questions.
                  </>
                ) : (
                  'General questions tailored to your job title.'
                )}{' '}
                {answeredCount}/{questions.length} answered.
              </p>
            )}
          </div>
        </div>

        {questions.length > 0 && current && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <nav className={`${CARD} p-4 lg:col-span-2 self-start`} aria-labelledby={ids.questionsHeading}>
              <h3 id={ids.questionsHeading} className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Practice questions
              </h3>
              <ol className="space-y-2">
                {questions.map((question, index) => {
                  const selected = index === selectedIndex;
                  const done = feedback[question.id];
                  return (
                    <li key={question.id}>
                      <button
                        type="button"
                        onClick={() => selectQuestion(index)}
                        aria-current={selected ? 'true' : undefined}
                        className={`w-full min-h-[44px] text-left p-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          selected
                            ? 'bg-purple-50 border-purple-300 dark:bg-purple-500/20 dark:border-purple-400/50'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm text-gray-900 dark:text-white">
                            <span className="font-semibold">Q{index + 1}.</span> {question.question}
                          </span>
                          {done && (
                            <span className={`shrink-0 text-xs font-bold ${scoreColor(done.overall.score)}`}>
                              {done.overall.score}%
                            </span>
                          )}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                            {question.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_CHIP[question.difficulty]}`}>
                            {question.difficulty}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <section className={`${CARD} p-4 sm:p-6 lg:col-span-3 space-y-4`} aria-label="Answer practice">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Question {selectedIndex + 1} of {questions.length}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{current.question}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{questionTip(current)}</p>
                {current.expectedKeywords && current.expectedKeywords.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowHints((v) => !v)}
                      aria-expanded={showHints}
                      className="min-h-[44px] text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded"
                    >
                      {showHints ? 'Hide' : 'Show'} themes interviewers listen for
                    </button>
                    {showHints && (
                      <ul className="mt-1 flex flex-wrap gap-2">
                        {current.expectedKeywords.map((k) => (
                          <li key={k} className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                            {k}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.answer}>
                  Your answer
                </label>
                <textarea
                  id={ids.answer}
                  className={`${INPUT} h-48 resize-y`}
                  value={currentAnswer}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAnswers((prev) => ({ ...prev, [current.id]: value }));
                    if (answerError) setAnswerError(null);
                  }}
                  placeholder="Type your answer as you would say it in the interview…"
                  aria-invalid={answerError ? true : undefined}
                  aria-describedby={`${ids.answerHelp}${answerError ? ` ${ids.answerError}` : ''}`}
                />
                <p id={ids.answerHelp} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {answerWords} words · about {Math.max(0, Math.round((answerWords / 140) * 60))} seconds spoken
                </p>
                {answerError && (
                  <p id={ids.answerError} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {answerError}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" className={`${PRIMARY_BUTTON} flex-1`} onClick={analyzeCurrent}>
                  {currentFeedback ? 'Re-analyze Answer' : 'Analyze Answer'}
                </button>
                {selectedIndex < questions.length - 1 && (
                  <button type="button" className={SECONDARY_BUTTON} onClick={() => selectQuestion(selectedIndex + 1)}>
                    Next question
                  </button>
                )}
              </div>

              <div aria-live="polite">
                {currentFeedback && (
                  <div className={`${SUB_CARD} p-4 space-y-5`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Overall score</p>
                        <p className={`text-4xl font-bold ${scoreColor(currentFeedback.overall.score)}`}>
                          {currentFeedback.overall.score}%
                        </p>
                      </div>
                      <p className="flex-1 min-w-[12rem] text-sm text-gray-700 dark:text-gray-200">{currentFeedback.overall.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ScoreBar label="Content" value={currentFeedback.content.score} />
                      <ScoreBar label="Relevance" value={currentFeedback.delivery.relevance} />
                      <ScoreBar label="Clarity" value={currentFeedback.delivery.clarity} />
                      <ScoreBar label="Confidence" value={currentFeedback.delivery.confidence} />
                      <ScoreBar label="Length" value={currentFeedback.delivery.conciseness} />
                      <ScoreBar label="Key themes" value={currentFeedback.keywords.score} />
                    </div>

                    {currentFeedback.structure && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">STAR structure</h4>
                        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(Object.keys(STAR_LABELS) as Array<keyof StarCoverage>).map((part) => {
                            const ok = currentFeedback.structure?.[part];
                            return (
                              <li
                                key={part}
                                className={`px-3 py-2 rounded-lg text-sm text-center ${
                                  ok
                                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                                }`}
                              >
                                <span aria-hidden="true">{ok ? '✓ ' : '○ '}</span>
                                {STAR_LABELS[part]}
                                <span className="sr-only">{ok ? ' present' : ' missing'}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {currentFeedback.content.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">Strengths</h4>
                        <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                          {currentFeedback.content.strengths.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentFeedback.content.improvements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Areas to improve</h4>
                        <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                          {currentFeedback.content.improvements.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(currentFeedback.keywords.found.length > 0 || currentFeedback.keywords.missing.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-green-600 dark:text-green-400">Themes covered</h4>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {currentFeedback.keywords.found.length === 0 && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">None yet</span>
                            )}
                            {currentFeedback.keywords.found.map((k) => (
                              <span key={k} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                        {currentFeedback.keywords.missing.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Themes to consider</h4>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {currentFeedback.keywords.missing.map((k) => (
                                <span key={k} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentFeedback.overall.nextSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Next steps</h4>
                        <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                          {currentFeedback.overall.nextSteps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {questions.length === 0 && (
          <div className={`${SUB_CARD} p-6 text-center text-sm text-gray-600 dark:text-gray-300`}>
            Enter your job role and press <span className="font-semibold">Generate Interview Questions</span> to start practising.
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIInterviewPrep;
