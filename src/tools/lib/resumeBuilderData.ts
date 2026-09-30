/**
 * Resume Builder model and pure logic: types, empty/sample data, templates, draft
 * sanitising, completeness scoring and job-description keyword matching.
 *
 * No React, no Firebase, no export libraries - so it can be unit tested.
 */

/* ------------------------------------------------------------------ types */

export type CareerLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type TemplateId = 'classic' | 'modern' | 'creative' | 'tech' | 'executive';
export type AccentId = 'blue' | 'green' | 'purple' | 'gray' | 'navy';
export type FontId = 'sans' | 'serif' | 'mono';
export type HeaderStyle = 'center' | 'left' | 'band';

export interface Skill {
  id: string;
  name: string;
  /** 1 (beginner) to 5 (expert). */
  level: number;
}

export interface Language {
  id: string;
  language: string;
  proficiency: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
  gpa: string;
  location: string;
}

export interface Project {
  id: string;
  title: string;
  link: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  github: string;
  website: string;
  portfolio: string;
  /** JPEG/PNG data URL, already downscaled on upload. */
  profilePhoto: string;
  summary: string;
  objective: string;
  targetRole: string;
  industry: string;
  careerLevel: CareerLevel;
  skills: Skill[];
  languages: Language[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  workAuthorization: string;
  availability: string;
  salaryExpectation: string;
}

export type ResumeListKey = 'skills' | 'languages' | 'experiences' | 'education' | 'projects' | 'certifications';
export type ResumeTextField = Exclude<
  { [K in keyof ResumeData]: ResumeData[K] extends string ? K : never }[keyof ResumeData],
  'careerLevel'
>;

export interface ResumeDesign {
  templateId: TemplateId;
  accent: AccentId;
  font: FontId;
}

/* --------------------------------------------------------------- catalogs */

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  accent: AccentId;
  font: FontId;
  header: HeaderStyle;
}

export const TEMPLATES: readonly TemplateDefinition[] = [
  { id: 'classic', name: 'Classic Professional', description: 'Traditional format for corporate roles', accent: 'blue', font: 'sans', header: 'center' },
  { id: 'modern', name: 'Modern Minimalist', description: 'Clean and contemporary design', accent: 'gray', font: 'sans', header: 'left' },
  { id: 'creative', name: 'Creative Bold', description: 'Eye-catching for creative industries', accent: 'purple', font: 'sans', header: 'band' },
  { id: 'tech', name: 'Tech Focused', description: 'Optimized for technical roles', accent: 'green', font: 'sans', header: 'left' },
  { id: 'executive', name: 'Executive', description: 'Premium design for senior positions', accent: 'navy', font: 'serif', header: 'center' },
];

export const ACCENTS: Record<AccentId, { label: string; hex: string; rgb: [number, number, number] }> = {
  blue: { label: 'Blue', hex: '#2563eb', rgb: [37, 99, 235] },
  green: { label: 'Green', hex: '#059669', rgb: [5, 150, 105] },
  purple: { label: 'Purple', hex: '#7c3aed', rgb: [124, 58, 237] },
  gray: { label: 'Gray', hex: '#374151', rgb: [55, 65, 81] },
  navy: { label: 'Navy', hex: '#1e3a8a', rgb: [30, 58, 138] },
};

export const FONTS: Record<FontId, { label: string; css: string; pdf: 'helvetica' | 'times' | 'courier'; docx: string }> = {
  sans: { label: 'Sans-serif', css: 'Inter, Arial, Helvetica, sans-serif', pdf: 'helvetica', docx: 'Calibri' },
  serif: { label: 'Serif', css: 'Georgia, "Times New Roman", serif', pdf: 'times', docx: 'Georgia' },
  mono: { label: 'Monospace', css: '"Courier New", Courier, monospace', pdf: 'courier', docx: 'Courier New' },
};

export const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Engineering',
  'Design', 'Sales', 'Consulting', 'Legal', 'Media', 'Retail', 'Manufacturing',
] as const;

