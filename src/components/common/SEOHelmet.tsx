import React, { useEffect, useMemo } from 'react';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  article?: {
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
  structuredData?: object;
}

const ARTICLE_TAG_ATTR = 'data-seo-article-tag';

export const SEOHelmet: React.FC<SEOHelmetProps> = ({
  title = 'Aivello - 40+ Free AI-Powered Tools, No Signup Needed',
  description = 'Aivello offers 40+ free tools like PDF to Word, PDF merge, image converter, QR code generator and more. No signup needed.',
  keywords = 'AI tools, free PDF converter, YouTube thumbnail, grammar checker, text to speech, resume builder',
  image = 'https://aivello.vercel.app/og-image.png',
  url = 'https://aivello.vercel.app/',
  type = 'website',
  noindex = false,
  article,
  structuredData,
}) => {
  const fullTitle = /aivello/i.test(title) ? title : `${title} | Aivello`;

  // Callers pass `article` and `structuredData` as inline object literals, so their
  // identity changes on every render. Serialising them gives the effect a stable
  // primitive dependency; without this the effect re-ran constantly and appended a
  // fresh set of meta tags each time.
  const articleKey = useMemo(() => (article ? JSON.stringify(article) : ''), [article]);
  const structuredDataKey = useMemo(
    () => (structuredData ? JSON.stringify(structuredData) : ''),
    [structuredData]
  );

  useEffect(() => {
    document.title = fullTitle;

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;

      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(isProperty ? 'property' : 'name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Primary
    updateMetaTag('title', fullTitle);
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateLinkTag('canonical', url);

    // The noindex prop was previously declared but ignored, so gated and utility
    // pages advertised themselves as indexable.
    const robots = noindex ? 'noindex, nofollow' : 'index, follow';
    updateMetaTag('robots', robots);
    updateMetaTag('googlebot', robots);

    // Open Graph
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:site_name', 'Aivello', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', url);
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:creator', '@aivello');

    // Note: theme-color and viewport are intentionally NOT set here. They are static
    // and already declared in public/index.html; overwriting theme-color per route
    // made the mobile browser chrome change colour during navigation.

    // Article tags. Marked with a data attribute so this component removes exactly
    // the nodes it created instead of leaking a new set on every run.
    document.querySelectorAll(`meta[${ARTICLE_TAG_ATTR}]`).forEach((el) => el.remove());

    if (article && type === 'article') {
      if (article.author) updateMetaTag('article:author', article.author, true);
      if (article.publishedTime) updateMetaTag('article:published_time', article.publishedTime, true);
      if (article.modifiedTime) updateMetaTag('article:modified_time', article.modifiedTime, true);
      if (article.section) updateMetaTag('article:section', article.section, true);

      article.tags?.forEach((tag) => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', tag);
        meta.setAttribute(ARTICLE_TAG_ATTR, '');
        document.head.appendChild(meta);
      });
    }

    // Structured data
    document.querySelector('#structured-data')?.remove();
    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      document.querySelector('#structured-data')?.remove();
      document.querySelectorAll(`meta[${ARTICLE_TAG_ATTR}]`).forEach((el) => el.remove());
    };
    // article/structuredData are tracked via their serialised keys above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTitle, description, keywords, image, url, type, noindex, articleKey, structuredDataKey]);

  return null;
};
