import { lazy } from 'react';
import { ReportHandler } from 'web-vitals';
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';
import type {
  LazyComponents,
  ImageOptimizationConfig,
  CacheConfig,
  CodeSplitConfig
} from '../types/performance';

// Web Vitals reporting function
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getLCP(onPerfEntry);
    getFCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }
};

// Lazy loaded components
export const lazyComponents: LazyComponents = {
  // Tools - only include existing tools
  AICodeAssistant: lazy(() => import('../tools/AICodeAssistant')),
  ImageCompressor: lazy(() => import('../tools/ImageCompressor')),
  PdfToWord: lazy(() => import('../tools/PdfToWord')),
  BgRemover: lazy(() => import('../tools/BgRemover')),
  QrCodeGenerator: lazy(() => import('../tools/QrCodeGenerator')),
  TextToSpeech: lazy(() => import('../tools/TextToSpeech'))
};

// Performance monitoring
export const initializePerformanceMonitoring = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Core Web Vitals reporting
    reportWebVitals((metric) => {
      const body = {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        valueUnit: 'ms'
      };
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vital:', body);
      }
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // You can send this data to your analytics service
        // Example: sendToAnalytics(body);
      }
    });
    
    // Mark initial load
    performance.mark('appInit');
    
    // Observe Long Tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn('Long Task detected:', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.error('PerformanceObserver error:', e);
      }
    }
  }
};

// Cache configuration
export const cacheConfig = {
  staticAssets: {
    maxAge: 31536000, // 1 year in seconds
    immutable: true,
  },
  dynamicContent: {
    maxAge: 3600, // 1 hour in seconds
    revalidate: true,
  },
};

// Image optimization configuration
export const imageConfig = {
  formats: ['webp', 'avif'],
  sizes: {
    mobile: [320, 480, 640],
    tablet: [768, 1024],
    desktop: [1080, 1200, 1920],
    retina: [2048, 3840]
  },
  quality: {
    jpeg: 80,
    webp: 75,
    avif: 70
  },
  loading: 'lazy' as const,
  placeholder: 'blur',
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1920
  },
  optimizerOptions: {
    mozjpeg: {
      quality: 80,
      progressive: true
    },
    webp: {
      quality: 75,
      lossless: false,
      nearLossless: true
    },
    avif: {
      quality: 70,
      speed: 5
    }
  }
};

// Code splitting configuration
export const codeSplitConfig = {
  minChunkSize: 10000, // bytes
  maxInitialRequests: 4,
  maxAsyncRequests: 30,
};

// Service worker registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }
};