export const SKILL_SUGGESTIONS: Record<string, readonly string[]> = {
  Technology: ['React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker', 'Git', 'SQL'],
  Healthcare: ['Patient Care', 'Electronic Health Records', 'HIPAA Compliance', 'Clinical Research', 'Medical Terminology'],
  Finance: ['Financial Analysis', 'Excel', 'Financial Modeling', 'Risk Management', 'Regulatory Compliance'],
  Education: ['Curriculum Design', 'Classroom Management', 'Lesson Planning', 'Assessment', 'Learning Management Systems'],
  Marketing: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Social Media'],
  Engineering: ['CAD', 'Project Management', 'Quality Assurance', 'Technical Documentation', 'Root Cause Analysis'],
  Design: ['Figma', 'Adobe Creative Suite', 'UI/UX', 'Typography', 'Branding'],
  Sales: ['CRM', 'Lead Generation', 'Negotiation', 'Account Management', 'Pipeline Management'],
  Consulting: ['Stakeholder Management', 'Business Analysis', 'Process Improvement', 'Presentation Skills', 'Data Analysis'],
  Legal: ['Legal Research', 'Contract Drafting', 'Compliance', 'Litigation Support', 'Case Management'],
  Media: ['Content Production', 'Video Editing', 'Copywriting', 'Storytelling', 'Audience Analytics'],
  Retail: ['Customer Service', 'Inventory Management', 'Visual Merchandising', 'Point of Sale', 'Team Leadership'],
  Manufacturing: ['Lean Manufacturing', 'Six Sigma', 'Supply Chain', 'Quality Control', 'Health and Safety'],
};

export const SKILL_LEVEL_LABELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'] as const;

export const clampLevel = (level: number): number =>
  Number.isFinite(level) ? Math.min(5, Math.max(1, Math.round(level))) : 3;

export const skillLevelLabel = (level: number): string =>
  SKILL_LEVEL_LABELS[clampLevel(level) - 1];

export const CAREER_LEVELS: ReadonlyArray<{ value: CareerLevel; label: string }> = [
  { value: 'entry', label: 'Entry level' },
  { value: 'mid', label: 'Mid level' },
  { value: 'senior', label: 'Senior level' },
  { value: 'executive', label: 'Executive' },
];

export const WORK_AUTHORIZATION_OPTIONS = [
  { value: 'authorized', label: 'Authorized to work (no sponsorship needed)' },
  { value: 'permanent', label: 'Permanent resident' },
  { value: 'visa', label: 'Work visa holder' },
  { value: 'sponsorship', label: 'Requires visa sponsorship' },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: '2weeks', label: 'In 2 weeks' },
  { value: '1month', label: 'In 1 month' },
  { value: 'negotiable', label: 'Negotiable' },
] as const;

export const labelFor = (options: ReadonlyArray<{ value: string; label: string }>, value: string): string =>
  options.find((o) => o.value === value)?.label ?? '';

/* ----------------------------------------------------------- constructors */

let idSequence = 0;
/** Stable React key for list entries. Not security sensitive. */
export const createId = (): string => {
  idSequence += 1;
  return `${Date.now().toString(36)}-${idSequence.toString(36)}`;
};

export const emptySkill = (): Skill => ({ id: createId(), name: '', level: 3 });
export const emptyLanguage = (): Language => ({ id: createId(), language: '', proficiency: '' });
export const emptyExperience = (): Experience => ({ id: createId(), company: '', role: '', duration: '', location: '', description: '' });
export const emptyEducation = (): Education => ({ id: createId(), institution: '', degree: '', year: '', gpa: '', location: '' });
export const emptyProject = (): Project => ({ id: createId(), title: '', link: '', description: '' });
export const emptyCertification = (): Certification => ({ id: createId(), name: '', issuer: '', year: '' });

export const createEmptyResume = (): ResumeData => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  github: '',
  website: '',
  portfolio: '',
  profilePhoto: '',
  summary: '',
  objective: '',
  targetRole: '',
  industry: 'Technology',
  careerLevel: 'entry',
  skills: [emptySkill()],
  languages: [emptyLanguage()],
  experiences: [emptyExperience()],
  education: [emptyEducation()],
  projects: [emptyProject()],
  certifications: [emptyCertification()],
  workAuthorization: '',
  availability: '',
  salaryExpectation: '',
});

