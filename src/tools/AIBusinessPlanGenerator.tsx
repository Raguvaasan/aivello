import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  BUDGET_OPTIONS,
  BusinessPlan,
  BusinessPlanErrors,
  BusinessPlanInput,
  IDEA_MIN_LENGTH,
  INDUSTRIES,
  SectionId,
  TIMEFRAME_OPTIONS,
  businessPlanToText,
  downloadTextFile,
  generateBusinessPlan,
  toFileSlug,
  validateBusinessPlanInput,
} from './lib/aiBusinessPlanGenerator';

const TOOL_ID = 'ai-business-plan-generator';
const TOOL_NAME = 'AI Business Plan Generator';

const EMPTY_INPUT: BusinessPlanInput = {
  businessName: '',
  industry: '',
  businessIdea: '',
  targetMarket: '',
  budgetRange: '',
  timeframe: '',
};

const cardClass = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6';
const labelClass = 'block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2';
const selectClass =
  'w-full min-h-[44px] px-4 py-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const optionClass = 'bg-white dark:bg-gray-800';
const errorTextClass = 'mt-1 text-sm text-red-600 dark:text-red-400';
// A ring rather than a border colour, so it never competes with the primitives' own border classes.
const invalidClass = 'ring-2 ring-red-500 dark:ring-red-400';

const FEATURES = [
  { icon: '🎯', title: 'Market Analysis', text: 'Industry trends and a sizing worksheet for your target market' },
  { icon: '💰', title: 'Financial Projections', text: '3-year model scaled to your budget and industry margins' },
  { icon: '🏆', title: 'Competitive Analysis', text: 'Typical competitor types and where you can win' },
  { icon: '📈', title: 'Marketing Strategy', text: 'Channels and budget split tailored to your idea' },
  { icon: '⚙️', title: 'Operations Plan', text: 'Roles, processes and milestones for your timeframe' },
  { icon: '📊', title: 'Risk Assessment', text: 'Industry, model and runway risks with mitigations' },
];

