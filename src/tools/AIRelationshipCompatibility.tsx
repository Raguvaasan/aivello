import React, { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  CATEGORY_LABELS,
  COMMUNICATION_STYLES,
  CategoryId,
  CompatibilityResult,
  EMPTY_PERSON,
  LIFESTYLES,
  LOVE_LANGUAGES,
  MIN_FACTORS,
  PERSONALITY_TYPES,
  PersonErrors,
  PersonProfile,
  ZODIAC_SIGNS,
  calculateCompatibility,
  countComparableFactors,
  downloadCompatibilityReport,
  validatePerson,
} from './lib/aiRelationshipCompatibility';

const TOOL_ID = 'ai-relationship-compatibility';
const TOOL_NAME = 'AI Relationship Compatibility';

const cardClass = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6';
const labelClass = 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300';
const selectClass =
  'w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const optionClass = 'bg-white dark:bg-gray-800';
const errorTextClass = 'mt-1 text-sm text-red-600 dark:text-red-400';
const invalidClass = 'ring-2 ring-red-500 dark:ring-red-400';

type SelectField = 'zodiacSign' | 'personalityType' | 'loveLanguage' | 'communicationStyle' | 'lifestyle';

const SELECTS: { field: SelectField; label: string; placeholder: string; options: readonly string[] }[] = [
  { field: 'loveLanguage', label: 'Love Language', placeholder: 'Select love language…', options: LOVE_LANGUAGES },
  { field: 'communicationStyle', label: 'Communication Style', placeholder: 'Select style…', options: COMMUNICATION_STYLES },
  { field: 'personalityType', label: 'Personality Type', placeholder: 'Select personality…', options: PERSONALITY_TYPES },
  { field: 'lifestyle', label: 'Lifestyle', placeholder: 'Select lifestyle…', options: LIFESTYLES },
  { field: 'zodiacSign', label: 'Zodiac Sign (just for fun)', placeholder: 'Select zodiac sign…', options: ZODIAC_SIGNS },
];

const TEXTS: { field: 'interests' | 'values' | 'goals'; label: string; placeholder: string }[] = [
  { field: 'interests', label: 'Interests & Hobbies', placeholder: 'e.g., reading, hiking, cooking, music' },
  { field: 'values', label: 'Core Values', placeholder: 'e.g., family, honesty, adventure, security' },
  { field: 'goals', label: 'Life Goals', placeholder: 'e.g., travel the world, start a family, build a business' },
];

interface PersonFormProps {
  idPrefix: string;
  title: string;
  person: PersonProfile;
  errors: PersonErrors;
  nameRef: React.Ref<HTMLInputElement>;
  onChange: (field: keyof PersonProfile, value: string) => void;
}

