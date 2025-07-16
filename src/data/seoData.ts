export const structuredDataSchemas = {
  // Organization Schema
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AiVello",
    "url": "https://aivello.vercel.app",
    "logo": "https://aivello.vercel.app/logo.svg",
    "description": "Free AI-powered tools for everyday productivity tasks",
    "sameAs": [
      "https://github.com/aivello",
      "https://twitter.com/aivello"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://aivello.vercel.app/contact"
    }
  },

  // Website Schema
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AiVello",
    "url": "https://aivello.vercel.app",
    "description": "Free AI-powered tools for everyday productivity tasks",
    "publisher": {
      "@type": "Organization",
      "name": "AiVello"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://aivello.vercel.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },

  // Software Application Schema for tools
  createSoftwareApplicationSchema: (toolName: string, description: string, category: string) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": toolName,
    "description": description,
    "applicationCategory": category,
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AiVello"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    }
  }),

  // FAQ Schema
  createFAQSchema: (faqs: Array<{question: string, answer: string}>) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }),

  // Breadcrumb Schema
  createBreadcrumbSchema: (breadcrumbs: Array<{name: string, url: string}>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.url
    }))
  }),

  // How-to Schema for tool instructions
  createHowToSchema: (toolName: string, steps: string[]) => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to use ${toolName}`,
    "description": `Step by step guide to use ${toolName} tool`,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": `Step ${index + 1}`,
      "text": step
    }))
  })
};

export const seoData = {
  homepage: {
    title: 'AiVello - Free AI-Powered Daily Tools',
    description: 'Access 10+ free AI tools including PDF to Word converter, YouTube thumbnail grabber, grammar checker, QR code generator, and more. No signup required!',
    keywords: 'AI tools, free PDF converter, YouTube thumbnail, grammar checker, text to speech, resume builder, QR code generator, background remover',
    structuredData: [structuredDataSchemas.organization, structuredDataSchemas.website]
  },

  tools: {
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
    }
  },

  pages: {
    login: {
      title: 'Login to AiVello - Access Premium AI Tools',
      description: 'Sign in to AiVello to access your saved projects, preferences, and premium AI tools. Quick login with Google or GitHub.',
      keywords: 'AiVello login, sign in, user account, AI tools access'
    },

    terms: {
      title: 'Terms of Service - AiVello',
      description: 'Read AiVello\'s terms of service and user agreement. Learn about our policies, usage guidelines, and legal terms.',
      keywords: 'terms of service, user agreement, legal terms, AiVello policies'
    },

    privacy: {
      title: 'Privacy Policy - AiVello',
      description: 'Learn how AiVello protects your privacy and handles your data. Transparent privacy policy and data protection measures.',
      keywords: 'privacy policy, data protection, privacy rights, data security, GDPR'
    },

    profile: {
      title: 'User Profile - AiVello',
      description: 'Manage your AiVello account settings, preferences, and usage history. Customize your AI tools experience.',
      keywords: 'user profile, account settings, preferences, usage history'
    },

    history: {
      title: 'Usage History - AiVello',
      description: 'View your AI tools usage history and track your productivity. Access previously processed files and results.',
      keywords: 'usage history, tool history, productivity tracking, file history'
    }
  }
};