const AIBusinessPlanGenerator = () => {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    industry: `${uid}-industry`,
    market: `${uid}-market`,
    budget: `${uid}-budget`,
    timeframe: `${uid}-timeframe`,
    idea: `${uid}-idea`,
    panel: `${uid}-panel`,
    panelHeading: `${uid}-panel-heading`,
  };

  const [form, setForm] = useState<BusinessPlanInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<BusinessPlanErrors>({});
  const [generateError, setGenerateError] = useState('');
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [planInput, setPlanInput] = useState<BusinessPlanInput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('executive-summary');
  const [status, setStatus] = useState('');

  const timerRef = useRef<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fieldRefs = {
    businessName: useRef<HTMLInputElement>(null),
    industry: useRef<HTMLSelectElement>(null),
    businessIdea: useRef<HTMLTextAreaElement>(null),
  };

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const updateField = <K extends keyof BusinessPlanInput>(key: K, value: BusinessPlanInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof BusinessPlanErrors];
        return next;
      });
    }
  };

  const inputsChanged = useMemo(
    () => Boolean(plan && planInput && JSON.stringify(planInput) !== JSON.stringify(form)),
    [plan, planInput, form]
  );

  const active = useMemo(
    () => plan?.sections.find((s) => s.id === activeSection) ?? plan?.sections[0] ?? null,
    [plan, activeSection]
  );

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGenerating) return;
    const nextErrors = validateBusinessPlanInput(form);
    setErrors(nextErrors);
    setGenerateError('');
    const firstInvalid = (['businessName', 'industry', 'businessIdea'] as const).find((k) => nextErrors[k]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    setIsGenerating(true);
    setStatus('Generating business plan…');
    const snapshot = { ...form };
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      try {
        const result = generateBusinessPlan(snapshot);
        setPlan(result);
        setPlanInput(snapshot);
        setActiveSection('executive-summary');
        setStatus(`Business plan for ${result.businessName} generated with ${result.sections.length} sections.`);
        track('generate');
        window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      } catch {
        setGenerateError('Something went wrong while building your plan. Please try again.');
        setStatus('');
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };

  const handleDownload = () => {
    if (!plan) return;
    try {
      downloadTextFile(businessPlanToText(plan), `${toFileSlug(plan.businessName, 'business')}-business-plan.txt`);
      toast.success('Business plan downloaded');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  const handleCopySection = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(`${active.title}\n\n${active.content}`);
      toast.success(`${active.title} copied`);
    } catch {
      toast.error('Could not access the clipboard. Select the text and copy it manually.');
    }
  };

  const handleReset = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsGenerating(false);
    setForm(EMPTY_INPUT);
    setErrors({});
    setGenerateError('');
    setPlan(null);
    setPlanInput(null);
    setStatus('');
  };

  const describedBy = (field: keyof BusinessPlanErrors) => (errors[field] ? `${uid}-${field}-error` : undefined);

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Generate comprehensive business plans with AI assistance. Create professional business plans for startups and investors."
      toolCategory="AI"
    >
      <div className="relative max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
            🚀 AI Business Plan Generator
          </h2>
          <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Turn your business idea into a structured plan with market, marketing, financial and risk sections
          </p>
        </div>

        {/* Input Form */}
        <form className={cardClass} onSubmit={handleGenerate} noValidate>
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            📝 Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label className={labelClass} htmlFor={ids.name}>
                Business Name <span aria-hidden="true">*</span>
              </label>
              <Input
                id={ids.name}
                ref={fieldRefs.businessName}
                placeholder="Enter your business name"
                value={form.businessName}
                maxLength={80}
                required
                aria-invalid={Boolean(errors.businessName)}
                aria-describedby={describedBy('businessName')}
                onChange={(e) => updateField('businessName', e.target.value)}
                className={errors.businessName ? invalidClass : ''}
              />
              {errors.businessName && (
                <p id={`${uid}-businessName-error`} role="alert" className={errorTextClass}>
                  {errors.businessName}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor={ids.industry}>
                Industry <span aria-hidden="true">*</span>
              </label>
              <select
                id={ids.industry}
                ref={fieldRefs.industry}
                value={form.industry}
                required
                aria-invalid={Boolean(errors.industry)}
                aria-describedby={describedBy('industry')}
                onChange={(e) => updateField('industry', e.target.value)}
                className={`${selectClass} ${errors.industry ? invalidClass : ''}`}
              >
                <option value="" className={optionClass}>Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind} className={optionClass}>{ind}</option>
                ))}
              </select>
              {errors.industry && (
                <p id={`${uid}-industry-error`} role="alert" className={errorTextClass}>
                  {errors.industry}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor={ids.market}>Target Market</label>
              <Input
                id={ids.market}
                placeholder="e.g., Small businesses, millennials, healthcare professionals"
                value={form.targetMarket}
                maxLength={120}
                onChange={(e) => updateField('targetMarket', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={ids.budget}>Starting Budget</label>
              <select
                id={ids.budget}
                value={form.budgetRange}
                onChange={(e) => updateField('budgetRange', e.target.value)}
                className={selectClass}
              >
                <option value="" className={optionClass}>Select budget</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value} className={optionClass}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor={ids.timeframe}>Target Break-even Timeframe</label>
              <select
                id={ids.timeframe}
                value={form.timeframe}
                onChange={(e) => updateField('timeframe', e.target.value)}
                className={selectClass}
              >
                <option value="" className={optionClass}>Select timeframe</option>
                {TIMEFRAME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value} className={optionClass}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label className={labelClass} htmlFor={ids.idea}>
              Business Idea Description <span aria-hidden="true">*</span>
            </label>
            <Textarea
              id={ids.idea}
              ref={fieldRefs.businessIdea}
              placeholder="Describe your business idea in detail. What problem does it solve? What makes it unique? Who are your customers? How will you make money?"
              value={form.businessIdea}
              maxLength={3000}
              required
              aria-invalid={Boolean(errors.businessIdea)}
              aria-describedby={[describedBy('businessIdea'), `${uid}-idea-count`].filter(Boolean).join(' ')}
              onChange={(e) => updateField('businessIdea', e.target.value)}
              className={`min-h-[140px] ${errors.businessIdea ? invalidClass : ''}`}
            />
            <div className="flex flex-wrap items-start justify-between gap-2">
              {errors.businessIdea ? (
                <p id={`${uid}-businessIdea-error`} role="alert" className={errorTextClass}>
                  {errors.businessIdea}
                </p>
              ) : (
                <span />
              )}
              <p id={`${uid}-idea-count`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {form.businessIdea.trim().length}/3000 (min {IDEA_MIN_LENGTH})
              </p>
            </div>
          </div>

          {generateError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              {generateError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={isGenerating}
              aria-busy={isGenerating}
              className="w-full sm:flex-1 min-h-[48px] text-lg font-semibold"
            >
              {isGenerating ? '🤖 Generating Business Plan…' : plan ? '🔄 Regenerate Business Plan' : '🚀 Generate Business Plan'}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto min-h-[48px]">
              🧹 Reset
            </Button>
          </div>
        </form>

        <p className="sr-only" aria-live="polite">{status}</p>

        {/* Generated Business Plan */}
        {plan && active && (
          <div ref={resultsRef} className="space-y-6 scroll-mt-4">
            {/* Section Navigation */}
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  📊 {plan.businessName} - Business Plan
                </h3>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="min-h-[44px] px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  📄 Download Plan (.txt)
                </button>
              </div>
              {inputsChanged && (
                <p className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                  You changed the form since this plan was generated. Click “Regenerate” to update it.
                </p>
              )}
              <div className="flex flex-wrap gap-2 sm:gap-3" role="group" aria-label="Business plan sections">
                {plan.sections.map((section) => {
                  const isActive = section.id === active.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      aria-pressed={isActive}
                      aria-controls={ids.panel}
                      onClick={() => setActiveSection(section.id)}
                      className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/20'
                      }`}
                    >
                      <span aria-hidden="true">{section.icon}</span> {section.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Section Content */}
            <section id={ids.panel} aria-labelledby={ids.panelHeading} className={cardClass}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 id={ids.panelHeading} className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  <span aria-hidden="true">{active.icon}</span> {active.title}
                </h3>
                <Button type="button" variant="outline" onClick={handleCopySection} className="min-h-[44px]">
                  📋 Copy Section
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-300">
                  {active.content}
                </pre>
              </div>
            </section>

            {/* Assumptions */}
            <div className={cardClass}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🧮 Assumptions used</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {plan.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Generated in your browser from the details you entered. Figures are estimates for planning - verify them before sharing with investors.
              </p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className={cardClass}>
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            ✨ Features
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
              >
                <div className="text-3xl mb-3" aria-hidden="true">{f.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIBusinessPlanGenerator;
