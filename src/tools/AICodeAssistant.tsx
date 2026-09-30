import React, { useDeferredValue, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  CODE_SNIPPETS,
  CODE_TEMPLATES,
  CodeTemplate,
  GeneratedCode,
  LANGUAGES,
  LanguageId,
  PROMPT_MAX_LENGTH,
  PROMPT_MIN_LENGTH,
  QUICK_ACTIONS,
  QuickAction,
  downloadCodeFile,
  generateCode,
  isLanguageId,
  languageLabel,
} from './lib/aiCodeAssistant';
import {
  CodeAnalysis,
  OPTIMIZE_OPTIONS,
  OptimizeOptionId,
  OptimizeResult,
  Severity,
  analyzeCode,
  detectLanguage,
  optimizeCode,
  optionAppliesTo,
} from './lib/aiCodeAssistantAnalysis';

const TOOL_ID = 'ai-code-assistant';
const TOOL_NAME = 'AI Code Assistant';
const MAX_CODE_LENGTH = 100_000;

type TabId = 'generate' | 'analyze' | 'optimize' | 'templates';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'generate', label: 'Generate', icon: '🎯' },
  { id: 'analyze', label: 'Analyze', icon: '🔍' },
  { id: 'optimize', label: 'Optimize', icon: '⚡' },
  { id: 'templates', label: 'Templates', icon: '📝' },
];

const cardClass = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6';
const subCardClass = 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const selectClass =
  'min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const optionClass = 'bg-white dark:bg-gray-800';
const errorTextClass = 'mt-1 text-sm text-red-600 dark:text-red-400';
const codeBlockClass =
  'bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 p-4 rounded-xl overflow-auto max-h-[32rem] text-sm leading-relaxed font-mono whitespace-pre';
const chipClass = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium';

const SEVERITY_STYLE: Record<Severity, string> = {
  error: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
};

const COMPLEXITY_STYLE: Record<CodeAnalysis['complexity'], string> = {
  High: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  Low: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
};

