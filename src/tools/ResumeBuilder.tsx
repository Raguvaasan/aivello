import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { QRCode } from 'react-qrcode-logo';
import { FaDownload, FaFileWord, FaPrint, FaSpinner, FaTrash, FaPlus, FaMagic, FaSave, FaUndo } from 'react-icons/fa';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { IconWrapper } from '../components/common/IconWrapper';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { logger } from '../utils/logger';
import {
  ACCENTS,
  AVAILABILITY_OPTIONS,
  AccentId,
  CAREER_LEVELS,
  FONTS,
  FontId,
  INDUSTRIES,
  ResumeData,
  ResumeDesign,
  ResumeListKey,
  ResumeTextField,
  SKILL_LEVEL_LABELS,
  TEMPLATES,
  TemplateId,
  WORK_AUTHORIZATION_OPTIONS,
  addSuggestedSkills,
  additionalDetails,
  analyzeResume,
  clampLevel,
  createEmptyResume,
  createId,
  createSampleResume,
  displayUrl,
  emptyCertification,
  emptyEducation,
  emptyExperience,
  emptyLanguage,
  emptyProject,
  emptySkill,
  extractKeywords,
  filledCertifications,
  filledEducation,
  filledExperiences,
  filledLanguages,
  filledProjects,
  filledSkills,
  generateObjective,
  generateSummary,
  hasResumeContent,
  isAccentId,
  isFontId,
  isTemplateId,
  isValidEmail,
  keywordCoverage,
  normalizeUrl,
  resumeFileBase,
  resumeLinks,
  sanitizeResume,
  skillLevelLabel,
  splitDescription,
  templateById,
} from './lib/resumeBuilderData';
import { hasUnsupportedPdfChars } from './lib/pdfSafeText';

/* ------------------------------------------------------------------ setup */

const STEPS = ['Basic info', 'Experience', 'Skills', 'Education', 'Review & export'] as const;

const DRAFT_KEY = 'aivello:resume-builder:draft';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const DEFAULT_DESIGN: ResumeDesign = { templateId: 'classic', accent: 'blue', font: 'sans' };

type ListItem<K extends ResumeListKey> = ResumeData[K][number];
type ExportKind = 'pdf' | 'docx' | 'print';

interface StoredDraft {
  savedAt: string;
  form: ResumeData;
  design: ResumeDesign;
}

const cardClass = 'rounded-2xl bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-sm';
const subCardClass = 'rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
const selectClass =
  'w-full px-3 py-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const optionClass = 'bg-white dark:bg-gray-800';
const sectionTitleClass = 'text-lg font-semibold text-gray-900 dark:text-white';
const hintClass = 'mt-1 text-xs text-gray-500 dark:text-gray-400';
const removeButtonClass =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed';
const chipButtonClass =
  'px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:hover:bg-purple-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50';

/* --------------------------------------------------------------- helpers */

const readDraft = (): StoredDraft | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { savedAt, form, design } = parsed as { savedAt?: unknown; form?: unknown; design?: unknown };
    const safeForm = sanitizeResume(form);
    if (!safeForm) return null;
    const d = (typeof design === 'object' && design !== null ? design : {}) as Record<string, unknown>;
    return {
      savedAt: typeof savedAt === 'string' ? savedAt : '',
      form: safeForm,
      design: {
        templateId: isTemplateId(d.templateId) ? d.templateId : DEFAULT_DESIGN.templateId,
        accent: isAccentId(d.accent) ? d.accent : DEFAULT_DESIGN.accent,
        font: isFontId(d.font) ? d.font : DEFAULT_DESIGN.font,
      },
    };
  } catch {
    return null;
  }
};

const formatSavedAt = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

/** Square-crops and downsizes a photo to a small JPEG data URL (also strips EXIF data). */
const preparePhoto = (file: File, size = 320): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const out = Math.min(size, side);
        const canvas = document.createElement('canvas');
        canvas.width = out;
        canvas.height = out;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas is not available');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out, out);
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image'));
    };
    img.src = url;
  });

/* ---------------------------------------------------------------- preview */

const PreviewSection: React.FC<{ title: string; accent: string; children: React.ReactNode }> = ({
  title,
  accent,
  children,
}) => (
  <section>
    <h3
      className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2"
      style={{ color: accent, borderColor: accent }}
    >
      {title}
    </h3>
    {children}
  </section>
);