/**
 * Fictional sample used by the "Load sample" button. Deliberately uses reserved
 * example domains and made-up organisations, so it never points at a real person.
 */
export const createSampleResume = (): ResumeData => ({
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 555 010 0199',
  address: 'Springfield',
  linkedin: '',
  github: '',
  website: 'https://example.com',
  portfolio: '',
  profilePhoto: '',
  summary:
    'Frontend developer with 4 years of experience building fast, accessible web applications with React and TypeScript. Comfortable across the stack with Node.js and REST APIs, and focused on clean, well-tested code.',
  objective:
    'Looking for a senior frontend role where I can lead UI architecture and mentor other developers.',
  targetRole: 'Senior Frontend Developer',
  industry: 'Technology',
  careerLevel: 'mid',
  skills: [
    { id: createId(), name: 'React', level: 5 },
    { id: createId(), name: 'TypeScript', level: 4 },
    { id: createId(), name: 'Node.js', level: 4 },
    { id: createId(), name: 'Accessibility (WCAG)', level: 4 },
  ],
  languages: [
    { id: createId(), language: 'English', proficiency: 'Native' },
    { id: createId(), language: 'Spanish', proficiency: 'Conversational' },
  ],
  experiences: [
    {
      id: createId(),
      company: 'Northwind Labs',
      role: 'Frontend Developer',
      duration: '2022 - Present',
      location: 'Remote',
      description:
        '- Rebuilt the customer dashboard in React, cutting load time by 40%\n- Introduced component tests and raised coverage from 20% to 75%\n- Mentored two junior developers',
    },
    {
      id: createId(),
      company: 'Contoso Ltd',
      role: 'Junior Web Developer',
      duration: '2020 - 2022',
      location: 'Springfield',
      description: 'Built and maintained marketing sites and internal tools with JavaScript and Node.js.',
    },
  ],
  education: [
    { id: createId(), institution: 'State University', degree: 'B.Sc. Computer Science', year: '2020', gpa: '', location: 'Springfield' },
  ],
  projects: [
    {
      id: createId(),
      title: 'Open-source form library',
      link: 'https://example.com/forms',
      description: 'Lightweight, accessible form validation library for React with 1k+ weekly downloads.',
    },
  ],
  certifications: [{ id: createId(), name: 'Cloud Practitioner', issuer: 'Example Cloud', year: '2023' }],
  workAuthorization: '',
  availability: '1month',
  salaryExpectation: '',
});

/* --------------------------------------------------------------- helpers */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value.trim());

/**
 * Normalises a user-entered link to an absolute http(s) URL, or null if it is not
 * one. Blocks `javascript:` and other schemes from ever reaching an href.
 */
export const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.href;
  } catch {
    return null;
  }
};

/** `https://www.example.com/in/alex/` -> `example.com/in/alex` for display. */
export const displayUrl = (href: string): string =>
  href.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');

export const filledSkills = (form: ResumeData) => form.skills.filter((s) => s.name.trim());
export const filledLanguages = (form: ResumeData) => form.languages.filter((l) => l.language.trim());
export const filledExperiences = (form: ResumeData) =>
  form.experiences.filter((e) => e.company.trim() || e.role.trim());
export const filledEducation = (form: ResumeData) =>
  form.education.filter((e) => e.institution.trim() || e.degree.trim());
export const filledProjects = (form: ResumeData) => form.projects.filter((p) => p.title.trim());
export const filledCertifications = (form: ResumeData) => form.certifications.filter((c) => c.name.trim());

export interface ResumeLink {
  label: string;
  href: string;
}

export const resumeLinks = (form: ResumeData): ResumeLink[] =>
  (
    [
      ['LinkedIn', form.linkedin],
      ['GitHub', form.github],
      ['Website', form.website],
      ['Portfolio', form.portfolio],
    ] as const
  ).flatMap(([label, raw]) => {
    const href = normalizeUrl(raw);
    return href ? [{ label, href }] : [];
  });

