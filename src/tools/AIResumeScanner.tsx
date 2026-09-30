import React, { useId, useMemo, useRef, useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  analyzeResume,
  MAX_TEXT_LENGTH,
  MIN_JOB_WORDS,
  MIN_RESUME_WORDS,
  type ResumeAnalysis,
} from './lib/aiResumeScanner';
import { ACCEPTED_RESUME_TYPES, extractResumeText, ResumeFileError, type ResumeFileKind } from './lib/aiResumeScannerFiles';

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500';
const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl shadow-lg dark:shadow-2xl';
const SUB_CARD = 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl';
const SECONDARY_BUTTON =
  'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20 ' +
  'hover:bg-gray-200 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50';

interface UploadedFileInfo {
  name: string;
  size: number;
  kind: ResumeFileKind;
  truncated: boolean;
}

const countWords = (text: string): number => (text.trim() ? text.trim().split(/\s+/).length : 0);

const scoreColor = (score: number): string =>
  score >= 75 ? 'text-green-600 dark:text-green-400' : score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

const barColor = (ratio: number): string => (ratio >= 0.75 ? 'bg-green-500' : ratio >= 0.5 ? 'bg-amber-500' : 'bg-red-500');

const Check: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <li className="flex items-center gap-2 text-sm">
    <span
      aria-hidden="true"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        ok ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
      }`}
    >
      {ok ? '✓' : '✕'}
    </span>
    <span className="text-gray-700 dark:text-gray-200">{label}</span>
    <span className="sr-only">{ok ? 'found' : 'missing'}</span>
  </li>
);

const AIResumeScanner: React.FC = () => {
  const id = useId();
  const track = useToolTracking('ai-resume-scanner', 'AI Resume Scanner');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ignores the result of an older upload if the user picks another file meanwhile.
  const uploadIdRef = useRef(0);

  const ids = {
    file: `${id}-file`,
    fileHelp: `${id}-file-help`,
    fileError: `${id}-file-error`,
    resume: `${id}-resume`,
    resumeCount: `${id}-resume-count`,
    job: `${id}-job`,
    jobCount: `${id}-job-count`,
    formError: `${id}-form-error`,
    results: `${id}-results`,
  };

  const resumeWords = useMemo(() => countWords(resumeText), [resumeText]);
  const jobWords = useMemo(() => countWords(jobDescription), [jobDescription]);

  const processFile = async (file: File) => {
    const uploadId = ++uploadIdRef.current;
    setFileError(null);
    setFormError(null);
    setIsProcessing(true);
    try {
      const result = await extractResumeText(file);
      if (uploadId !== uploadIdRef.current) return;
      setResumeText(result.text.slice(0, MAX_TEXT_LENGTH));
      setUploadedFile({ name: file.name, size: file.size, kind: result.kind, truncated: result.truncated });
      setAnalysis(null);
    } catch (err) {
      if (uploadId !== uploadIdRef.current) return;
      setUploadedFile(null);
      setFileError(
        err instanceof ResumeFileError
          ? err.message
          : 'This file could not be read. Try another file, or paste your resume text below.'
      );
    } finally {
      if (uploadId === uploadIdRef.current) setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again still fires a change event.
    event.target.value = '';
    if (file) void processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !isProcessing) void processFile(file);
  };

  const runAnalysis = () => {
    if (resumeWords < MIN_RESUME_WORDS) {
      setFormError(`Add your resume: upload a file or paste at least ${MIN_RESUME_WORDS} words (currently ${resumeWords}).`);
      return;
    }
    if (jobWords < MIN_JOB_WORDS) {
      setFormError(`Paste the job description (at least ${MIN_JOB_WORDS} words) so keywords can be compared.`);
      return;
    }
    setFormError(null);
    setAnalysis(analyzeResume(resumeText, jobDescription));
    track('analyze');
    window.requestAnimationFrame(() => document.getElementById(ids.results)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const reset = () => {
    uploadIdRef.current += 1;
    setResumeText('');
    setJobDescription('');
    setAnalysis(null);
    setUploadedFile(null);
    setFileError(null);
    setFormError(null);
    setIsProcessing(false);
  };

  return (
    <ToolWrapper
      toolId="ai-resume-scanner"
      toolName="AI Resume Scanner"
      toolDescription="Optimize your resume for ATS systems and improve your chances of getting hired"
      toolCategory="Career"
    >
      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className={`${CARD} p-4 sm:p-6`}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Resume Scanner</h2>
          <p className="mt-1 mb-6 text-sm text-gray-600 dark:text-gray-300">
            Compare your resume with a job description the way an applicant tracking system (ATS) would. Files are read in your
            browser and never uploaded.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className={LABEL} id={`${ids.file}-label`}>
                  Upload resume
                </p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragActive) setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-3 w-full min-h-[8rem] px-4 py-5 text-center border-2 border-dashed rounded-xl transition-colors ${
                    dragActive
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/40'
                  }`}
                >
                  <input
                    id={ids.file}
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_RESUME_TYPES}
                    onChange={handleFileChange}
                    aria-labelledby={`${ids.file}-label`}
                    aria-describedby={ids.fileHelp}
                  />
                  {isProcessing ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400" role="status">
                      <span className="animate-spin h-5 w-5 rounded-full border-2 border-purple-500/30 border-t-purple-500" aria-hidden="true" />
                      Reading your resume…
                    </p>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[44px] px-5 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        {uploadedFile ? 'Choose another file' : 'Choose a file'}
                      </button>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {uploadedFile ? (
                          <>
                            <span className="font-medium">{uploadedFile.name}</span> ({(uploadedFile.size / 1024).toFixed(0)} KB) ·{' '}
                            {resumeWords} words extracted
                          </>
                        ) : (
                          'or drag and drop it here'
                        )}
                      </p>
                    </>
                  )}
                  <p id={ids.fileHelp} className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, DOCX or TXT, up to 10 MB
                  </p>
                </div>
                {uploadedFile?.truncated && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Only the first 15 pages were read.</p>
                )}
                {fileError && (
                  <p id={ids.fileError} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {fileError}
                  </p>
                )}
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.resume}>
                  Resume text <span className="font-normal text-gray-500 dark:text-gray-400">(extracted from the file, or paste it)</span>
                </label>
                <textarea
                  id={ids.resume}
                  className={`${INPUT} h-56 resize-y text-sm`}
                  placeholder="Paste your resume content here…"
                  value={resumeText}
                  maxLength={MAX_TEXT_LENGTH}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  aria-describedby={ids.resumeCount}
                />
                <p id={ids.resumeCount} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {resumeWords} words
                </p>
              </div>
            </div>

            <div>
              <label className={LABEL} htmlFor={ids.job}>
                Job description
              </label>
              <textarea
                id={ids.job}
                className={`${INPUT} h-[25.5rem] resize-y text-sm`}
                placeholder="Paste the full job description here…"
                value={jobDescription}
                maxLength={MAX_TEXT_LENGTH}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (formError) setFormError(null);
                }}
                aria-describedby={ids.jobCount}
              />
              <p id={ids.jobCount} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {jobWords} words
              </p>
            </div>
          </div>

          {formError && (
            <p id={ids.formError} role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="min-h-[44px] px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              onClick={runAnalysis}
              disabled={isProcessing}
              aria-describedby={formError ? ids.formError : undefined}
            >
              {analysis ? 'Re-analyze Resume' : 'Analyze Resume'}
            </button>
            {(resumeText || jobDescription) && (
              <button type="button" className={SECONDARY_BUTTON} onClick={reset}>
                Clear all
              </button>
            )}
          </div>
        </div>

        <div id={ids.results} aria-live="polite" className="scroll-mt-4">
          {analysis && (
            <section className={`${CARD} p-4 sm:p-6 space-y-6`} aria-label="Analysis results">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Analysis results</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${SUB_CARD} p-4`}>
                  <p className="text-sm text-gray-600 dark:text-gray-300">ATS compatibility</p>
                  <p className={`text-4xl font-bold ${scoreColor(analysis.score)}`}>{analysis.score}%</p>
                </div>
                <div className={`${SUB_CARD} p-4`}>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Keyword match</p>
                  <p className={`text-4xl font-bold ${scoreColor(analysis.keywordMatch)}`}>{analysis.keywordMatch}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {analysis.matchedKeywords.length} of {analysis.matchedKeywords.length + analysis.missingKeywords.length} job keywords
                  </p>
                </div>
                <div className={`${SUB_CARD} p-4`}>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Readability</p>
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{analysis.readability}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Flesch score · {analysis.wordCount} words · {analysis.metricsCount} metrics
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-medium text-gray-900 dark:text-white">Score breakdown</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {analysis.breakdown.map((item) => (
                    <li key={item.label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.score}/{item.max}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-200 dark:bg-white/10" aria-hidden="true">
                        <div
                          className={`h-2 rounded-full ${barColor(item.score / item.max)}`}
                          style={{ width: `${Math.round((item.score / item.max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="mb-2 font-medium text-green-600 dark:text-green-400">Matched keywords</h4>
                  {analysis.matchedKeywords.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {analysis.matchedKeywords.map((k) => (
                        <li key={k} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                          {k}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No job keywords found in your resume yet.</p>
                  )}
                </div>
                <div>
                  <h4 className="mb-2 font-medium text-red-600 dark:text-red-400">Missing keywords</h4>
                  {analysis.missingKeywords.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((k) => (
                        <li key={k} className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                          {k}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">None. Every key term from the job description appears.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${SUB_CARD} p-4`}>
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Sections</h4>
                  <ul className="space-y-2">
                    {analysis.sections.map((s) => (
                      <Check key={s.name} ok={s.found} label={s.name} />
                    ))}
                  </ul>
                </div>
                <div className={`${SUB_CARD} p-4`}>
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Contact details</h4>
                  <ul className="space-y-2">
                    <Check ok={analysis.contact.email} label="Email address" />
                    <Check ok={analysis.contact.phone} label="Phone number" />
                    <Check ok={analysis.contact.linkedin} label="LinkedIn profile" />
                  </ul>
                </div>
              </div>

              {analysis.formatIssues.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium text-amber-600 dark:text-amber-400">Formatting issues</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                    {analysis.formatIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Suggested improvements</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  {analysis.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scores are an estimate based on common ATS checks. Real systems differ, so use this as a guide and only add
                keywords that truthfully describe your experience.
              </p>
            </section>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIResumeScanner;
