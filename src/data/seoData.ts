export const structuredDataSchemas = {
  // Organization Schema
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Aivello",
    "url": "https://aivello.vercel.app",
    "logo": "https://aivello.vercel.app/icons/icon-512.png",
    "description": "Free AI-powered tools for everyday productivity tasks",
    "sameAs": [
      "https://github.com/Raguvaasan/aivello"
    ],
    "email": "support@aivello.com"
  },

  // Website Schema
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aivello",
    "url": "https://aivello.vercel.app",
    "description": "Free AI-powered tools for everyday productivity tasks",
    "publisher": {
      "@type": "Organization",
      "name": "Aivello"
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
      "name": "Aivello"
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
    title: 'Aivello - 40+ Free AI-Powered Tools, No Signup Needed',
    description: 'Use 40+ free online tools: PDF to Word, PDF merge, image converter, grammar checker, resume builder, QR codes, JSON formatter and more. No signup, runs in your browser.',
    keywords: 'AI tools, free PDF converter, YouTube thumbnail, grammar checker, text to speech, resume builder, QR code generator, background remover',
    structuredData: [structuredDataSchemas.organization, structuredDataSchemas.website]
  },

  pages: {
    login: {
      title: 'Sign in to Aivello',
      description: 'Sign in to Aivello with Google or GitHub to keep your tool usage history and sync your preferences. All tools stay free.',
      keywords: 'Aivello login, sign in, user account, AI tools access'
    },

    terms: {
      title: 'Terms of Service - Aivello',
      description: 'Read Aivello\'s terms of service and user agreement. Learn about our policies, usage guidelines, and legal terms.',
      keywords: 'terms of service, user agreement, legal terms, Aivello policies'
    },

    privacy: {
      title: 'Privacy Policy - Aivello',
      description: 'Learn how Aivello protects your privacy and handles your data. Transparent privacy policy and data protection measures.',
      keywords: 'privacy policy, data protection, privacy rights, data security, GDPR'
    },

    profile: {
      title: 'User Profile - Aivello',
      description: 'Manage your Aivello account settings, preferences, and usage history. Customize your AI tools experience.',
      keywords: 'user profile, account settings, preferences, usage history'
    },

    history: {
      title: 'Usage History - Aivello',
      description: 'See which Aivello tools you used recently. Only tool names and times are stored, never your content.',
      keywords: 'usage history, tool history, productivity tracking, file history'
    }
  }
};