const PreviewDescription: React.FC<{ text: string }> = ({ text }) => {
  const parts = splitDescription(text);
  const bullets = parts.filter((p) => p.bullet);
  const paragraphs = parts.filter((p) => !p.bullet);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={`p-${i}`} className="text-gray-700 break-words">
          {p.text}
        </p>
      ))}
      {bullets.length > 0 && (
        <ul className="list-disc pl-5 text-gray-700 space-y-0.5">
          {bullets.map((b, i) => (
            <li key={`b-${i}`} className="break-words">
              {b.text}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/**
 * The "paper". It stays white with dark text in both themes because it represents
 * the printed page; accent colour and font come from the chosen design.
 */
const ResumePreview = React.memo(function ResumePreview({ form, design }: { form: ResumeData; design: ResumeDesign }) {
  const template = templateById(design.templateId);
  const accent = ACCENTS[design.accent].hex;
  const band = template.header === 'band';
  const centered = template.header === 'center';
  const links = resumeLinks(form);
  const linkedin = normalizeUrl(form.linkedin);
  const contact = [form.email, form.phone, form.address].map((s) => s.trim()).filter(Boolean);

  const experiences = filledExperiences(form);
  const projects = filledProjects(form);
  const education = filledEducation(form);
  const skills = filledSkills(form);
  const certifications = filledCertifications(form);
  const languages = filledLanguages(form);
  const details = additionalDetails(form);
  const empty = !hasResumeContent(form);

  return (
    <div
      className="bg-white text-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden text-sm"
      style={{ fontFamily: FONTS[design.font].css }}
    >
      <header
        className={`p-5 sm:p-6 ${band ? 'text-white' : 'border-b-2'}`}
        style={band ? { backgroundColor: accent } : { borderColor: accent }}
      >
        <div className={`flex gap-4 ${centered ? 'flex-col-reverse items-center text-center sm:flex-row sm:text-left sm:items-start' : 'items-start'}`}>
          <div className={`flex-1 min-w-0 ${centered ? 'sm:text-center' : ''}`}>
            <p className="text-2xl font-bold break-words" style={band ? undefined : { color: accent }}>
              {form.name.trim() || 'Your Name'}
            </p>
            {form.targetRole.trim() && (
              <p className={`text-base ${band ? 'text-white/90' : 'text-gray-700'}`}>{form.targetRole}</p>
            )}
            {contact.length > 0 && (
              <p className={`mt-1 break-words ${band ? 'text-white/85' : 'text-gray-600'}`}>{contact.join('  |  ')}</p>
            )}
            {links.length > 0 && (
              <p className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 ${centered ? 'justify-center' : ''}`}>
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline-offset-2 hover:underline break-all ${band ? 'text-white' : ''}`}
                    style={band ? undefined : { color: accent }}
                  >
                    {displayUrl(link.href)}
                  </a>
                ))}
              </p>
            )}
          </div>
          {form.profilePhoto && (
            <img src={form.profilePhoto} alt="Profile" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shrink-0" />
          )}
          {linkedin && !form.profilePhoto && (
            <div className="hidden sm:block text-center shrink-0 bg-white rounded p-1">
              <QRCode value={linkedin} size={64} quietZone={2} />
              <p className="text-[10px] text-gray-500">LinkedIn</p>
            </div>
          )}
        </div>
      </header>

      <div className="p-5 sm:p-6 space-y-5">
        {empty && (
          <p className="text-center text-gray-500 py-8">
            Your resume preview will appear here as you fill in the form.
          </p>
        )}

        {form.summary.trim() && (
          <PreviewSection title="Professional Summary" accent={accent}>
            <PreviewDescription text={form.summary} />
          </PreviewSection>
        )}

        {form.objective.trim() && (
          <PreviewSection title="Career Objective" accent={accent}>
            <PreviewDescription text={form.objective} />
          </PreviewSection>
        )}

        {experiences.length > 0 && (
          <PreviewSection title="Experience" accent={accent}>
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <p className="font-semibold text-gray-900 break-words">
                      {[exp.role.trim(), exp.company.trim()].filter(Boolean).join(' - ')}
                    </p>
                    {exp.duration.trim() && <p className="text-gray-500 text-xs pt-0.5">{exp.duration}</p>}
                  </div>
                  {exp.location.trim() && <p className="text-gray-500 italic text-xs">{exp.location}</p>}
                  {exp.description.trim() && <PreviewDescription text={exp.description} />}
                </div>
              ))}
            </div>
          </PreviewSection>
        )}

        {projects.length > 0 && (
          <PreviewSection title="Projects" accent={accent}>
            <div className="space-y-3">
              {projects.map((project) => {
                const link = normalizeUrl(project.link);
                return (
                  <div key={project.id}>
                    <p className="font-semibold text-gray-900 break-words">{project.title}</p>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs break-all hover:underline" style={{ color: accent }}>
                        {displayUrl(link)}
                      </a>
                    )}
                    {project.description.trim() && <PreviewDescription text={project.description} />}
                  </div>
                );
              })}
            </div>
          </PreviewSection>
        )}

        {education.length > 0 && (
          <PreviewSection title="Education" accent={accent}>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <p className="font-semibold text-gray-900 break-words">{edu.degree.trim() || edu.institution}</p>
                    {edu.year.trim() && <p className="text-gray-500 text-xs pt-0.5">{edu.year}</p>}
                  </div>
                  {edu.degree.trim() && (edu.institution.trim() || edu.location.trim()) && (
                    <p className="text-gray-600">{[edu.institution.trim(), edu.location.trim()].filter(Boolean).join(', ')}</p>
                  )}
                  {edu.gpa.trim() && <p className="text-gray-600 text-xs">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          </PreviewSection>
        )}

        {skills.length > 0 && (
          <PreviewSection title="Skills" accent={accent}>
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li key={skill.id} className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-800">
                  {skill.name}
                  <span className="text-gray-500"> · {skillLevelLabel(skill.level)}</span>
                </li>
              ))}
            </ul>
          </PreviewSection>
        )}

        {certifications.length > 0 && (
          <PreviewSection title="Certifications" accent={accent}>
            <ul className="list-disc pl-5 text-gray-700 space-y-0.5">
              {certifications.map((c) => (
                <li key={c.id}>
                  {[c.name.trim(), c.issuer.trim()].filter(Boolean).join(' - ')}
                  {c.year.trim() && ` (${c.year.trim()})`}
                </li>
              ))}
            </ul>
          </PreviewSection>
        )}

        {languages.length > 0 && (
          <PreviewSection title="Languages" accent={accent}>
            <p className="text-gray-700">
              {languages
                .map((l) => (l.proficiency.trim() ? `${l.language.trim()} (${l.proficiency.trim()})` : l.language.trim()))
                .join('  •  ')}
            </p>
          </PreviewSection>
        )}

        {details.length > 0 && (
          <PreviewSection title="Additional Information" accent={accent}>
            <dl className="text-gray-700 space-y-0.5">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="inline font-medium">{label}: </dt>
                  <dd className="inline">{value}</dd>
                </div>
              ))}
            </dl>
          </PreviewSection>
        )}
      </div>
    </div>
  );
});