/** Additional details (work authorization etc.) as "Label: value" pairs. */
export const additionalDetails = (form: ResumeData): Array<[string, string]> => {
  const rows: Array<[string, string]> = [];
  const auth = labelFor(WORK_AUTHORIZATION_OPTIONS, form.workAuthorization);
  if (auth) rows.push(['Work authorization', auth]);
  const availability = labelFor(AVAILABILITY_OPTIONS, form.availability);
  if (availability) rows.push(['Availability', availability]);
  if (form.salaryExpectation.trim()) rows.push(['Salary expectation', form.salaryExpectation.trim()]);
  return rows;
};

/** Splits a description into lines; lines starting with -, * or a bullet become bullets. */
export const splitDescription = (text: string): Array<{ bullet: boolean; text: string }> =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(?:[-*\u2022\u25CF\u25AA]|\d+[.)])\s+(.*)$/.exec(line);
      return match ? { bullet: true, text: match[1].trim() } : { bullet: false, text: line };
    });

/** "Alex Morgan" -> "Alex_Morgan_Resume". */
export const resumeFileBase = (name: string): string => {
  const base = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_');
  return base ? `${base}_Resume` : 'Resume';
};

/** True when the user has typed anything worth protecting from an overwrite. */
export const hasResumeContent = (form: ResumeData): boolean =>
  Boolean(
    form.name.trim() ||
      form.email.trim() ||
      form.summary.trim() ||
      form.objective.trim() ||
      filledSkills(form).length ||
      filledExperiences(form).length ||
      filledEducation(form).length ||
      filledProjects(form).length
  );

/* ------------------------------------------------------------- analysis */

export interface ResumeAnalysis {
  score: number;
  suggestions: string[];
  /** Common skills for the chosen industry that are not on the resume yet. */
  skillsGap: string[];
}

const hasSkill = (form: ResumeData, skill: string) =>
  form.skills.some((s) => s.name.trim().toLowerCase() === skill.toLowerCase());

export const analyzeResume = (form: ResumeData): ResumeAnalysis => {
  const skills = filledSkills(form);
  const experiences = filledExperiences(form);
  const education = filledEducation(form);
  const projects = filledProjects(form);

  let score = 0;
  if (form.name.trim()) score += 10;
  if (form.email.trim() && isValidEmail(form.email)) score += 10;
  if (form.phone.trim()) score += 10;
  if (form.summary.trim()) score += 15;
  if (experiences.length > 0) score += 20;
  if (education.length > 0) score += 15;
  if (skills.length > 0) score += 10;
  if (projects.length > 0) score += 10;

  const suggestions: string[] = [];
  if (!form.name.trim()) suggestions.push('Add your full name.');
  if (!form.email.trim()) suggestions.push('Add an email address so recruiters can reach you.');
  else if (!isValidEmail(form.email)) suggestions.push('Check your email address - it does not look valid.');
  if (!form.phone.trim()) suggestions.push('Add a phone number.');
  if (!form.summary.trim()) suggestions.push('Add a short professional summary (2-3 sentences).');
  else if (form.summary.trim().length < 80) suggestions.push('Expand your summary to 2-3 sentences.');
  if (experiences.length === 0) suggestions.push('Add your work experience (internships and volunteering count).');
  else if (experiences.some((e) => !e.description.trim())) {
    suggestions.push('Describe what you achieved in each role, ideally with numbers.');
  }
  if (education.length === 0) suggestions.push('Add your education.');
  if (skills.length < 3) suggestions.push('List at least 3 relevant skills.');
  if (projects.length === 0) suggestions.push('Add a project that shows your work.');
  if (!normalizeUrl(form.linkedin)) suggestions.push('Add your LinkedIn profile.');

  const industrySkills = SKILL_SUGGESTIONS[form.industry] ?? [];
  const skillsGap = industrySkills.filter((skill) => !hasSkill(form, skill)).slice(0, 5);

  return { score, suggestions, skillsGap };
};

