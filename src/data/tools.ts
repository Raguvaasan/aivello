/**
 * Tool registry: metadata only.
 *
 * This file must NOT import tool components. It previously imported all 29 of them to
 * populate an unused `component` field, and since the registry is consumed by the
 * Sidebar and the public landing page, that pulled every tool (and pdfjs, docx, jspdf,
 * qrcode, compromise, sentiment...) into the initial bundle - defeating every
 * React.lazy() call in src/routes/index.tsx.
 *
 * Routing owns component loading. Keep it that way.
 */
import { Tool } from '../types';


export const tools: Tool[] = [
  {
    id: 'ai-code-assistant',
    path: '/app/ai-code-assistant',
    name: 'AI Code Assistant',
    description: 'Generate, explain, and review code snippets',
    icon: '🤖',
    category: 'Developer'
  },
  {
    id: 'ai-business-plan-generator',
    path: '/app/ai-business-plan-generator',
    name: 'AI Business Plan Generator',
    description: 'Create comprehensive business plans with AI assistance',
    icon: '📊',    category: 'AI'
  },
  {
    id: 'ai-personality-analyzer',
    path: '/app/ai-personality-analyzer',
    name: 'AI Personality Analyzer',
    description: 'Discover your personality type with AI-powered analysis',
    icon: '🧠',    category: 'AI'
  },
  {
    id: 'ai-dream-interpreter',
    path: '/app/ai-dream-interpreter',
    name: 'AI Dream Interpreter',
    description: 'Unlock hidden meanings in your dreams with AI analysis',
    icon: '🌙',    category: 'AI'
  },
  {
    id: 'ai-relationship-compatibility',
    path: '/app/ai-relationship-compatibility',
    name: 'AI Relationship Compatibility',
    description: 'Analyze relationship compatibility with AI insights',
    icon: '💖',    category: 'AI'
  },
  {
    id: 'ai-creative-story-generator',
    path: '/app/ai-creative-story-generator',
    name: 'AI Story Generator',
    description: 'Generate creative stories with AI assistance',
    icon: '📚',    category: 'AI'
  },
  {
    id: 'ai-resume-scanner',
    path: '/app/ai-resume-scanner',
    name: 'AI Resume Scanner',
    description: 'Check your resume against a job description for ATS keywords',
    icon: '🧾',
    category: 'Career'
  },
  {
    id: 'ai-speech-to-text',
    path: '/app/ai-speech-to-text',
    name: 'AI Speech to Text',
    description: 'Convert your spoken words into well-structured blog posts',
    icon: '🎙️',    category: 'Content Creation'
  },
  {
    id: 'ai-video-script',
    path: '/app/ai-video-script',
    name: 'AI Video Script Generator',
    description: 'Generate professional video scripts for YouTube, TikTok, and other platforms',
    icon: '🎬',    category: 'Content Creation'
  },
  {
    id: 'ai-study-notes',
    path: '/app/ai-study-notes',
    name: 'AI Study Notes Generator',
    description: 'Transform your study material into organized, easy-to-learn notes',
    icon: '📚',    category: 'Education'
  },
  {
    id: 'ai-interview-prep',
    path: '/app/ai-interview-prep',
    name: 'AI Interview Preparation',
    description: 'Practice interviews with AI feedback and improve your interview skills',
    icon: '👥',    category: 'Career'
  },
  {
    id: 'youtube-thumbnail',
    path: '/app/youtube-thumbnail',
    name: 'YouTube Thumbnail',
    description: 'Create engaging thumbnails for your videos',
    icon: '🎬',    category: 'Media'
  },
  {
    id: 'grammar-checker',
    path: '/app/grammar-checker',
    name: 'Grammar Checker',
    description: 'Check and improve your text grammar',
    icon: '📝',    category: 'Writing'
  },
  {
    id: 'pdf-to-word',
    path: '/app/pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF documents to Word format',
    icon: '📄',    category: 'Document'
  },
  {
    id: 'qr-generator',
    path: '/app/qr-generator',
    name: 'QR Code Generator',
    description: 'Generate QR codes for any content',
    icon: '📱',    category: 'Utility'
  },
  {
    id: 'text-to-speech',
    path: '/app/text-to-speech',
    name: 'Text to Speech',
    description: 'Convert text to natural-sounding speech',
    icon: '🗣️',    category: 'Audio'
  },
  
  {
    id: 'read-time',
    path: '/app/read-time',
    name: 'Read Time Estimator',
    description: 'Calculate reading time for your content',
    icon: '⏱️',    category: 'Writing'
  },
  {
    id: 'word-counter',
    path: '/app/word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, and sentences',
    icon: '📊',    category: 'Writing'
  },
  {
    id: 'bg-remover',
    path: '/app/bg-remover',
    name: 'Background Remover',
    description: 'Remove backgrounds from images automatically',
    icon: '✂️',    category: 'Media'
  },
  {
    id: 'image-compressor',
    path: '/app/image-compressor',
    name: 'Image Compressor',
    description: 'Compress images without losing quality',
    icon: '🖼️',    category: 'Media'
  },
  {
    id: 'resume-builder',
    path: '/app/resume-builder',
    name: 'AI Resume Builder',
    description: 'Create professional resumes with AI',
    icon: '📑',    category: 'Document'
  },
  {
    id: 'ai-email-writer',
    path: '/app/ai-email-writer',
    name: 'AI Email Writer',
    description: 'Generate professional emails with AI assistance',
    icon: '✉️',    category: 'Communication'
  },
  {
    id: 'password-generator',
    path: '/app/password-generator',
    name: 'Password Generator',
    description: 'Generate secure passwords with custom options',
    icon: '🔐',    category: 'Security'
  },
  {
    id: 'color-palette-generator',
    path: '/app/color-palette-generator',
    name: 'Color Palette Generator',
    description: 'Create beautiful color palettes for your designs',
    icon: '🎨',    category: 'Design'
  },
  {
    id: 'url-shortener',
    path: '/app/url-shortener',
    name: 'URL Shortener',
    description: 'Shorten long URLs into short, shareable links with a QR code',
    icon: '🔗',    category: 'Marketing'
  },
  {
    id: 'invoice-generator',
    path: '/app/invoice-generator',
    name: 'Invoice Generator',
    description: 'Create professional invoices and download as PDF',
    icon: '💼',    category: 'Business'
  },
  {
    id: 'ai-text-summarizer',
    path: '/app/ai-text-summarizer',
    name: 'AI Text Summarizer',
    description: 'Summarize long articles and documents instantly with AI',
    icon: '📄',    category: 'Writing'
  },
  {
    id: 'ai-image-generator',
    path: '/app/ai-image-generator',
    name: 'AI Image Generator',
    description: 'Create stunning images from text descriptions using AI',
    icon: '🎨',    category: 'Design'
  },
  {
    id: 'language-translator',
    path: '/app/language-translator',
    name: 'Language Translator',
    description: 'Translate text between 20+ languages instantly',
    icon: '🌐',    category: 'Productivity'
  },
  {
    id: 'qr-code-scanner',
    path: '/app/qr-code-scanner',
    name: 'QR Code Scanner',
    description: 'Scan QR codes using camera or upload images to decode',
    icon: '📱',    category: 'Utility'
  },
  {
    id: 'unit-converter',
    path: '/app/unit-converter',
    name: 'Unit Converter',
    description: 'Convert between different units of measurement easily',
    icon: '📏',    category: 'Utility'
  },
  // NEW-TOOLS: new registry entries are appended below this line.
  {
    id: 'json-formatter',
    path: '/app/json-formatter',
    name: 'JSON Formatter & Validator',
    description: 'Format, minify and validate JSON with exact error line and column, recursive key sorting, copy and download',
    icon: '🧩',
    category: 'Developer',
    isNew: true
  },
  {
    id: 'base64-converter',
    path: '/app/base64-converter',
    name: 'Base64 Encoder / Decoder',
    description: 'UTF-8 safe Base64 encode/decode with URL-safe mode, plus file to Base64 or data URL and back to a file',
    icon: '🔁',
    category: 'Developer',
    isNew: true
  },
  {
    id: 'hash-generator',
    path: '/app/hash-generator',
    name: 'Hash Generator',
    description: 'SHA-1, SHA-256, SHA-384 and SHA-512 hashes for text and files, HMAC-SHA256 and checksum verification',
    icon: '#️⃣',
    category: 'Security',
    isNew: true
  },
  {
    id: 'uuid-generator',
    path: '/app/uuid-generator',
    name: 'UUID Generator',
    description: 'Generate random v4 and time-ordered v7 UUIDs in bulk (up to 1,000) and validate any UUID',
    icon: '🆔',
    category: 'Developer',
    isNew: true
  },
  {
    id: 'text-diff-checker',
    path: '/app/text-diff-checker',
    name: 'Text Diff Checker',
    description: 'Compare two texts line by line and word by word in side-by-side or unified view',
    icon: '🆚',
    category: 'Writing',
    isNew: true
  },
  {
    id: 'regex-tester',
    path: '/app/regex-tester',
    name: 'Regex Tester',
    description: 'Test JavaScript regular expressions live with highlighted matches, groups, flags and replace preview',
    icon: '🔍',
    category: 'Developer',
    isNew: true
  },
  {
    id: 'timestamp-converter',
    path: '/app/timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert Unix timestamps to human dates and back in any time zone: ISO 8601, RFC 2822 and relative time',
    icon: '⏰',
    category: 'Developer',
    isNew: true
  },
  {
    id: 'pdf-merge-split',
    path: '/app/pdf-merge-split',
    name: 'PDF Merge & Split',
    description: 'Merge multiple PDFs in any order or split one into page ranges or single pages, privately in your browser',
    icon: '🗂️',
    category: 'Document',
    isNew: true
  },
  {
    id: 'image-converter',
    path: '/app/image-converter',
    name: 'Image Converter & Resizer',
    description: 'Convert JPG, PNG, WebP, GIF and BMP to PNG, JPEG or WebP and resize by pixels or percentage, without uploading',
    icon: '🔄',
    category: 'Media',
    isNew: true
  },
  {
    id: 'color-contrast-checker',
    path: '/app/color-contrast-checker',
    name: 'Color Contrast Checker',
    description: 'Check WCAG 2.x AA/AAA contrast ratios with a live preview and one-click passing colour suggestions',
    icon: '🌗',
    category: 'Design',
    isNew: true
  },
  {
    id: 'age-calculator',
    path: '/app/age-calculator',
    name: 'Age & Date Calculator',
    description: 'Exact age in years, months and days, days between dates, and add or subtract days, weeks, months or years',
    icon: '🎂',
    category: 'Utility',
    isNew: true
  },
  {
    id: 'lorem-ipsum-generator',
    path: '/app/lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text by paragraphs, sentences or words as plain text or HTML, then copy or download',
    icon: '📃',
    category: 'Writing',
    isNew: true
  },
  {
    id: 'case-converter',
    path: '/app/case-converter',
    name: 'Case Converter',
    description: 'Convert text to UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case and more',
    icon: '🔠',
    category: 'Writing',
    isNew: true
  },
];

/** Every category used above, in display order. Kept in sync by toolRegistry.test.ts. */
export const categories = [
  'All',
  'AI',
  'Writing',
  'Content Creation',
  'Education',
  'Career',
  'Document',
  'Media',
  'Design',
  'Developer',
  'Utility',
  'Audio',
  'Communication',
  'Security',
  'Marketing',
  'Business',
  'Productivity'
] as const;

export type Category = typeof categories[number];

export const getToolsByCategory = (category: Category) => {
  if (category === 'All') return tools;
  return tools.filter(tool => tool.category === category);
};

export const searchTools = (query: string) => {
  const searchTerm = query.toLowerCase();
  return tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm) || 
    tool.description.toLowerCase().includes(searchTerm)
  );
};