import React, { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  ANSWER_OPTIONS,
  Answers,
  PersonalInfo,
  PersonalityProfile,
  QUESTIONS,
  TRAITS,
  allAnswered,
  buildProfile,
  downloadProfileReport,
  validateAge,
} from './lib/aiPersonalityAnalyzer';

const TOOL_ID = 'ai-personality-analyzer';
const TOOL_NAME = 'AI Personality Analyzer';

type Stage = 'intro' | 'quiz' | 'results';

const EMPTY_INFO: PersonalInfo = { name: '', age: '', occupation: '' };

const cardClass = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6';
const labelClass = 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300';

const LEVEL_STYLE = {
  High: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  Moderate: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  Low: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
} as const;

const ListCard = ({ title, items, titleClass, dotClass }: { title: string; items: string[]; titleClass: string; dotClass: string }) => (
  <section className={cardClass}>
    <h3 className={`text-xl font-semibold mb-4 ${titleClass}`}>{title}</h3>
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className={`${dotClass} mt-0.5`} aria-hidden="true">•</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
        </li>
      ))}
    </ul>
  </section>
);

const AIPersonalityAnalyzer = () => {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const uid = useId();

  const [stage, setStage] = useState<Stage>('intro');
  const [info, setInfo] = useState<PersonalInfo>(EMPTY_INFO);
  const [ageError, setAgeError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const timerRef = useRef<number | null>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const focusQuestion = () => window.requestAnimationFrame(() => questionRef.current?.focus());

  const startTest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validateAge(info.age);
    setAgeError(err);
    if (err) {
      ageRef.current?.focus();
      return;
    }
    setStage('quiz');
    setCurrentQuestion(0);
    focusQuestion();
  };

  const analyze = (finalAnswers: Answers) => {
    if (!allAnswered(finalAnswers)) {
      const firstMissing = QUESTIONS.findIndex((q) => typeof finalAnswers[q.id] !== 'number');
      setCurrentQuestion(Math.max(0, firstMissing));
      setError('Please answer every question before seeing your results.');
      focusQuestion();
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setStatus('Analysing your answers…');
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      try {
        const result = buildProfile(finalAnswers);
        setProfile(result);
        setStage('results');
        setStatus(`Your personality type is ${result.type}.`);
        track('analyze');
        window.requestAnimationFrame(() => resultsRef.current?.focus());
      } catch {
        setError('Something went wrong while analysing your answers. Please try again.');
        setStatus('');
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);
  };

  const handleAnswer = (answerIndex: number) => {
    if (isAnalyzing) return;
    const question = QUESTIONS[currentQuestion];
    // Build the next answers object here so the final question is included when analysing
    // (reading `answers` after setState would still see the previous render's value).
    const nextAnswers = { ...answers, [question.id]: answerIndex };
    setAnswers(nextAnswers);
    setError('');
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((q) => q + 1);
      focusQuestion();
    } else {
      analyze(nextAnswers);
    }
  };

  const goBack = () => {
    if (currentQuestion === 0) {
      setStage('intro');
      return;
    }
    setCurrentQuestion((q) => q - 1);
    focusQuestion();
  };

  const resetTest = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsAnalyzing(false);
    setStage('intro');
    setCurrentQuestion(0);
    setAnswers({});
    setProfile(null);
    setError('');
    setStatus('');
    setInfo(EMPTY_INFO);
    setAgeError('');
  };

  const handleDownload = () => {
    if (!profile) return;
    try {
      downloadProfileReport(profile, info);
      toast.success('Personality report downloaded');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  const question = QUESTIONS[currentQuestion];
  const answeredCount = QUESTIONS.filter((q) => typeof answers[q.id] === 'number').length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Discover your personality type with AI-powered analysis. Get insights into your strengths, career suggestions, and relationship compatibility."
      toolCategory="AI"
    >
      <div className="relative max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            🧠 AI Personality Analyzer
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Answer {QUESTIONS.length} quick statements to discover your Big Five personality profile
          </p>
        </div>

        <p className="sr-only" aria-live="polite">{status}</p>

        {stage === 'intro' && (
          <form className={cardClass} onSubmit={startTest} noValidate>
            <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">👤 About You (optional)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Only used to personalise your downloadable report. Nothing is uploaded or stored.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} htmlFor={`${uid}-name`}>Name</label>
                <Input
                  id={`${uid}-name`}
                  placeholder="Your name"
                  autoComplete="given-name"
                  maxLength={60}
                  value={info.name}
                  onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${uid}-age`}>Age</label>
                <Input
                  id={`${uid}-age`}
                  ref={ageRef}
                  type="number"
                  inputMode="numeric"
                  min={13}
                  max={120}
                  placeholder="Your age"
                  value={info.age}
                  aria-invalid={Boolean(ageError)}
                  aria-describedby={ageError ? `${uid}-age-error` : undefined}
                  onChange={(e) => {
                    setInfo((p) => ({ ...p, age: e.target.value }));
                    if (ageError) setAgeError('');
                  }}
                  className={ageError ? 'ring-2 ring-red-500 dark:ring-red-400' : ''}
                />
                {ageError && (
                  <p id={`${uid}-age-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{ageError}</p>
                )}
              </div>
              <div>
                <label className={labelClass} htmlFor={`${uid}-occupation`}>Occupation</label>
                <Input
                  id={`${uid}-occupation`}
                  placeholder="Your occupation"
                  maxLength={80}
                  value={info.occupation}
                  onChange={(e) => setInfo((p) => ({ ...p, occupation: e.target.value }))}
                />
              </div>
            </div>
            <Button type="submit" className="mt-6 w-full sm:w-auto min-h-[48px] px-8">
              {answeredCount > 0 ? '▶️ Continue Test' : '🚀 Start Test'}
            </Button>
          </form>
        )}

        {stage === 'quiz' && question && (
          <div className="space-y-6">
            {/* Progress */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Question {currentQuestion + 1} of {QUESTIONS.length}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{answeredCount} answered</span>
              </div>
              <div
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
                role="progressbar"
                aria-label="Test progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Question */}
            <div className={`${cardClass} border-2 border-purple-200 dark:border-purple-500/30`}>
              <div className="text-center">
                <h3 ref={questionRef} tabIndex={-1} className="text-lg sm:text-xl font-semibold mb-6 text-gray-900 dark:text-white focus:outline-none">
                  {question.text}
                </h3>
                <div className="space-y-3" role="group" aria-label="Choose how much you agree">
                  {ANSWER_OPTIONS.map((option, index) => {
                    const selected = answers[question.id] === index;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        disabled={isAnalyzing}
                        onClick={() => handleAnswer(index)}
                        className={`w-full min-h-[48px] p-3 sm:p-4 text-left rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-60 ${
                          selected
                            ? 'bg-purple-100 dark:bg-purple-500/20 border-purple-400 dark:border-purple-400/60 text-purple-900 dark:text-purple-100'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-300 dark:hover:border-purple-400/40'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && (
                <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              )}
              <div className="mt-6 flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={goBack} disabled={isAnalyzing} className="min-h-[44px]">
                  ← Back
                </Button>
                {typeof answers[question.id] === 'number' && currentQuestion < QUESTIONS.length - 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentQuestion((q) => q + 1);
                      focusQuestion();
                    }}
                    className="min-h-[44px]"
                  >
                    Next →
                  </Button>
                )}
              </div>
            </div>

            {isAnalyzing && (
              <div className={`${cardClass} text-center`} role="status">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-3" aria-hidden="true" />
                <p className="font-semibold text-gray-900 dark:text-white">Analysing your personality…</p>
              </div>
            )}
          </div>
        )}

        {stage === 'results' && profile && (
          <div className="space-y-6">
            <div className={`${cardClass} text-center`}>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{info.name.trim() ? `${info.name.trim()}, your type is` : 'Your type is'}</p>
              <h3 ref={resultsRef} tabIndex={-1} className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white focus:outline-none">
                {profile.type}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.description}</p>
            </div>

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📊 Personality Traits</h3>
              <ul className="space-y-4">
                {TRAITS.map((trait) => {
                  const value = profile.scores[trait.id];
                  const level = profile.levels[trait.id];
                  return (
                    <li key={trait.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{trait.label}</span>
                        <span className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${LEVEL_STYLE[level]}`}>{level}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">{value}%</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3" aria-hidden="true">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300" style={{ width: `${value}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{trait.low}</span>
                        <span>{trait.high}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListCard title="💪 Strengths" items={profile.strengths} titleClass="text-green-700 dark:text-green-300" dotClass="text-green-600 dark:text-green-400" />
              <ListCard title="🌱 Growth Areas" items={profile.growthAreas} titleClass="text-orange-700 dark:text-orange-300" dotClass="text-orange-600 dark:text-orange-400" />
            </div>

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">🚀 Career Suggestions</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {profile.careerSuggestions.map((career) => (
                  <li key={career} className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {career}
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListCard title="💞 Relationship Compatibility" items={profile.relationshipCompatibility} titleClass="text-pink-700 dark:text-pink-300" dotClass="text-pink-600 dark:text-pink-400" />
              <ListCard title="🎯 Development Areas" items={profile.developmentAreas} titleClass="text-amber-700 dark:text-amber-300" dotClass="text-amber-600 dark:text-amber-400" />
            </div>

            <ListCard title="✨ Life Advice" items={profile.lifeAdvice} titleClass="text-purple-700 dark:text-purple-300" dotClass="text-purple-600 dark:text-purple-400" />

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Based on a short {QUESTIONS.length}-item Big Five style questionnaire, scored in your browser. For self-reflection only - not a clinical assessment.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="min-h-[44px] px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                📊 Download Report
              </button>
              <Button type="button" variant="outline" onClick={resetTest} className="min-h-[44px]">
                🔄 Take Test Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIPersonalityAnalyzer;
