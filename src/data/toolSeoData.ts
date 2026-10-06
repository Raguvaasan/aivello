/**
 * Per-tool SEO overrides, read only by ToolWrapper.
 *
 * Kept out of seoData.ts on purpose: the landing page imports that file eagerly, and
 * these entries belong in the lazily loaded tool chunks, not the initial bundle.
 */
import { structuredDataSchemas } from './seoData';

export const toolSeoData = {
  'grammar-checker': {
    title: 'Free AI Grammar Checker - Fix Grammar & Writing Errors',
    description: 'Check and fix grammar, spelling, and punctuation errors instantly with our free AI-powered grammar checker. Improve your writing quality in seconds.',
    keywords: 'grammar checker, spell checker, writing assistant, proofreading tool, AI grammar',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'AI Grammar Checker',
      'AI-powered tool to check and fix grammar, spelling, and punctuation errors',
      'ProductivityApplication'
    )
  },

  'pdf-to-word': {
    title: 'Free PDF to Word Converter - Convert PDF to DOC Online',
    description: 'Convert PDF files to Word documents instantly for free. Maintain formatting, fonts, and layout. No email required, secure conversion.',
    keywords: 'PDF to Word converter, PDF to DOC, convert PDF online, free PDF converter',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'PDF to Word Converter',
      'Convert PDF documents to Word format while preserving formatting',
      'UtilitiesApplication'
    )
  },

  'qr-generator': {
    title: 'Free QR Code Generator - Create QR Codes Instantly',
    description: 'Generate QR codes for text, URLs, WiFi, and more. Free, fast, and secure QR code generator with customization options.',
    keywords: 'QR code generator, create QR code, QR maker, free QR generator, custom QR codes',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'QR Code Generator',
      'Generate custom QR codes for various content types',
      'UtilitiesApplication'
    )
  },

  'text-to-speech': {
    title: 'Free Text to Speech Converter - AI Voice Generator',
    description: 'Convert text to natural-sounding speech with our AI voice generator. Multiple voices, languages, and accents available for free.',
    keywords: 'text to speech, TTS, voice generator, AI voice, speech synthesis, audio converter',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Text to Speech Converter',
      'Convert text to natural-sounding speech with AI voices',
      'MultimediaApplication'
    )
  },

  'bg-remover': {
    title: 'Free AI Background Remover - Remove Image Backgrounds',
    description: 'Remove backgrounds from images automatically using AI. Fast, accurate, and free background removal tool for photos and graphics.',
    keywords: 'background remover, remove background, AI background removal, photo editor, image editing',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'AI Background Remover',
      'AI-powered tool to automatically remove backgrounds from images',
      'MultimediaApplication'
    )
  },

  'image-compressor': {
    title: 'Free Image Compressor - Reduce Photo File Size Online',
    description: 'Compress images without losing quality. Reduce file size of JPEG, PNG, and WebP images for faster web loading and storage.',
    keywords: 'image compressor, compress images, reduce file size, photo optimizer, image optimization',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Image Compressor',
      'Compress images while maintaining quality for web optimization',
      'MultimediaApplication'
    )
  },

  'resume-builder': {
    title: 'Free AI Resume Builder - Create Professional Resumes',
    description: 'Build professional resumes with AI assistance. ATS-friendly templates, real-time suggestions, and export to PDF. Get hired faster.',
    keywords: 'resume builder, CV maker, AI resume, job application, professional resume, ATS resume',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'AI Resume Builder',
      'Create professional resumes with AI assistance and ATS optimization',
      'ProductivityApplication'
    )
  },

  'word-counter': {
    title: 'Free Word Counter - Count Words, Characters & Sentences',
    description: 'Count words, characters, sentences, and paragraphs in your text. Real-time analysis with reading time estimation.',
    keywords: 'word counter, character counter, text analyzer, writing tools, document statistics',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Word Counter',
      'Count words, characters, and analyze text statistics',
      'ProductivityApplication'
    )
  },

  'read-time': {
    title: 'Reading Time Calculator - Estimate Content Reading Time',
    description: 'Calculate reading time for your content. Get accurate estimates for blog posts, articles, and documents to improve user experience.',
    keywords: 'reading time calculator, content analysis, blog metrics, article estimator, reading speed',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Reading Time Calculator',
      'Calculate estimated reading time for text content',
      'ProductivityApplication'
    )
  },

  'youtube-thumbnail': {
    title: 'YouTube Thumbnail Downloader - Download Video Thumbnails',
    description: 'Download YouTube video thumbnails in high quality. Get HD, maxres, and custom thumbnail images for free.',
    keywords: 'YouTube thumbnail downloader, video thumbnail, YouTube images, thumbnail extractor',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'YouTube Thumbnail Downloader',
      'Download high-quality thumbnails from YouTube videos',
      'MultimediaApplication'
    )
  },
  'pdf-merge-split': {
    title: 'Free PDF Merge & Split Online - No Signup | Aivello',
    description: 'Merge multiple PDFs in any order or split one into page ranges or single pages, privately in your browser. Free, fast and private.',
    keywords: 'merge pdf, combine pdf, split pdf, extract pdf pages, pdf page ranges, reorder pdf, free pdf merger, private pdf tool',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'PDF Merge & Split',
      'Merge multiple PDFs in any order or split one into page ranges or single pages, privately in your browser',
      'UtilitiesApplication'
    )
  },

  'image-converter': {
    title: 'Free Image Converter & Resizer Online - No Signup | Aivello',
    description: 'Convert JPG, PNG, WebP, GIF and BMP to PNG, JPEG or WebP and resize by pixels or percentage, without uploading. Free, fast and private.',
    keywords: 'image converter, resize image, jpg to png, png to jpg, convert to webp, webp to jpg, image resizer, change image format',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Image Converter & Resizer',
      'Convert JPG, PNG, WebP, GIF and BMP to PNG, JPEG or WebP and resize by pixels or percentage, without uploading',
      'MultimediaApplication'
    )
  },

  'color-contrast-checker': {
    title: 'Free Color Contrast Checker Online - No Signup | Aivello',
    description: 'Check WCAG 2.x AA/AAA contrast ratios with a live preview and one-click passing colour suggestions. Free, fast and private.',
    keywords: 'color contrast checker, wcag contrast ratio, accessibility color checker, aa aaa contrast, contrast ratio calculator, accessible colors',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Color Contrast Checker',
      'Check WCAG 2.x AA/AAA contrast ratios with a live preview and one-click passing colour suggestions',
      'DesignApplication'
    )
  },

  'age-calculator': {
    title: 'Free Age & Date Calculator Online - No Signup | Aivello',
    description: 'Exact age in years, months and days, days between dates, and add or subtract days, weeks, months or years. Free, fast and private.',
    keywords: 'age calculator, date calculator, days between dates, date difference, add days to date, birthday countdown, how old am i',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Age & Date Calculator',
      'Exact age in years, months and days, days between dates, and add or subtract days, weeks, months or years',
      'UtilitiesApplication'
    )
  },

  'lorem-ipsum-generator': {
    title: 'Free Lorem Ipsum Generator Online - No Signup | Aivello',
    description: 'Generate placeholder text by paragraphs, sentences or words as plain text or HTML, then copy or download. Free, fast and private.',
    keywords: 'lorem ipsum generator, placeholder text, dummy text, filler text, lorem ipsum html, random text generator',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Lorem Ipsum Generator',
      'Generate placeholder text by paragraphs, sentences or words as plain text or HTML, then copy or download',
      'UtilitiesApplication'
    )
  },

  'case-converter': {
    title: 'Free Case Converter Online - No Signup | Aivello',
    description: 'Convert text to UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case and more. Free, fast and private.',
    keywords: 'case converter, text case converter, title case, sentence case, camelcase converter, snake case, kebab case, uppercase to lowercase',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Case Converter',
      'Convert text to UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case and more',
      'UtilitiesApplication'
    )
  },
  'json-formatter': {
    title: 'Free JSON Formatter & Validator Online - No Signup | Aivello',
    description: 'Format, minify and validate JSON with exact error line and column, recursive key sorting, copy and download. Free, fast and private.',
    keywords: 'json formatter, json validator, json beautifier, json minifier, pretty print json, json lint, sort json keys, format json online',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'JSON Formatter & Validator',
      'Format, minify and validate JSON with exact error line and column, recursive key sorting, copy and download',
      'DeveloperApplication'
    )
  },

  'base64-converter': {
    title: 'Free Base64 Encoder / Decoder Online - No Signup | Aivello',
    description: 'UTF-8 safe Base64 encode/decode with URL-safe mode, plus file to Base64 or data URL and back to a file. Free, fast and private.',
    keywords: 'base64 encoder, base64 decoder, base64 encode online, base64 to file, file to base64, data url converter, url safe base64, utf-8 base64',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Base64 Encoder / Decoder',
      'UTF-8 safe Base64 encode/decode with URL-safe mode, plus file to Base64 or data URL and back to a file',
      'DeveloperApplication'
    )
  },

  'hash-generator': {
    title: 'Free Hash Generator Online - No Signup | Aivello',
    description: 'SHA-1, SHA-256, SHA-384 and SHA-512 hashes for text and files, HMAC-SHA256 and checksum verification. Free, fast and private.',
    keywords: 'hash generator, sha256 generator, sha1 hash, sha512 hash, sha384, hmac sha256 generator, file checksum, verify file hash',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Hash Generator',
      'SHA-1, SHA-256, SHA-384 and SHA-512 hashes for text and files, HMAC-SHA256 and checksum verification',
      'SecurityApplication'
    )
  },

  'uuid-generator': {
    title: 'Free UUID Generator Online - No Signup | Aivello',
    description: 'Generate random v4 and time-ordered v7 UUIDs in bulk (up to 1,000) and validate any UUID. Free, fast and private.',
    keywords: 'uuid generator, uuid v4, uuid v7, guid generator, bulk uuid, random uuid, uuid validator, time ordered uuid',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'UUID Generator',
      'Generate random v4 and time-ordered v7 UUIDs in bulk (up to 1,000) and validate any UUID',
      'DeveloperApplication'
    )
  },

  'text-diff-checker': {
    title: 'Free Text Diff Checker Online - No Signup | Aivello',
    description: 'Compare two texts line by line and word by word in side-by-side or unified view. Free, fast and private.',
    keywords: 'text diff checker, compare text online, diff tool, text compare, find differences between texts, side by side diff, unified diff',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Text Diff Checker',
      'Compare two texts line by line and word by word in side-by-side or unified view',
      'UtilitiesApplication'
    )
  },

  'regex-tester': {
    title: 'Free Regex Tester Online - No Signup | Aivello',
    description: 'Test JavaScript regular expressions live with highlighted matches, groups, flags and replace preview. Free, fast and private.',
    keywords: 'regex tester, regular expression tester, javascript regex, regex online, regex match highlighter, named capture groups, regex replace',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Regex Tester',
      'Test JavaScript regular expressions live with highlighted matches, groups, flags and replace preview',
      'DeveloperApplication'
    )
  },

  'timestamp-converter': {
    title: 'Free Timestamp Converter Online - No Signup | Aivello',
    description: 'Convert Unix timestamps to human dates and back in any time zone: ISO 8601, RFC 2822 and relative time. Free, fast and private.',
    keywords: 'unix timestamp converter, epoch converter, timestamp to date, date to timestamp, unix time now, milliseconds to date, iso 8601 converter, time zone converter',
    structuredData: structuredDataSchemas.createSoftwareApplicationSchema(
      'Timestamp Converter',
      'Convert Unix timestamps to human dates and back in any time zone: ISO 8601, RFC 2822 and relative time',
      'DeveloperApplication'
    )
  },
};