/* -------------------------------------------------------------- component */

const ResumeBuilder = () => {
  const track = useToolTracking('resume-builder', 'AI Resume Builder');
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  const [form, setForm] = useState<ResumeData>(createEmptyResume);
  const [design, setDesign] = useState<ResumeDesign>(DEFAULT_DESIGN);
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [jobDescription, setJobDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [exportErrors, setExportErrors] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string>(() => readDraft()?.savedAt ?? '');

  const mounted = useRef(true);
  const objectUrls = useRef<string[]>([]);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const urls = objectUrls.current;
    return () => {
      mounted.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Move focus to the step heading when the user changes step (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [step]);

  /* ------------------------------------------------------------ updates */

  const setField = useCallback((field: ResumeTextField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateListItem = useCallback(
    <K extends ResumeListKey>(key: K, id: string, patch: Partial<ListItem<K>>) => {
      setForm((prev) => {
        const items = prev[key] as ListItem<K>[];
        return { ...prev, [key]: items.map((item) => (item.id === id ? { ...item, ...patch } : item)) };
      });
    },
    []
  );

  const addListItem = useCallback(<K extends ResumeListKey>(key: K, item: ListItem<K>) => {
    setForm((prev) => ({ ...prev, [key]: [...(prev[key] as ListItem<K>[]), item] }));
    requestAnimationFrame(() => document.getElementById(`${uid}-${item.id}-first`)?.focus());
  }, [uid]);

  const removeListItem = useCallback(<K extends ResumeListKey>(key: K, id: string) => {
    setForm((prev) => {
      const items = prev[key] as ListItem<K>[];
      return items.length <= 1 ? prev : { ...prev, [key]: items.filter((item) => item.id !== id) };
    });
  }, []);

  /** Replaces the whole form, offering an undo when that would discard the user's work. */
  const replaceForm = useCallback(
    (next: ResumeData, message: string, nextDesign?: ResumeDesign) => {
      const previous = form;
      const previousDesign = design;
      setForm(next);
      if (nextDesign) setDesign(nextDesign);
      setExportErrors([]);
      if (!hasResumeContent(previous)) {
        toast.success(message);
        return;
      }
      toast(
        (t) => (
          <span className="flex items-center gap-3">
            {message}
            <button
              type="button"
              onClick={() => {
                setForm(previous);
                setDesign(previousDesign);
                toast.dismiss(t.id);
              }}
              className="font-semibold text-purple-600 dark:text-purple-400 underline"
            >
              Undo
            </button>
          </span>
        ),
        { duration: 6000 }
      );
    },
    [form, design]
  );

  /** Sets a text field, offering an undo when it overwrites existing text. */
  const replaceText = (field: 'summary' | 'objective', value: string, label: string) => {
    const previous = form[field];
    setField(field, value);
    if (!previous.trim()) {
      toast.success(`${label} added - edit it to make it yours.`);
      return;
    }
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          {label} replaced.
          <button
            type="button"
            onClick={() => {
              setField(field, previous);
              toast.dismiss(t.id);
            }}
            className="font-semibold text-purple-600 dark:text-purple-400 underline"
          >
            Undo
          </button>
        </span>
      ),
      { duration: 6000 }
    );
  };

  const suggestSkills = () => {
    const { skills, added } = addSuggestedSkills(form);
    if (added.length === 0) {
      toast(`Your skills already cover the common ${form.industry} skills.`);
      return;
    }
    setForm((prev) => ({ ...prev, skills }));
    toast.success(`Added ${added.join(', ')}`);
  };

  const addSkillByName = (name: string) => {
    if (form.skills.some((s) => s.name.trim().toLowerCase() === name.toLowerCase())) return;
    setForm((prev) => ({ ...prev, skills: [...filledSkills(prev), { id: createId(), name, level: 3 }] }));
    toast.success(`Added “${name}” to your skills`);
  };

  const chooseTemplate = (templateId: TemplateId) => {
    const template = templateById(templateId);
    setDesign({ templateId, accent: template.accent, font: template.font });
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Please choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('The photo must be smaller than 5MB.');
      return;
    }
    try {
      const dataUrl = await preparePhoto(file);
      if (mounted.current) setForm((prev) => ({ ...prev, profilePhoto: dataUrl }));
    } catch {
      if (mounted.current) setPhotoError('Could not read this image. Please try another one.');
    }
  };

  /* ------------------------------------------------------------- drafts */

  const saveDraft = () => {
    const savedAt = new Date().toISOString();
    try {
      const draft: StoredDraft = { savedAt, form, design };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(savedAt);
      toast.success('Draft saved in this browser');
    } catch {
      toast.error('Could not save the draft - browser storage may be full or disabled.');
    }
  };

  const loadDraft = () => {
    const draft = readDraft();
    if (!draft) {
      toast.error('No saved draft found in this browser.');
      setDraftSavedAt('');
      return;
    }
    replaceForm(draft.form, 'Draft loaded.', draft.design);
  };

  /* ------------------------------------------------------------ derived */

  const analysis = useMemo(() => analyzeResume(form), [form]);
  const coverage = useMemo(() => keywordCoverage(form, keywords), [form, keywords]);
  const emailInvalid = form.email.trim() !== '' && !isValidEmail(form.email);
  const pdfCharWarning = useMemo(
    () =>
      hasUnsupportedPdfChars(
        [
          form.name, form.targetRole, form.email, form.phone, form.address, form.summary, form.objective,
          ...form.skills.map((s) => s.name),
          ...form.languages.flatMap((l) => [l.language, l.proficiency]),
          ...form.experiences.flatMap((e) => [e.company, e.role, e.duration, e.location, e.description]),
          ...form.education.flatMap((e) => [e.institution, e.degree, e.year, e.gpa, e.location]),
          ...form.projects.flatMap((p) => [p.title, p.description]),
          ...form.certifications.flatMap((c) => [c.name, c.issuer, c.year]),
          form.salaryExpectation,
        ].join('\n')
      ),
    [form]
  );

  /* ------------------------------------------------------------- export */

  const validateForExport = (): boolean => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push('Add your full name (step 1, Basic info).');
    if (emailInvalid) errors.push('Fix your email address (step 1, Basic info).');
    const hasBody =
      form.summary.trim() ||
      filledExperiences(form).length ||
      filledEducation(form).length ||
      filledSkills(form).length ||
      filledProjects(form).length;
    if (!hasBody) errors.push('Add at least a summary, experience, education or skills.');
    setExportErrors(errors);
    if (errors.length) setEmailTouched(true);
    return errors.length === 0;
  };

  const handleExport = async (kind: ExportKind) => {
    if (exporting || !validateForExport()) return;
    // Opened synchronously so the click's user activation is still valid: popup
    // blockers reject window.open() after the awaits below.
    const printWindow = kind === 'print' ? window.open('', '_blank') : null;
    setExporting(kind);

    try {
      const exporter = await import('./lib/resumeBuilderExport');
      const base = resumeFileBase(form.name);

      if (kind === 'docx') {
        const [blob, { saveAs }] = await Promise.all([exporter.buildResumeDocx(form, design), import('file-saver')]);
        saveAs(blob, `${base}.docx`);
        track('download');
        toast.success('Word document downloaded');
        return;
      }

      const doc = await exporter.buildResumePdf(form, design);
      if (kind === 'pdf') {
        doc.save(`${base}.pdf`);
        track('download');
        toast.success('PDF downloaded');
        return;
      }

      doc.autoPrint();
      const url = URL.createObjectURL(doc.output('blob'));
      objectUrls.current.push(url);
      if (printWindow && !printWindow.closed) {
        printWindow.opener = null;
        printWindow.location.href = url;
      } else {
        doc.save(`${base}.pdf`);
        toast('Pop-ups are blocked, so the PDF was downloaded instead. Print it from there.');
      }
      track('use');
    } catch (error) {
      printWindow?.close();
      logger.error('Resume export failed', error);
      if (mounted.current) setExportErrors(['The export failed. Please try again.']);
    } finally {
      if (mounted.current) setExporting(null);
    }
  };

  /* ------------------------------------------------------------- render */

  const textInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    opts: {
      type?: string;
      placeholder?: string;
      autoComplete?: string;
      maxLength?: number;
      error?: string;
      className?: string;
      onBlur?: () => void;
      required?: boolean;
    } = {}
  ) => (
    <div className={opts.className}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {opts.required && <span className="text-red-600 dark:text-red-400"> *</span>}
      </label>
      <Input
        id={id}
        type={opts.type ?? 'text'}
        value={value}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete ?? 'off'}
        maxLength={opts.maxLength ?? 200}
        onChange={(e) => onChange(e.target.value)}
        onBlur={opts.onBlur}
        aria-invalid={opts.error ? true : undefined}
        aria-describedby={opts.error ? `${id}-error` : undefined}
        className={opts.error ? '!border-red-500 dark:!border-red-400' : ''}
      />
      {opts.error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {opts.error}
        </p>
      )}
    </div>
  );

  const textArea = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    opts: { placeholder?: string; rows?: number; hint?: string; maxLength?: number } = {}
  ) => (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Textarea
        id={id}
        value={value}
        placeholder={opts.placeholder}
        rows={opts.rows ?? 4}
        maxLength={opts.maxLength ?? 5000}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={opts.hint ? `${id}-hint` : undefined}
        className="resize-y"
      />
      {opts.hint && (
        <p id={`${id}-hint`} className={hintClass}>
          {opts.hint}
        </p>
      )}
    </div>
  );

  const entryHeader = (title: string, onRemove: () => void, canRemove: boolean) => (
    <div className="flex items-center justify-between gap-2 mb-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Remove ${title.toLowerCase()}`}
        className={removeButtonClass}
      >
        <IconWrapper icon={FaTrash} />
        <span className="hidden sm:inline">Remove</span>
      </button>
    </div>
  );

  const addButton = (label: string, onClick: () => void) => (
    <Button type="button" variant="outline" onClick={onClick} className="inline-flex items-center gap-2">
      <IconWrapper icon={FaPlus} />
      {label}
    </Button>
  );

  const stepHeading = (title: string, description?: string) => (
    <div className="mb-4">
      <h3 ref={stepHeadingRef} tabIndex={-1} className={`${sectionTitleClass} focus:outline-none`}>
        {title}
      </h3>
      {description && <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>}
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      {stepHeading('Basic information', 'Who you are and what role you are aiming for.')}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor={fid('industry')} className={labelClass}>
            Target industry
          </label>
          <select
            id={fid('industry')}
            value={form.industry}
            onChange={(e) => setField('industry', e.target.value)}
            className={selectClass}
          >
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry} className={optionClass}>
                {industry}
              </option>
            ))}
          </select>
        </div>
        {textInput(fid('targetRole'), 'Target role', form.targetRole, (v) => setField('targetRole', v), {
          placeholder: 'e.g. Software Engineer',
        })}
        <div>
          <label htmlFor={fid('careerLevel')} className={labelClass}>
            Career level
          </label>
          <select
            id={fid('careerLevel')}
            value={form.careerLevel}
            onChange={(e) => {
              const level = CAREER_LEVELS.find((l) => l.value === e.target.value);
              if (level) setForm((prev) => ({ ...prev, careerLevel: level.value }));
            }}
            className={selectClass}
          >
            {CAREER_LEVELS.map((level) => (
              <option key={level.value} value={level.value} className={optionClass}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {textInput(fid('name'), 'Full name', form.name, (v) => setField('name', v), {
          autoComplete: 'name',
          required: true,
          error: exportErrors.length > 0 && !form.name.trim() ? 'Your name is required.' : undefined,
        })}
        {textInput(fid('email'), 'Email', form.email, (v) => setField('email', v), {
          type: 'email',
          autoComplete: 'email',
          placeholder: 'you@example.com',
          onBlur: () => setEmailTouched(true),
          error: emailTouched && emailInvalid ? 'Enter a valid email address.' : undefined,
        })}
        {textInput(fid('phone'), 'Phone', form.phone, (v) => setField('phone', v), { type: 'tel', autoComplete: 'tel' })}
        {textInput(fid('address'), 'Location', form.address, (v) => setField('address', v), {
          placeholder: 'City, Country',
          autoComplete: 'address-level2',
        })}
        {textInput(fid('linkedin'), 'LinkedIn URL', form.linkedin, (v) => setField('linkedin', v), {
          type: 'url',
          placeholder: 'linkedin.com/in/your-name',
          maxLength: 500,
          error: form.linkedin.trim() && !normalizeUrl(form.linkedin) ? 'Enter a valid web address.' : undefined,
        })}
        {textInput(fid('github'), 'GitHub URL', form.github, (v) => setField('github', v), {
          type: 'url',
          placeholder: 'github.com/your-name',
          maxLength: 500,
          error: form.github.trim() && !normalizeUrl(form.github) ? 'Enter a valid web address.' : undefined,
        })}
        {textInput(fid('website'), 'Personal website', form.website, (v) => setField('website', v), {
          type: 'url',
          maxLength: 500,
          error: form.website.trim() && !normalizeUrl(form.website) ? 'Enter a valid web address.' : undefined,
        })}
        {textInput(fid('portfolio'), 'Portfolio URL', form.portfolio, (v) => setField('portfolio', v), {
          type: 'url',
          maxLength: 500,
          error: form.portfolio.trim() && !normalizeUrl(form.portfolio) ? 'Enter a valid web address.' : undefined,
        })}
      </div>

      <div>
        <p className={labelClass}>
          Profile photo <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {form.profilePhoto && (
            <img src={form.profilePhoto} alt="Your profile" className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-white/20" />
          )}
          <input
            id={fid('photo')}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhoto}
            className="sr-only peer"
            aria-describedby={`${fid('photo-hint')}${photoError ? ` ${fid('photo')}-error` : ''}`}
          />
          <label
            htmlFor={fid('photo')}
            className="cursor-pointer inline-flex items-center px-4 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50"
          >
            {form.profilePhoto ? 'Change photo' : 'Upload photo'}
          </label>
          {form.profilePhoto && (
            <button type="button" onClick={() => setForm((prev) => ({ ...prev, profilePhoto: '' }))} className={removeButtonClass}>
              <IconWrapper icon={FaTrash} />
              Remove photo
            </button>
          )}
        </div>
        <p id={fid('photo-hint')} className={hintClass}>
          JPEG, PNG or WebP up to 5MB. It is cropped to a square. Many recruiters prefer resumes without photos.
        </p>
        {photoError && (
          <p id={`${fid('photo')}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {photoError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {textArea(fid('summary'), 'Professional summary', form.summary, (v) => setField('summary', v), {
          placeholder: 'Two or three sentences about your experience, strengths and what you are looking for…',
        })}
        <Button type="button" variant="outline" onClick={() => replaceText('summary', generateSummary(form), 'Summary')} className="inline-flex items-center gap-2 text-sm">
          <IconWrapper icon={FaMagic} />
          Suggest a summary
        </Button>
      </div>

      <div className="space-y-2">
        {textArea(fid('objective'), 'Career objective', form.objective, (v) => setField('objective', v), {
          placeholder: 'What role are you looking for next?',
          rows: 3,
        })}
        <Button type="button" variant="outline" onClick={() => replaceText('objective', generateObjective(form), 'Objective')} className="inline-flex items-center gap-2 text-sm">
          <IconWrapper icon={FaMagic} />
          Suggest an objective
        </Button>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6">
      {stepHeading('Work experience', 'Most recent first. Start lines with "-" to turn them into bullet points.')}
      {form.experiences.map((exp, index) => {
        const base = `${uid}-${exp.id}`;
        return (
          <div key={exp.id} className={`${subCardClass} p-4`}>
            {entryHeader(`Experience ${index + 1}`, () => removeListItem('experiences', exp.id), form.experiences.length > 1)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {textInput(`${base}-first`, 'Job title', exp.role, (v) => updateListItem('experiences', exp.id, { role: v }))}
              {textInput(`${base}-company`, 'Company', exp.company, (v) => updateListItem('experiences', exp.id, { company: v }))}
              {textInput(`${base}-duration`, 'Dates', exp.duration, (v) => updateListItem('experiences', exp.id, { duration: v }), {
                placeholder: 'Jan 2022 - Present',
                maxLength: 100,
              })}
              {textInput(`${base}-location`, 'Location', exp.location, (v) => updateListItem('experiences', exp.id, { location: v }))}
            </div>
            {textArea(`${base}-description`, 'Responsibilities and achievements', exp.description, (v) =>
              updateListItem('experiences', exp.id, { description: v }), {
              placeholder: '- Led the redesign of…\n- Reduced costs by 20% by…',
            })}
          </div>
        );
      })}
      {addButton('Add experience', () => addListItem('experiences', emptyExperience()))}

      <div className="pt-2 space-y-6">
        <h4 className={sectionTitleClass}>Projects</h4>
        {form.projects.map((project, index) => {
          const base = `${uid}-${project.id}`;
          return (
            <div key={project.id} className={`${subCardClass} p-4`}>
              {entryHeader(`Project ${index + 1}`, () => removeListItem('projects', project.id), form.projects.length > 1)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {textInput(`${base}-first`, 'Project title', project.title, (v) => updateListItem('projects', project.id, { title: v }))}
                {textInput(`${base}-link`, 'Link (optional)', project.link, (v) => updateListItem('projects', project.id, { link: v }), {
                  type: 'url',
                  maxLength: 500,
                  error: project.link.trim() && !normalizeUrl(project.link) ? 'Enter a valid web address.' : undefined,
                })}
              </div>
              {textArea(`${base}-description`, 'Description', project.description, (v) =>
                updateListItem('projects', project.id, { description: v }), { rows: 3 })}
            </div>
          );
        })}
        {addButton('Add project', () => addListItem('projects', emptyProject()))}
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      {stepHeading('Skills', 'List the skills that matter for the role you want.')}
      <div className="space-y-3">
        {form.skills.map((skill, index) => {
          const base = `${uid}-${skill.id}`;
          return (
            <div key={skill.id} className="flex flex-col sm:flex-row gap-2 sm:items-end">
              {textInput(`${base}-first`, `Skill ${index + 1}`, skill.name, (v) => updateListItem('skills', skill.id, { name: v }), {
                className: 'flex-1',
                maxLength: 100,
              })}
              <div className="flex gap-2 items-end">
                <div className="flex-1 sm:w-44">
                  <label htmlFor={`${base}-level`} className={labelClass}>
                    Level
                  </label>
                  <select
                    id={`${base}-level`}
                    value={clampLevel(skill.level)}
                    onChange={(e) => updateListItem('skills', skill.id, { level: clampLevel(Number(e.target.value)) })}
                    className={selectClass}
                  >
                    {SKILL_LEVEL_LABELS.map((label, i) => (
                      <option key={label} value={i + 1} className={optionClass}>
                        {i + 1} - {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeListItem('skills', skill.id)}
                  disabled={form.skills.length <= 1}
                  aria-label={`Remove skill ${index + 1}`}
                  className={`${removeButtonClass} h-12`}
                >
                  <IconWrapper icon={FaTrash} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {addButton('Add skill', () => addListItem('skills', emptySkill()))}
        <Button type="button" variant="outline" onClick={suggestSkills} className="inline-flex items-center gap-2">
          <IconWrapper icon={FaMagic} />
          Suggest {form.industry} skills
        </Button>
      </div>

      <div className="pt-2 space-y-3">
        <h4 className={sectionTitleClass}>Languages</h4>
        {form.languages.map((lang, index) => {
          const base = `${uid}-${lang.id}`;
          return (
            <div key={lang.id} className="flex flex-col sm:flex-row gap-2 sm:items-end">
              {textInput(`${base}-first`, `Language ${index + 1}`, lang.language, (v) => updateListItem('languages', lang.id, { language: v }), {
                className: 'flex-1',
                maxLength: 100,
              })}
              <div className="flex gap-2 items-end flex-1">
                {textInput(`${base}-proficiency`, 'Proficiency', lang.proficiency, (v) => updateListItem('languages', lang.id, { proficiency: v }), {
                  className: 'flex-1',
                  placeholder: 'e.g. Native, Fluent',
                  maxLength: 100,
                })}
                <button
                  type="button"
                  onClick={() => removeListItem('languages', lang.id)}
                  disabled={form.languages.length <= 1}
                  aria-label={`Remove language ${index + 1}`}
                  className={`${removeButtonClass} h-12`}
                >
                  <IconWrapper icon={FaTrash} />
                </button>
              </div>
            </div>
          );
        })}
        {addButton('Add language', () => addListItem('languages', emptyLanguage()))}
      </div>

      <div className="pt-2 space-y-4">
        <h4 className={sectionTitleClass}>Certifications</h4>
        {form.certifications.map((cert, index) => {
          const base = `${uid}-${cert.id}`;
          return (
            <div key={cert.id} className={`${subCardClass} p-4`}>
              {entryHeader(`Certification ${index + 1}`, () => removeListItem('certifications', cert.id), form.certifications.length > 1)}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {textInput(`${base}-first`, 'Name', cert.name, (v) => updateListItem('certifications', cert.id, { name: v }))}
                {textInput(`${base}-issuer`, 'Issuer', cert.issuer, (v) => updateListItem('certifications', cert.id, { issuer: v }))}
                {textInput(`${base}-year`, 'Year', cert.year, (v) => updateListItem('certifications', cert.id, { year: v }), { maxLength: 50 })}
              </div>
            </div>
          );
        })}
        {addButton('Add certification', () => addListItem('certifications', emptyCertification()))}
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6">
      {stepHeading('Education', 'Degrees, diplomas and relevant courses.')}
      {form.education.map((edu, index) => {
        const base = `${uid}-${edu.id}`;
        return (
          <div key={edu.id} className={`${subCardClass} p-4`}>
            {entryHeader(`Education ${index + 1}`, () => removeListItem('education', edu.id), form.education.length > 1)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {textInput(`${base}-first`, 'Degree / program', edu.degree, (v) => updateListItem('education', edu.id, { degree: v }))}
              {textInput(`${base}-institution`, 'Institution', edu.institution, (v) => updateListItem('education', edu.id, { institution: v }))}
              {textInput(`${base}-year`, 'Graduation year', edu.year, (v) => updateListItem('education', edu.id, { year: v }), { maxLength: 50 })}
              {textInput(`${base}-location`, 'Location', edu.location, (v) => updateListItem('education', edu.id, { location: v }))}
              {textInput(`${base}-gpa`, 'GPA (optional)', edu.gpa, (v) => updateListItem('education', edu.id, { gpa: v }), { maxLength: 50 })}
            </div>
          </div>
        );
      })}
      {addButton('Add education', () => addListItem('education', emptyEducation()))}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-8">
      {stepHeading('Review & export', 'Pick a design, check the analysis, then download.')}

      {/* Design */}
      <div className="space-y-4">
        <h4 className={sectionTitleClass}>Design</h4>
        <div role="group" aria-label="Template" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {TEMPLATES.map((tmpl) => {
            const selected = design.templateId === tmpl.id;
            const hex = ACCENTS[tmpl.accent].hex;
            return (
              <button
                key={tmpl.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseTemplate(tmpl.id)}
                className={`text-left p-3 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
                  selected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/30'
                }`}
              >
                <span aria-hidden="true" className="block h-12 rounded-md mb-2 bg-white border border-gray-200 overflow-hidden">
                  <span
                    className="block h-3"
                    style={{ backgroundColor: tmpl.header === 'band' ? hex : 'transparent', borderBottom: `2px solid ${hex}` }}
                  />
                  <span className={`block mt-1.5 mx-2 h-1.5 rounded ${tmpl.header === 'center' ? 'mx-auto w-1/2' : 'w-2/3'}`} style={{ backgroundColor: hex }} />
                  <span className="block mt-1 mx-2 h-1 w-3/4 rounded bg-gray-200" />
                </span>
                <span className="block font-medium text-sm text-gray-900 dark:text-white">{tmpl.name}</span>
                <span className="block text-xs text-gray-600 dark:text-gray-400">{tmpl.description}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={fid('accent')} className={labelClass}>
              Accent colour
            </label>
            <select
              id={fid('accent')}
              value={design.accent}
              onChange={(e) => {
                const accent = e.target.value;
                if (isAccentId(accent)) setDesign((prev) => ({ ...prev, accent }));
              }}
              className={selectClass}
            >
              {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
                <option key={id} value={id} className={optionClass}>
                  {ACCENTS[id].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={fid('font')} className={labelClass}>
              Font
            </label>
            <select
              id={fid('font')}
              value={design.font}
              onChange={(e) => {
                const font = e.target.value;
                if (isFontId(font)) setDesign((prev) => ({ ...prev, font }));
              }}
              className={selectClass}
            >
              {(Object.keys(FONTS) as FontId[]).map((id) => (
                <option key={id} value={id} className={optionClass}>
                  {FONTS[id].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className={`${subCardClass} p-4 space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h4 className={sectionTitleClass}>Resume check</h4>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{analysis.score}/100</span>
        </div>
        {analysis.suggestions.length > 0 ? (
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {analysis.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-green-700 dark:text-green-300">Looks complete - nice work!</p>
        )}
        {analysis.skillsGap.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Common {form.industry} skills you could add:
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.skillsGap.map((skill) => (
                <button key={skill} type="button" onClick={() => addSkillByName(skill)} className={chipButtonClass} aria-label={`Add skill ${skill}`}>
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Job description */}
      <div className={`${subCardClass} p-4 space-y-3`}>
        <h4 className={sectionTitleClass}>Job description match</h4>
        {textArea(fid('job'), 'Paste a job description', jobDescription, setJobDescription, {
          rows: 5,
          maxLength: 20000,
          hint: 'We pick out the most frequent terms and check which ones already appear in your resume. Nothing is uploaded.',
        })}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              const found = extractKeywords(jobDescription);
              setKeywords(found);
              if (found.length === 0) toast('No clear keywords found - try pasting the full job description.');
            }}
            disabled={!jobDescription.trim()}
          >
            Find keywords
          </Button>
          {keywords.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setKeywords([]);
                setJobDescription('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
        {keywords.length > 0 && (
          <div aria-live="polite" className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Your resume mentions <strong>{coverage.present.length}</strong> of {keywords.length} keywords.
            </p>
            {coverage.present.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {coverage.present.map((k) => (
                  <span key={k} className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                    ✓ {k}
                  </span>
                ))}
              </div>
            )}
            {coverage.missing.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Missing - add them where they honestly apply (click to add as a skill):
                </p>
                <div className="flex flex-wrap gap-2">
                  {coverage.missing.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => addSkillByName(k)}
                      aria-label={`Add ${k} as a skill`}
                      className="px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                    >
                      + {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional information */}
      <div className="space-y-4">
        <h4 className={sectionTitleClass}>Additional information (optional)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor={fid('workAuthorization')} className={labelClass}>
              Work authorization
            </label>
            <select
              id={fid('workAuthorization')}
              value={form.workAuthorization}
              onChange={(e) => setField('workAuthorization', e.target.value)}
              className={selectClass}
            >
              <option value="" className={optionClass}>
                Not shown
              </option>
              {WORK_AUTHORIZATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className={optionClass}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={fid('availability')} className={labelClass}>
              Availability
            </label>
            <select
              id={fid('availability')}
              value={form.availability}
              onChange={(e) => setField('availability', e.target.value)}
              className={selectClass}
            >
              <option value="" className={optionClass}>
                Not shown
              </option>
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className={optionClass}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {textInput(fid('salary'), 'Salary expectation', form.salaryExpectation, (v) => setField('salaryExpectation', v), {
            placeholder: 'Leave blank to omit',
            maxLength: 100,
          })}
        </div>
      </div>
    </div>
  );

  const stepContent = [renderBasicInfo, renderExperience, renderSkills, renderEducation, renderReview][step];
  const draftLabel = draftSavedAt ? formatSavedAt(draftSavedAt) : '';

  const exportButtons = (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        onClick={() => handleExport('pdf')}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2"
      >
        <IconWrapper icon={exporting === 'pdf' ? FaSpinner : FaDownload} className={exporting === 'pdf' ? 'animate-spin' : ''} />
        Download PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleExport('docx')}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2"
      >
        <IconWrapper icon={exporting === 'docx' ? FaSpinner : FaFileWord} className={exporting === 'docx' ? 'animate-spin' : ''} />
        Download Word
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleExport('print')}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2"
      >
        <IconWrapper icon={exporting === 'print' ? FaSpinner : FaPrint} className={exporting === 'print' ? 'animate-spin' : ''} />
        Print
      </Button>
    </div>
  );

  return (
    <ToolWrapper
      toolId="resume-builder"
      toolName="AI Resume Builder"
      toolDescription="Create professional resumes with AI assistance. Build, customize, and download your resume in PDF or Word format"
      toolCategory="Career"
    >
      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className={`${cardClass} p-4 sm:p-6 space-y-4`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Builder</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Fill in each step, watch the preview update, then download a PDF or Word file.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span id={fid('score-label')} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Completeness
              </span>
              <div
                role="progressbar"
                aria-labelledby={fid('score-label')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={analysis.score}
                className="w-28 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 transition-[width] duration-300"
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{analysis.score}%</span>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            {exportButtons}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={saveDraft} className="inline-flex items-center gap-2 text-sm">
                <IconWrapper icon={FaSave} />
                Save draft
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadDraft}
                disabled={!draftSavedAt}
                title={draftLabel ? `Saved ${draftLabel}` : 'No draft saved yet'}
                className="inline-flex items-center gap-2 text-sm"
              >
                <IconWrapper icon={FaUndo} />
                Load draft
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => replaceForm(createSampleResume(), 'Sample resume loaded.')}
                className="text-sm"
              >
                Load sample
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => replaceForm(createEmptyResume(), 'Form cleared.', DEFAULT_DESIGN)}
                disabled={!hasResumeContent(form)}
                className="text-sm"
              >
                Clear
              </Button>
            </div>
          </div>

          <div aria-live="polite" className="space-y-2 empty:hidden">
            {exporting && (
              <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <IconWrapper icon={FaSpinner} className="animate-spin text-purple-600 dark:text-purple-400" />
                {exporting === 'docx' ? 'Creating your Word document…' : exporting === 'print' ? 'Preparing to print…' : 'Creating your PDF…'}
              </p>
            )}
            {exportErrors.length > 0 && (
              <div role="alert" className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
                <p className="font-medium">Before exporting:</p>
                <ul className="list-disc list-inside">
                  {exportErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {pdfCharWarning && (
              <p className="p-3 rounded-lg text-sm bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
                Some characters (for example non-Latin scripts or emoji) can’t be drawn by the PDF fonts and will
                appear as “?” in the PDF. The Word download keeps them.
              </p>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your resume stays in this browser. Drafts are saved on this device only{draftLabel ? ` (last saved ${draftLabel})` : ''}.
          </p>
        </div>

        {/* Steps */}
        <nav aria-label="Resume steps" className="overflow-x-auto -mx-1 px-1">
          <ol className="flex gap-2 min-w-max">
            {STEPS.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={step === index ? 'step' : undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
                    step === index
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                      : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {index + 1}. {label}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className={`grid gap-6 ${showPreview ? 'xl:grid-cols-2' : ''}`}>
          {/* Form */}
          <div className={`${cardClass} p-4 sm:p-6 min-w-0`}>
            {stepContent()}

            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-white/10">
              <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                Back
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview} aria-controls={fid('preview')}>
                {showPreview ? 'Hide preview' : 'Show preview'}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                  Next: {STEPS[step + 1]}
                </Button>
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-300">Ready? Use the download buttons above.</span>
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <section id={fid('preview')} aria-label="Resume preview" className="min-w-0">
              <div className="xl:sticky xl:top-24">
                <ResumePreview form={form} design={design} />
              </div>
            </section>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
};

export default ResumeBuilder;