const scoreColor = (score: number) => (score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500');

const AICodeAssistant = () => {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const uid = useId();
  const tabId = (id: TabId) => `${uid}-tab-${id}`;
  const panelId = (id: TabId) => `${uid}-panel-${id}`;

  const [language, setLanguage] = useState<LanguageId>('javascript');
  const [activeTab, setActiveTab] = useState<TabId>('generate');
  const [prompt, setPrompt] = useState('');
  const [promptError, setPromptError] = useState('');
  const [output, setOutput] = useState<GeneratedCode | null>(null);
  const [showSnippets, setShowSnippets] = useState(false);

  const [userCode, setUserCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [analyzedCode, setAnalyzedCode] = useState('');
  const [optimizeOptions, setOptimizeOptions] = useState<Set<OptimizeOptionId>>(
    () => new Set(OPTIMIZE_OPTIONS.filter((o) => o.defaultOn).map((o) => o.id))
  );
  const [optimized, setOptimized] = useState<OptimizeResult | null>(null);
  const [status, setStatus] = useState('');

  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ generate: null, analyze: null, optimize: null, templates: null });
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const deferredCode = useDeferredValue(userCode);
  const detected = useMemo(() => detectLanguage(deferredCode), [deferredCode]);
  const showDetectHint =
    detected !== null && detected !== language && !(detected === 'javascript' && language === 'typescript');

  const snippets = useMemo(() => {
    const own = CODE_SNIPPETS.filter((s) => s.language === language || (language === 'typescript' && s.language === 'javascript'));
    return own.length ? own : CODE_SNIPPETS;
  }, [language]);

  const applicableOptions = useMemo(() => OPTIMIZE_OPTIONS.filter((o) => optionAppliesTo(o, language)), [language]);

  const selectTab = (id: TabId, focus = false) => {
    setActiveTab(id);
    if (focus) tabRefs.current[id]?.focus();
  };

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex((t) => t.id === activeTab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      selectTab(TABS[next].id, true);
    }
  };

  const copyText = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied to clipboard`);
    } catch {
      toast.error('Could not access the clipboard. Select the code and copy it manually.');
    }
  };

  const download = (code: string, lang: LanguageId, name: string) => {
    try {
      downloadCodeFile(code, lang, name);
      toast.success('File downloaded');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  // --- Generate -------------------------------------------------------------
  const handleGenerate = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const text = prompt.trim();
    if (text.length < PROMPT_MIN_LENGTH) {
      setPromptError(`Describe what you want in at least ${PROMPT_MIN_LENGTH} characters.`);
      promptRef.current?.focus();
      return;
    }
    setPromptError('');
    try {
      const result = generateCode(text, language);
      setOutput(result);
      setStatus(`${result.title} generated in ${languageLabel(result.language)}.`);
      track('generate');
    } catch {
      setPromptError('Something went wrong while generating code. Try rephrasing your request.');
    }
  };

  const runTemplate = (template: CodeTemplate) => {
    const result = generateCode(template.prompt, language);
    setPrompt(template.prompt);
    setPromptError('');
    setOutput(result);
    setStatus(`${template.title} template loaded in ${languageLabel(result.language)}.`);
    selectTab('generate');
    track('generate');
  };

  const runQuickAction = (action: QuickAction) => {
    setLanguage(action.language);
    setPrompt(action.prompt);
    setPromptError('');
    selectTab('generate');
    window.requestAnimationFrame(() => promptRef.current?.focus());
  };

  // --- Analyze / Optimize ---------------------------------------------------
  const validateCode = (): boolean => {
    if (!userCode.trim()) {
      setCodeError('Paste some code first.');
      return false;
    }
    if (userCode.length > MAX_CODE_LENGTH) {
      setCodeError(`That is more than ${MAX_CODE_LENGTH.toLocaleString()} characters - analyse one file or function at a time.`);
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleAnalyze = () => {
    if (!validateCode()) return;
    try {
      const result = analyzeCode(userCode, language);
      setAnalysis(result);
      setAnalyzedCode(`${language}:${userCode}`);
      setStatus(`Analysis complete. Score ${result.score} out of 100, ${result.issues.length} issue${result.issues.length === 1 ? '' : 's'} found.`);
      track('analyze');
    } catch {
      setCodeError('The analyser could not process this code. Check the selected language and try again.');
    }
  };

  const handleOptimize = () => {
    if (!validateCode()) return;
    const result = optimizeCode(userCode, language, optimizeOptions);
    setOptimized(result);
    setStatus(result.changes.length ? `${result.changes.length} kind${result.changes.length === 1 ? '' : 's'} of change applied.` : 'No changes were needed.');
    track('convert');
  };

  const toggleOption = (id: OptimizeOptionId) => {
    setOptimizeOptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const analysisStale = analysis !== null && analyzedCode !== `${language}:${userCode}`;

  const codeInput = (id: string, hintId: string) => (
    <div>
      <label className={labelClass} htmlFor={id}>
        Paste your {languageLabel(language)} code
      </label>
      <Textarea
        id={id}
        placeholder={`Paste ${languageLabel(language)} code here…`}
        value={userCode}
        spellCheck={false}
        aria-invalid={Boolean(codeError)}
        aria-describedby={codeError ? `${id}-error` : hintId}
        onChange={(e) => {
          setUserCode(e.target.value);
          if (codeError) setCodeError('');
        }}
        className="min-h-[220px] font-mono text-sm resize-y"
      />
      {codeError ? (
        <p id={`${id}-error`} role="alert" className={errorTextClass}>
          {codeError}
        </p>
      ) : (
        <p id={hintId} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {userCode.length.toLocaleString()} characters · processed locally in your browser, never uploaded
        </p>
      )}
      {showDetectHint && detected && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 px-3 py-2 text-sm text-purple-800 dark:text-purple-200">
          <span>This looks like {languageLabel(detected)}.</span>
          <button
            type="button"
            onClick={() => setLanguage(detected)}
            className="min-h-[36px] px-3 rounded-md font-medium text-purple-700 dark:text-purple-300 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            Switch to {languageLabel(detected)}
          </button>
        </div>
      )}
    </div>
  );

  const codeOutput = (code: string, lang: LanguageId, title: string, fileName: string) => (
    <div className={cardClass}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
          {title}
          <span className={`${chipClass} bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300`}>{languageLabel(lang)}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => copyText(code, 'Code')}>
            📋 Copy
          </Button>
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => download(code, lang, fileName)}>
            💾 Download
          </Button>
        </div>
      </div>
      <pre className={codeBlockClass}>
        <code className={`language-${lang}`}>{code}</code>
      </pre>
    </div>
  );

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Generate, analyze, and optimize code with AI assistance. Support for multiple programming languages."
      toolCategory="Development"
    >
      <div className="relative max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
              🤖 AI Code Assistant
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Generate starter code, review it for common issues, and apply safe clean-ups - all in your browser.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={`${uid}-language`}>
              Language
            </label>
            <select
              id={`${uid}-language`}
              value={language}
              onChange={(e) => {
                if (isLanguageId(e.target.value)) setLanguage(e.target.value);
              }}
              className={selectClass}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className={optionClass}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Code assistant modes" className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={tabId(tab.id)}
                aria-selected={selected}
                aria-controls={panelId(tab.id)}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={onTabKeyDown}
                className={`min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  selected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20'
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span> {tab.label}
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">{status}</p>

        {/* Generate */}
        {activeTab === 'generate' && (
          <div role="tabpanel" id={panelId('generate')} aria-labelledby={tabId('generate')} tabIndex={0} className="space-y-6 focus:outline-none">
            <form className={cardClass} onSubmit={handleGenerate} noValidate>
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-4">🎯 Code Generator</h3>
              <label className={labelClass} htmlFor={`${uid}-prompt`}>
                Describe what you want to code
              </label>
              <Textarea
                id={`${uid}-prompt`}
                ref={promptRef}
                placeholder="e.g., Create a User class with name, email and age · fetch products from an API · validate a signup form · sort orders by total descending"
                value={prompt}
                maxLength={PROMPT_MAX_LENGTH}
                aria-invalid={Boolean(promptError)}
                aria-describedby={promptError ? `${uid}-prompt-error` : `${uid}-prompt-hint`}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (promptError) setPromptError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                className="min-h-[100px]"
              />
              {promptError ? (
                <p id={`${uid}-prompt-error`} role="alert" className={errorTextClass}>
                  {promptError}
                </p>
              ) : (
                <p id={`${uid}-prompt-hint`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Generating {languageLabel(language)} · Ctrl/⌘ + Enter to generate · {prompt.length}/{PROMPT_MAX_LENGTH}
                </p>
              )}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="min-h-[44px]">
                  🤖 Generate Code
                </Button>
                <Button type="button" variant="outline" className="min-h-[44px]" aria-expanded={showSnippets} onClick={() => setShowSnippets((v) => !v)}>
                  💡 {showSnippets ? 'Hide' : 'Show'} Snippets
                </Button>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Try an example</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => runQuickAction(action)}
                      className="min-h-[40px] px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {output ? (
              <div className="space-y-3">
                {output.note && (
                  <p className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                    {output.note}
                  </p>
                )}
                {codeOutput(output.code, output.language, output.title, output.title)}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Your generated code will appear here.
              </p>
            )}

            {showSnippets && (
              <div className={cardClass}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💡 Snippets for {languageLabel(language)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {snippets.map((snippet) => (
                    <button
                      key={snippet.id}
                      type="button"
                      onClick={() => {
                        setOutput({ code: snippet.code, language: snippet.language, title: snippet.title });
                        setStatus(`${snippet.title} snippet loaded.`);
                      }}
                      className={`${subCardClass} text-left p-4 hover:border-purple-400 dark:hover:border-purple-400/60 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                    >
                      <span className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{snippet.title}</span>
                        <span className={`${chipClass} bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300`}>{snippet.category}</span>
                      </span>
                      <span className="block text-sm text-gray-600 dark:text-gray-400 mb-2">{snippet.description}</span>
                      <code className="block bg-white dark:bg-gray-950/60 border border-gray-200 dark:border-white/10 p-2 rounded text-xs overflow-hidden whitespace-pre text-gray-800 dark:text-gray-300 max-h-24">
                        {snippet.code}
                      </code>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analyze */}
        {activeTab === 'analyze' && (
          <div role="tabpanel" id={panelId('analyze')} aria-labelledby={tabId('analyze')} tabIndex={0} className="space-y-6 focus:outline-none">
            <div className={cardClass}>
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-4">🔍 Code Analysis</h3>
              {codeInput(`${uid}-analyze-code`, `${uid}-analyze-hint`)}
              <Button type="button" onClick={handleAnalyze} className="mt-4 min-h-[44px]">
                🔍 Analyze Code
              </Button>
            </div>

            {analysis ? (
              <div className={cardClass}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results ({languageLabel(analysis.language)})</h3>
                  {analysisStale && (
                    <span className="text-sm text-amber-700 dark:text-amber-300">Code or language changed - re-run the analysis.</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className={`${subCardClass} p-4`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analysis.score}/100 <span className="text-base font-semibold text-gray-500 dark:text-gray-400">({analysis.grade})</span>
                    </p>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true">
                      <div className={`h-2 rounded-full ${scoreColor(analysis.score)}`} style={{ width: `${analysis.score}%` }} />
                    </div>
                  </div>
                  <div className={`${subCardClass} p-4`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Complexity</p>
                    <p className="mt-1">
                      <span className={`${chipClass} text-sm ${COMPLEXITY_STYLE[analysis.complexity]}`}>{analysis.complexity}</span>
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {analysis.metrics.decisionPoints} branches · {analysis.metrics.functions} function{analysis.metrics.functions === 1 ? '' : 's'} · max depth {analysis.metrics.maxNesting}
                    </p>
                  </div>
                  <div className={`${subCardClass} p-4`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Lines</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.metrics.totalLines}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {analysis.metrics.codeLines} code · {analysis.metrics.commentLines} comment · {analysis.metrics.blankLines} blank
                    </p>
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {analysis.issues.length ? `⚠️ Issues found (${analysis.issues.length})` : '✅ No common issues found'}
                </h4>
                {analysis.issues.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {analysis.issues.map((issue) => (
                      <li key={issue.id} className={`${subCardClass} p-3`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${chipClass} uppercase ${SEVERITY_STYLE[issue.severity]}`}>{issue.severity}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{issue.message}</span>
                          {issue.count > 1 && <span className="text-xs text-gray-500 dark:text-gray-400">×{issue.count}</span>}
                        </div>
                        {issue.lines.length > 0 && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Line{issue.lines.length === 1 ? '' : 's'} {issue.lines.join(', ')}
                            {issue.count > issue.lines.length ? '…' : ''}
                          </p>
                        )}
                        {issue.fix && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">💡 {issue.fix}</p>}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">💡 Suggestions</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {analysis.suggestions.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  {analysis.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">✅ Strengths</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {analysis.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Heuristic, pattern-based review - it catches common problems but is not a substitute for a linter, tests or a human code review.
                </p>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">Paste code and click Analyze to see a score, issues with line numbers and suggestions.</p>
            )}
          </div>
        )}

        {/* Optimize */}
        {activeTab === 'optimize' && (
          <div role="tabpanel" id={panelId('optimize')} aria-labelledby={tabId('optimize')} tabIndex={0} className="space-y-6 focus:outline-none">
            <div className={cardClass}>
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-4">⚡ Safe Clean-ups</h3>
              {codeInput(`${uid}-optimize-code`, `${uid}-optimize-hint`)}
              <fieldset className="mt-4 min-w-0">
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Changes to apply</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {applicableOptions.map((option) => {
                    const id = `${uid}-opt-${option.id}`;
                    return (
                      <div key={option.id} className={`${subCardClass} flex items-start gap-3 p-3`}>
                        <input
                          id={id}
                          type="checkbox"
                          checked={optimizeOptions.has(option.id)}
                          onChange={() => toggleOption(option.id)}
                          className="mt-0.5 h-5 w-5 shrink-0 accent-purple-600"
                          aria-describedby={`${id}-desc`}
                        />
                        <div>
                          <label htmlFor={id} className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                            {option.label}
                          </label>
                          <p id={`${id}-desc`} className="text-xs text-gray-500 dark:text-gray-400">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
              <Button type="button" onClick={handleOptimize} disabled={optimizeOptions.size === 0} className="mt-4 min-h-[44px]">
                ⚡ Optimize Code
              </Button>
            </div>

            {optimized ? (
              <div className="space-y-3">
                <div className={cardClass}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Changes</h3>
                  {optimized.changes.length ? (
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {optimized.changes.map((c) => (
                        <li key={c.label}>
                          {c.label}: <strong className="text-gray-900 dark:text-white">{c.count}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Nothing to change - the selected clean-ups are already satisfied.</p>
                  )}
                  {optimized.changes.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 min-h-[44px]"
                      onClick={() => {
                        setUserCode(optimized.code);
                        toast.success('Input replaced with the optimized code');
                      }}
                    >
                      ↩️ Use as input
                    </Button>
                  )}
                </div>
                {codeOutput(optimized.code, language, 'Optimized Code', 'optimized')}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Choose the clean-ups you want and click Optimize. Every change is listed so you can review it.
              </p>
            )}
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div role="tabpanel" id={panelId('templates')} aria-labelledby={tabId('templates')} tabIndex={0} className={`${cardClass} focus:outline-none`}>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-1">📝 Code Templates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Templates are generated in the selected language ({languageLabel(language)}) and open in the Generate tab.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CODE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => runTemplate(template)}
                  className={`${subCardClass} text-left p-4 min-h-[44px] hover:border-purple-400 dark:hover:border-purple-400/60 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                >
                  <span className="block font-medium text-gray-900 dark:text-white">{template.title}</span>
                  <span className="block text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AICodeAssistant;
