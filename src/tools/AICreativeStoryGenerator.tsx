import React, { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  GENRES,
  LENGTHS,
  MOODS,
  PROMPT_MAX_LENGTH,
  StoryInput,
  StoryResult,
  createStory,
  downloadStoryFile,
  validateStoryPrompt,
} from './lib/aiCreativeStoryGenerator';

const TOOL_ID = 'ai-creative-story-generator';
const TOOL_NAME = 'AI Creative Story Generator';
const HISTORY_LIMIT = 10;

const EMPTY_FORM: StoryInput = { prompt: '', genre: '', mood: '', length: 'short', characters: '', setting: '' };

const cardClass = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6';
const subCardClass = 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl';
const labelClass = 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300';
const selectClass =
  'w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const optionClass = 'bg-white dark:bg-gray-800';

const AICreativeStoryGenerator = () => {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const uid = useId();

  const [form, setForm] = useState<StoryInput>(EMPTY_FORM);
  const [promptError, setPromptError] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [variation, setVariation] = useState(0);
  const [history, setHistory] = useState<StoryResult[]>([]);
  const [status, setStatus] = useState('');

  const timerRef = useRef<number | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const update = <K extends keyof StoryInput>(key: K, value: StoryInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'prompt' && promptError) setPromptError('');
  };

  const runGeneration = (nextVariation: number) => {
    if (isGenerating) return;
    const error = validateStoryPrompt(form.prompt);
    if (error) {
      setPromptError(error);
      setStory(null);
      window.requestAnimationFrame(() => promptRef.current?.focus());
      return;
    }
    setPromptError('');
    setGenerateError('');
    setIsGenerating(true);
    setStatus('Writing your story…');
    const snapshot = { ...form };
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      try {
        const result = createStory(snapshot, nextVariation);
        setStory(result);
        setVariation(nextVariation);
        setHistory((prev) => [result, ...prev].slice(0, HISTORY_LIMIT));
        setStatus(`Story "${result.title}" is ready, ${result.wordCount} words.`);
        track('generate');
        window.requestAnimationFrame(() => titleRef.current?.focus());
      } catch {
        setGenerateError('Something went wrong while writing your story. Please try again.');
        setStatus('');
      } finally {
        setIsGenerating(false);
      }
    }, 450);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runGeneration(0);
  };

  const handleCopy = async () => {
    if (!story) return;
    try {
      await navigator.clipboard.writeText(`${story.title}\n\n${story.story}`);
      toast.success('Story copied to clipboard');
    } catch {
      toast.error('Could not access the clipboard. Select the text and copy it manually.');
    }
  };

  const handleDownload = () => {
    if (!story) return;
    try {
      downloadStoryFile(story);
      toast.success('Story downloaded');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setPromptError('');
    setGenerateError('');
    setStory(null);
    setVariation(0);
  };

  const backToForm = () => {
    setStory(null);
    window.requestAnimationFrame(() => promptRef.current?.focus());
  };

  const openFromHistory = (item: StoryResult) => {
    setStory(item);
    setStatus(`Showing "${item.title}".`);
    window.requestAnimationFrame(() => titleRef.current?.focus());
  };

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Generate creative stories with AI assistance. Perfect for writers, storytellers, and creative minds."
      toolCategory="AI"
    >
      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            📚 AI Creative Story Generator
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Turn your idea into a short story built around your premise, characters and setting
          </p>
        </div>

        <p className="sr-only" aria-live="polite">{status}</p>

        {!story ? (
          <div className="space-y-6">
            <form className={cardClass} onSubmit={handleSubmit} noValidate aria-busy={isGenerating}>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">✨ Story Configuration</h3>

              <div className="mb-4">
                <label className={labelClass} htmlFor={`${uid}-prompt`}>
                  Story Prompt <span aria-hidden="true">*</span>
                </label>
                <Textarea
                  id={`${uid}-prompt`}
                  ref={promptRef}
                  placeholder="Describe your story idea... e.g. “A lighthouse keeper finds a message in a bottle addressed to her, dated fifty years in the future.”"
                  value={form.prompt}
                  maxLength={PROMPT_MAX_LENGTH}
                  required
                  rows={4}
                  aria-invalid={Boolean(promptError)}
                  aria-describedby={promptError ? `${uid}-prompt-error` : `${uid}-prompt-hint`}
                  onChange={(e) => update('prompt', e.target.value)}
                  className="resize-y"
                />
                {promptError ? (
                  <p id={`${uid}-prompt-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {promptError}
                  </p>
                ) : (
                  <p id={`${uid}-prompt-hint`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {form.prompt.trim().length}/{PROMPT_MAX_LENGTH} · objects and people you mention become part of the story
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className={labelClass} htmlFor={`${uid}-genre`}>Genre</label>
                  <select id={`${uid}-genre`} className={selectClass} value={form.genre} onChange={(e) => update('genre', e.target.value)}>
                    <option value="" className={optionClass}>General fiction</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g} className={optionClass}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${uid}-mood`}>Mood</label>
                  <select id={`${uid}-mood`} className={selectClass} value={form.mood} onChange={(e) => update('mood', e.target.value)}>
                    <option value="" className={optionClass}>Balanced</option>
                    {MOODS.map((m) => (
                      <option key={m} value={m} className={optionClass}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${uid}-length`}>Length</label>
                  <select id={`${uid}-length`} className={selectClass} value={form.length} onChange={(e) => update('length', e.target.value)}>
                    {LENGTHS.map((l) => (
                      <option key={l.value} value={l.value} className={optionClass}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass} htmlFor={`${uid}-characters`}>Main Characters (optional)</label>
                  <Input
                    id={`${uid}-characters`}
                    placeholder="e.g., a knight named Rowan, a mysterious wizard"
                    value={form.characters}
                    maxLength={200}
                    aria-describedby={`${uid}-characters-hint`}
                    onChange={(e) => update('characters', e.target.value)}
                  />
                  <p id={`${uid}-characters-hint`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Separate with commas. The first is the protagonist, the second their ally.
                  </p>
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${uid}-setting`}>Setting (optional)</label>
                  <Input
                    id={`${uid}-setting`}
                    placeholder="e.g., a floating market, a futuristic city"
                    value={form.setting}
                    maxLength={120}
                    onChange={(e) => update('setting', e.target.value)}
                  />
                </div>
              </div>

              {generateError && (
                <p role="alert" className="mb-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {generateError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={isGenerating} className="min-h-[48px] sm:flex-1">
                  {isGenerating ? '✍️ Writing your story…' : '✍️ Generate Story'}
                </Button>
                <Button type="button" variant="outline" onClick={clearForm} className="min-h-[48px]">
                  🧹 Clear Form
                </Button>
              </div>
            </form>

            {isGenerating && (
              <div className={`${cardClass} text-center`} role="status">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-3" aria-hidden="true" />
                <p className="font-semibold text-gray-900 dark:text-white">Weaving characters, plot and setting together…</p>
              </div>
            )}

            {history.length > 0 && (
              <div className={cardClass}>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📖 Recent Stories</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Kept in this browser tab only.</p>
                <ul className="space-y-3">
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openFromHistory(item)}
                        className={`${subCardClass} w-full text-left p-3 hover:border-purple-400 dark:hover:border-purple-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                      >
                        <span className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <span className="min-w-0">
                            <span className="block font-medium text-gray-900 dark:text-white truncate">{item.title}</span>
                            <span className="block text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.story.slice(0, 140)}…</span>
                          </span>
                          <span className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2">
                            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 px-2 py-1 rounded">{item.genre}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.wordCount} words</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Story Header */}
            <div className={`${cardClass} text-center`}>
              <h3 ref={titleRef} tabIndex={-1} className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white focus:outline-none">
                {story.title}
              </h3>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                <span>📚 {story.genre}</span>
                <span>🎨 {story.mood}</span>
                <span>📝 {story.wordCount} words</span>
                <span>⏱️ {story.readingTime} min read</span>
              </div>
            </div>

            {/* The Story */}
            <article className={cardClass} aria-label={story.title}>
              <div className="max-w-none space-y-4 text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                {story.story.split('\n\n').map((paragraph, i) => (
                  <p key={`${story.id}-${i}`}>{paragraph}</p>
                ))}
              </div>
            </article>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="min-h-[44px] px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                📥 Download
              </button>
              <Button type="button" variant="outline" onClick={handleCopy} className="min-h-[44px]">
                📋 Copy
              </Button>
              <Button type="button" onClick={() => runGeneration(variation + 1)} disabled={isGenerating} className="min-h-[44px]">
                {isGenerating ? '✍️ Rewriting…' : '🔄 Another Version'}
              </Button>
              <Button type="button" variant="outline" onClick={backToForm} className="min-h-[44px]">
                ✏️ Edit Inputs
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearForm();
                  window.requestAnimationFrame(() => promptRef.current?.focus());
                }}
                className="min-h-[44px]"
              >
                ✍️ New Story
              </Button>
            </div>

            {/* Story Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className={cardClass}>
                <h3 className="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-300">📊 Plot Summary</h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{story.plotSummary}</p>
              </section>
              <section className={cardClass}>
                <h3 className="text-lg font-semibold mb-3 text-pink-700 dark:text-pink-300">👥 Characters</h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{story.characterAnalysis}</p>
              </section>
              <section className={cardClass}>
                <h3 className="text-lg font-semibold mb-3 text-amber-700 dark:text-amber-300">🎭 Themes</h3>
                <ul className="flex flex-wrap gap-2">
                  {story.themes.map((theme) => (
                    <li key={theme} className="text-sm font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                      {theme}
                    </li>
                  ))}
                </ul>
              </section>
              <section className={cardClass}>
                <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-300">🎨 Mood</h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{story.moodAnalysis}</p>
              </section>
            </div>

            <section className={cardClass}>
              <h3 className="text-lg font-semibold mb-3 text-orange-700 dark:text-orange-300">🔮 Sequel Ideas</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {story.sequelSuggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Composed in your browser from your prompt, characters and setting using genre and mood templates. Nothing is uploaded.
            </p>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AICreativeStoryGenerator;