const PersonForm = ({ idPrefix, title, person, errors, nameRef, onChange }: PersonFormProps) => (
  <fieldset className={`${cardClass} min-w-0`}>
    <legend className="sr-only">{title}</legend>
    <h3 className="text-xl font-semibold mb-4 text-pink-700 dark:text-pink-300" aria-hidden="true">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-name`}>
          Name <span aria-hidden="true">*</span>
        </label>
        <Input
          id={`${idPrefix}-name`}
          ref={nameRef}
          placeholder="Name"
          value={person.name}
          maxLength={40}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
          onChange={(e) => onChange('name', e.target.value)}
          className={errors.name ? invalidClass : ''}
        />
        {errors.name && <p id={`${idPrefix}-name-error`} role="alert" className={errorTextClass}>{errors.name}</p>}
      </div>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-age`}>Age (optional)</label>
        <Input
          id={`${idPrefix}-age`}
          type="number"
          inputMode="numeric"
          min={18}
          max={120}
          placeholder="Age"
          value={person.age}
          aria-invalid={Boolean(errors.age)}
          aria-describedby={errors.age ? `${idPrefix}-age-error` : undefined}
          onChange={(e) => onChange('age', e.target.value)}
          className={errors.age ? invalidClass : ''}
        />
        {errors.age && <p id={`${idPrefix}-age-error`} role="alert" className={errorTextClass}>{errors.age}</p>}
      </div>
      {SELECTS.map(({ field, label, placeholder, options }) => (
        <div key={field} className={field === 'zodiacSign' ? 'sm:col-span-2' : ''}>
          <label className={labelClass} htmlFor={`${idPrefix}-${field}`}>{label}</label>
          <select
            id={`${idPrefix}-${field}`}
            className={selectClass}
            value={person[field]}
            onChange={(e) => onChange(field, e.target.value)}
          >
            <option value="" className={optionClass}>{placeholder}</option>
            {options.map((o) => (
              <option key={o} value={o} className={optionClass}>{o}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 mt-4">
      {TEXTS.map(({ field, label, placeholder }) => (
        <div key={field}>
          <label className={labelClass} htmlFor={`${idPrefix}-${field}`}>{label}</label>
          <Input
            id={`${idPrefix}-${field}`}
            placeholder={placeholder}
            value={person[field]}
            maxLength={300}
            onChange={(e) => onChange(field, e.target.value)}
          />
        </div>
      ))}
    </div>
  </fieldset>
);

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

const AIRelationshipCompatibility = () => {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const uid = useId();

  const [person1, setPerson1] = useState<PersonProfile>(EMPTY_PERSON);
  const [person2, setPerson2] = useState<PersonProfile>(EMPTY_PERSON);
  const [errors1, setErrors1] = useState<PersonErrors>({});
  const [errors2, setErrors2] = useState<PersonErrors>({});
  const [formError, setFormError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [status, setStatus] = useState('');

  const timerRef = useRef<number | null>(null);
  const name1Ref = useRef<HTMLInputElement>(null);
  const name2Ref = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const change =
    (setPerson: React.Dispatch<React.SetStateAction<PersonProfile>>, setErrors: React.Dispatch<React.SetStateAction<PersonErrors>>) =>
    (field: keyof PersonProfile, value: string) => {
      setPerson((prev) => ({ ...prev, [field]: value }));
      if (field === 'name' || field === 'age') {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      setFormError('');
    };

  const comparable = countComparableFactors(person1, person2);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAnalyzing) return;
    const e1 = validatePerson(person1);
    const e2 = validatePerson(person2);
    setErrors1(e1);
    setErrors2(e2);
    if (Object.keys(e1).length || Object.keys(e2).length) {
      setFormError('Please fix the highlighted fields.');
      (Object.keys(e1).length ? name1Ref : name2Ref).current?.focus();
      return;
    }
    if (comparable < MIN_FACTORS) {
      setFormError(`Fill in at least ${MIN_FACTORS} of the same fields for both people (for example love language and interests) so there is something to compare.`);
      return;
    }
    setFormError('');
    setIsAnalyzing(true);
    setStatus('Analysing compatibility…');
    const p1 = { ...person1 };
    const p2 = { ...person2 };
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      try {
        const result = calculateCompatibility(p1, p2);
        setCompatibility(result);
        setStatus(`Compatibility score: ${result.overallScore} percent.`);
        track('analyze');
        window.requestAnimationFrame(() => resultsRef.current?.focus());
      } catch {
        setFormError('Something went wrong while analysing. Please try again.');
        setStatus('');
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);
  };

  const handleDownload = () => {
    if (!compatibility) return;
    try {
      downloadCompatibilityReport(person1, person2, compatibility);
      toast.success('Compatibility report downloaded');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  const resetForm = () => {
    setPerson1(EMPTY_PERSON);
    setPerson2(EMPTY_PERSON);
    setErrors1({});
    setErrors2({});
    setFormError('');
    setCompatibility(null);
    window.requestAnimationFrame(() => name1Ref.current?.focus());
  };

  const scoreRingOffset = compatibility ? compatibility.overallScore : 0;

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Analyze relationship compatibility with AI-powered insights into personality, zodiac, and lifestyle matches."
      toolCategory="AI"
    >
      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            💖 AI Relationship Compatibility
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Compare love languages, communication, lifestyle, values and goals to see where you click
          </p>
        </div>

        <p className="sr-only" aria-live="polite">{status}</p>

        {!compatibility ? (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate aria-busy={isAnalyzing}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonForm
                idPrefix={`${uid}-p1`}
                title="👤 Person 1"
                person={person1}
                errors={errors1}
                nameRef={name1Ref}
                onChange={change(setPerson1, setErrors1)}
              />
              <PersonForm
                idPrefix={`${uid}-p2`}
                title="👤 Person 2"
                person={person2}
                errors={errors2}
                nameRef={name2Ref}
                onChange={change(setPerson2, setErrors2)}
              />
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {comparable} comparable field{comparable === 1 ? '' : 's'} filled in for both people
              {comparable < MIN_FACTORS ? ` - at least ${MIN_FACTORS} needed` : ' - the more you add, the more accurate the result'}.
            </p>

            {formError && (
              <p role="alert" className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300 text-center">
                {formError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button type="submit" disabled={isAnalyzing} className="min-h-[48px] px-8">
                {isAnalyzing ? '💖 Analysing…' : '💖 Analyze Compatibility'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="min-h-[48px]">
                🧹 Clear Form
              </Button>
            </div>

            {isAnalyzing && (
              <div className={`${cardClass} text-center`} role="status">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600 dark:border-pink-400 mx-auto mb-3" aria-hidden="true" />
                <p className="font-semibold text-gray-900 dark:text-white">Comparing your answers…</p>
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className={`${cardClass} text-center`}>
              <h3 ref={resultsRef} tabIndex={-1} className="text-2xl font-bold mb-4 text-gray-900 dark:text-white focus:outline-none">
                {person1.name.trim()} & {person2.name.trim()}
              </h3>
              <div className="relative w-32 h-32 mx-auto mb-4" role="img" aria-label={`Overall compatibility ${compatibility.overallScore} percent`}>
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${scoreRingOffset}, 100`}
                    className="text-pink-500 dark:text-pink-400"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{compatibility.overallScore}%</span>
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{compatibility.verdict}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Based on {compatibility.factorsUsed} factors you both filled in</p>
            </div>

            {/* Breakdown */}
            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📊 Compatibility Breakdown</h3>
              <ul className="space-y-4">
                {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((category) => {
                  const score = compatibility.categories[category];
                  return (
                    <li key={category} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span className="sm:w-44 text-sm font-medium text-gray-700 dark:text-gray-300">{CATEGORY_LABELS[category]}</span>
                      {score === null ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">Not enough info</span>
                      ) : (
                        <span className="flex flex-1 items-center gap-3">
                          <span className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3" aria-hidden="true">
                            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300" style={{ width: `${score}%` }} />
                          </span>
                          <span className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">{score}%</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {(compatibility.sharedInterests.length > 0 || compatibility.sharedValues.length > 0) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {[...compatibility.sharedInterests, ...compatibility.sharedValues].map((item) => (
                    <span key={item} className="text-xs font-medium px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListCard title="💪 Relationship Strengths" items={compatibility.strengths} titleClass="text-green-700 dark:text-green-300" dotClass="text-green-600 dark:text-green-400" />
              <ListCard title="⚠️ Potential Challenges" items={compatibility.challenges} titleClass="text-orange-700 dark:text-orange-300" dotClass="text-orange-600 dark:text-orange-400" />
            </div>

            {(compatibility.personalityMatch || compatibility.communicationAdvice || compatibility.zodiacCompatibility) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {compatibility.communicationAdvice && (
                  <section className={cardClass}>
                    <h3 className="text-xl font-semibold mb-3 text-blue-700 dark:text-blue-300">🗣️ Communication</h3>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{compatibility.communicationAdvice}</p>
                  </section>
                )}
                {compatibility.personalityMatch && (
                  <section className={cardClass}>
                    <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-300">🧠 Personality Match</h3>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{compatibility.personalityMatch}</p>
                  </section>
                )}
                {compatibility.zodiacCompatibility && (
                  <section className={cardClass}>
                    <h3 className="text-xl font-semibold mb-3 text-indigo-700 dark:text-indigo-300">🌟 Zodiac</h3>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{compatibility.zodiacCompatibility}</p>
                  </section>
                )}
              </div>
            )}

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-3 text-pink-700 dark:text-pink-300">🔮 Long-term Potential</h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{compatibility.longTermPotential}</p>
            </section>

            <ListCard title="💡 Relationship Tips" items={compatibility.relationshipTips} titleClass="text-amber-700 dark:text-amber-300" dotClass="text-amber-600 dark:text-amber-400" />

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-4 text-teal-700 dark:text-teal-300">🎯 Date Ideas</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {compatibility.dateIdeas.map((idea) => (
                  <li key={idea} className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {idea}
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListCard title="🤝 Conflict Resolution" items={compatibility.conflictResolution} titleClass="text-indigo-700 dark:text-indigo-300" dotClass="text-indigo-600 dark:text-indigo-400" />
              <ListCard title="🌱 Areas to Grow" items={compatibility.improvementAreas} titleClass="text-green-700 dark:text-green-300" dotClass="text-green-600 dark:text-green-400" />
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Calculated in your browser from the answers above. For entertainment and reflection only - no quiz can predict a relationship.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="min-h-[44px] px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                📊 Download Report
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCompatibility(null);
                  window.requestAnimationFrame(() => name1Ref.current?.focus());
                }}
                className="min-h-[44px]"
              >
                ✏️ Edit Answers
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="min-h-[44px]">
                🔄 New Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIRelationshipCompatibility;
