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
  }
];

export const categories = [
  'All',
  'Media',
  'Writing',
  'Document',
  'Utility',
  'Audio'
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