/**
 * Adds suggested skills for the current industry that are not on the resume yet,
 * dropping empty rows. Returns the new list and the names that were added.
 */
export const addSuggestedSkills = (form: ResumeData, max = 5): { skills: Skill[]; added: string[] } => {
  const suggestions = SKILL_SUGGESTIONS[form.industry] ?? [];
  const added = suggestions.filter((skill) => !hasSkill(form, skill)).slice(0, max);
  const kept = filledSkills(form);
  return { skills: [...kept, ...added.map((name) => ({ id: createId(), name, level: 3 }))], added };
};

const STOP_WORDS = new Set(
  (
    'the and or but in on at to for of with by from as is are was were be been being have has had will would could should may might can must do does did this that these those a an ' +
    'you your we our us they their them it its who what when where which why how all any each our more most other some such than too very just also into over under about ' +
    'able across after again against within without while per via etc including include includes including role team work working job jobs position candidate candidates ' +
    'experience years year strong excellent good great ability skills skill knowledge understanding required requirements preferred plus looking join company responsibilities ' +
    'new well using use based help ensure make across day days time full part'
  ).split(/\s+/)
);

/** Most frequent meaningful terms in a job description (keeps tokens like "c++", "node.js"). */
export const extractKeywords = (text: string, limit = 12): string[] => {
  const tokens = text.toLowerCase().match(/[a-z][a-z0-9+#.\-/]*/g) ?? [];
  const counts = new Map<string, number>();
  for (const raw of tokens) {
    const token = raw.replace(/[.\-/]+$/, '');
    if (token.length < 3 && !/[+#]/.test(token)) continue;
    if (STOP_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  // Array.prototype.sort is stable, so ties keep their first-seen order.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

/** Everything a recruiter's ATS would search, lower-cased. */
export const resumeSearchText = (form: ResumeData): string =>
  [
    form.targetRole,
    form.summary,
    form.objective,
    ...form.skills.map((s) => s.name),
    ...form.experiences.flatMap((e) => [e.role, e.company, e.description]),
    ...form.projects.flatMap((p) => [p.title, p.description]),
    ...form.certifications.map((c) => c.name),
    ...form.education.map((e) => e.degree),
  ]
    .join(' ')
    .toLowerCase();

export const keywordCoverage = (form: ResumeData, keywords: readonly string[]) => {
  const haystack = resumeSearchText(form);
  const present: string[] = [];
  const missing: string[] = [];
  keywords.forEach((keyword) => (haystack.includes(keyword) ? present : missing).push(keyword));
  return { present, missing };
};

/* --------------------------------------------------------- text helpers */

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const joinList = (items: string[]): string =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** Template-based summary starter the user is expected to edit. */
export const generateSummary = (form: ResumeData): string => {
  const role = form.targetRole.trim() || 'professional';
  const industry = form.industry.toLowerCase();
  const topSkills = filledSkills(form).slice(0, 3).map((s) => s.name.trim());
  const skillsSentence = topSkills.length ? ` Skilled in ${joinList(topSkills)}.` : '';

  switch (form.careerLevel) {
    case 'entry':
      return `Motivated ${role} starting a career in ${industry}, with a strong foundation from study and hands-on projects.${skillsSentence} Eager to learn quickly and contribute to a collaborative team.`;
    case 'mid':
      return `${capitalize(role)} with 3-5 years of experience in ${industry}, delivering high-quality results on time.${skillsSentence} Known for solving problems pragmatically and working well across teams.`;
    case 'senior':
      return `Senior ${role} with 7+ years of experience in ${industry}, leading projects from idea to launch.${skillsSentence} Experienced in mentoring others and driving measurable business outcomes.`;
    default:
      return `${capitalize(role)} with 15+ years of leadership experience in ${industry}, setting strategy and building high-performing teams.${skillsSentence} Proven record of growing revenue and improving operations.`;
  }
};

export const generateObjective = (form: ResumeData): string => {
  const role = form.targetRole.trim() || 'role';
  return `Seeking a ${role} position in ${form.industry.toLowerCase()} where I can apply my skills, contribute to meaningful projects and keep growing professionally.`;
};

/* ------------------------------------------------------------- drafts */

const MAX_TEXT = 5000;
const MAX_ITEMS = 50;
const MAX_PHOTO_LENGTH = 2_000_000;

const str = (value: unknown, max = MAX_TEXT): string => (typeof value === 'string' ? value.slice(0, max) : '');

const list = <T>(value: unknown, map: (raw: Record<string, unknown>) => T, fallback: () => T): T[] => {
  const items = Array.isArray(value)
    ? value
        .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
        .slice(0, MAX_ITEMS)
        .map(map)
    : [];
  return items.length ? items : [fallback()];
};

const isCareerLevel = (v: unknown): v is CareerLevel =>
  v === 'entry' || v === 'mid' || v === 'senior' || v === 'executive';

/**
 * Rebuilds a resume from untrusted JSON (a saved draft), keeping only known fields
 * of the right type. Returns null if the value is not a resume at all.
 */
export const sanitizeResume = (raw: unknown): ResumeData | null => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const photo = str(r.profilePhoto, MAX_PHOTO_LENGTH);

  return {
    name: str(r.name, 200),
    email: str(r.email, 200),
    phone: str(r.phone, 100),
    address: str(r.address, 300),
    linkedin: str(r.linkedin, 500),
    github: str(r.github, 500),
    website: str(r.website, 500),
    portfolio: str(r.portfolio, 500),
    profilePhoto: /^data:image\/(png|jpeg);base64,/.test(photo) ? photo : '',
    summary: str(r.summary),
    objective: str(r.objective),
    targetRole: str(r.targetRole, 200),
    industry: typeof r.industry === 'string' && (INDUSTRIES as readonly string[]).includes(r.industry) ? r.industry : 'Technology',
    careerLevel: isCareerLevel(r.careerLevel) ? r.careerLevel : 'entry',
    skills: list(r.skills, (s) => ({ id: createId(), name: str(s.name, 100), level: clampLevel(Number(s.level)) }), emptySkill),
    languages: list(r.languages, (l) => ({ id: createId(), language: str(l.language, 100), proficiency: str(l.proficiency, 100) }), emptyLanguage),
    experiences: list(
      r.experiences,
      (e) => ({
        id: createId(),
        company: str(e.company, 200),
        role: str(e.role, 200),
        duration: str(e.duration, 100),
        location: str(e.location, 200),
        description: str(e.description),
      }),
      emptyExperience
    ),
    education: list(
      r.education,
      (e) => ({
        id: createId(),
        institution: str(e.institution, 200),
        degree: str(e.degree, 200),
        year: str(e.year, 50),
        gpa: str(e.gpa, 50),
        location: str(e.location, 200),
      }),
      emptyEducation
    ),
    projects: list(r.projects, (p) => ({ id: createId(), title: str(p.title, 200), link: str(p.link, 500), description: str(p.description) }), emptyProject),
    certifications: list(
      r.certifications,
      (c) => ({ id: createId(), name: str(c.name, 200), issuer: str(c.issuer, 200), year: str(c.year, 50) }),
      emptyCertification
    ),
    workAuthorization: WORK_AUTHORIZATION_OPTIONS.some((o) => o.value === r.workAuthorization) ? String(r.workAuthorization) : '',
    availability: AVAILABILITY_OPTIONS.some((o) => o.value === r.availability) ? String(r.availability) : '',
    salaryExpectation: str(r.salaryExpectation, 100),
  };
};

export const isTemplateId = (v: unknown): v is TemplateId => TEMPLATES.some((t) => t.id === v);
const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);
export const isAccentId = (v: unknown): v is AccentId => typeof v === 'string' && hasOwn(ACCENTS, v);
export const isFontId = (v: unknown): v is FontId => typeof v === 'string' && hasOwn(FONTS, v);

export const templateById = (id: TemplateId): TemplateDefinition =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
