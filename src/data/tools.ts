import { Tool } from '../types';
import YoutubeThumbnail from '../tools/YoutubeThumbnail';
import GrammarChecker from '../tools/GrammarChecker';
import PdfToWord from '../tools/PdfToWord';
import QrCodeGenerator from '../tools/QrCodeGenerator';
import TextToSpeech from '../tools/TextToSpeech';
import ImageCompressor from '../tools/ImageCompressor';
import ReadTimeEstimator from '../tools/ReadTimeEstimator';
import WordCounter from '../tools/WordCounter';
import BgRemover from '../tools/BgRemover';
import ResumeBuilder from '../tools/ResumeBuilder';
import AIEmailWriter from '../tools/AIEmailWriter';
import PasswordGenerator from '../tools/PasswordGenerator';
import ColorPaletteGenerator from '../tools/ColorPaletteGenerator';
import URLShortener from '../tools/URLShortener';
import InvoiceGenerator from '../tools/InvoiceGenerator';
import AITextSummarizer from '../tools/AITextSummarizer';
import AIImageGenerator from '../tools/AIImageGenerator';
import LanguageTranslator from '../tools/LanguageTranslator';
import QRCodeScanner from '../tools/QRCodeScanner';
import UnitConverter from '../tools/UnitConverter';


export const tools: Tool[] = [
  {
    id: 'youtube-thumbnail',
    path: '/app/youtube-thumbnail',
    name: 'YouTube Thumbnail',
    description: 'Create engaging thumbnails for your videos',
    icon: '🎬',
    component: YoutubeThumbnail,
    category: 'Media'
  },
  {
    id: 'grammar-checker',
    path: '/app/grammar-checker',
    name: 'Grammar Checker',
    description: 'Check and improve your text grammar',
    icon: '📝',
    component: GrammarChecker,
    category: 'Writing'
  },
  {
    id: 'pdf-to-word',
    path: '/app/pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF documents to Word format',
    icon: '📄',
    component: PdfToWord,
    category: 'Document'
  },
  {
    id: 'qr-generator',
    path: '/app/qr-generator',
    name: 'QR Code Generator',
    description: 'Generate QR codes for any content',
    icon: '📱',
    component: QrCodeGenerator,
    category: 'Utility'
  },
  {
    id: 'text-to-speech',
    path: '/app/text-to-speech',
    name: 'Text to Speech',
    description: 'Convert text to natural-sounding speech',
    icon: '🗣️',
    component: TextToSpeech,
    category: 'Audio'
  },
  
  {
    id: 'read-time',
    path: '/app/read-time',
    name: 'Read Time Estimator',
    description: 'Calculate reading time for your content',
    icon: '⏱️',
    component: ReadTimeEstimator,
    category: 'Writing'
  },
  {
    id: 'word-counter',
    path: '/app/word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, and sentences',
    icon: '📊',
    component: WordCounter,
    category: 'Writing'
  },
  {
    id: 'bg-remover',
    path: '/app/bg-remover',
    name: 'Background Remover',
    description: 'Remove backgrounds from images automatically',
    icon: '✂️',
    component: BgRemover,
    category: 'Media'
  },
  {
    id: 'image-compressor',
    path: '/app/image-compressor',
    name: 'Image Compressor',
    description: 'Compress images without losing quality',
    icon: '🖼️',
    component: ImageCompressor,
    category: 'Media'
  },
  {
    id: 'resume-builder',
    path: '/app/resume-builder',
    name: 'AI Resume Builder',
    description: 'Create professional resumes with AI',
    icon: '📑',
    component: ResumeBuilder,
    category: 'Document'
  },
  {
    id: 'ai-email-writer',
    path: '/app/ai-email-writer',
    name: 'AI Email Writer',
    description: 'Generate professional emails with AI assistance',
    icon: '✉️',
    component: AIEmailWriter,
    category: 'Communication'
  },
  {
    id: 'password-generator',
    path: '/app/password-generator',
    name: 'Password Generator',
    description: 'Generate secure passwords with custom options',
    icon: '🔐',
    component: PasswordGenerator,
    category: 'Security'
  },
  {
    id: 'color-palette-generator',
    path: '/app/color-palette-generator',
    name: 'Color Palette Generator',
    description: 'Create beautiful color palettes for your designs',
    icon: '🎨',
    component: ColorPaletteGenerator,
    category: 'Design'
  },
  {
    id: 'url-shortener',
    path: '/app/url-shortener',
    name: 'URL Shortener',
    description: 'Shorten long URLs and track clicks with analytics',
    icon: '🔗',
    component: URLShortener,
    category: 'Marketing'
  },
  {
    id: 'invoice-generator',
    path: '/app/invoice-generator',
    name: 'Invoice Generator',
    description: 'Create professional invoices and download as PDF',
    icon: '💼',
    component: InvoiceGenerator,
    category: 'Business'
  },
  {
    id: 'ai-text-summarizer',
    path: '/app/ai-text-summarizer',
    name: 'AI Text Summarizer',
    description: 'Summarize long articles and documents instantly with AI',
    icon: '📄',
    component: AITextSummarizer,
    category: 'Writing'
  },
  {
    id: 'ai-image-generator',
    path: '/app/ai-image-generator',
    name: 'AI Image Generator',
    description: 'Create stunning images from text descriptions using AI',
    icon: '🎨',
    component: AIImageGenerator,
    category: 'Design'
  },
  {
    id: 'language-translator',
    path: '/app/language-translator',
    name: 'Language Translator',
    description: 'Translate text between 20+ languages instantly',
    icon: '🌐',
    component: LanguageTranslator,
    category: 'Productivity'
  },
  {
    id: 'qr-code-scanner',
    path: '/app/qr-code-scanner',
    name: 'QR Code Scanner',
    description: 'Scan QR codes using camera or upload images to decode',
    icon: '📱',
    component: QRCodeScanner,
    category: 'Utility'
  },
  {
    id: 'unit-converter',
    path: '/app/unit-converter',
    name: 'Unit Converter',
    description: 'Convert between different units of measurement easily',
    icon: '📏',
    component: UnitConverter,
    category: 'Utility'
  }
];

export const categories = [
  'All',
  'Media',
  'Writing',
  'Document',
  'Utility',
  'Audio',
  'Communication',
  'Security',
  'Design',
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