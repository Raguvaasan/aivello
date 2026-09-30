import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { logger } from './utils/logger';
import { installGlobalErrorHandlers } from './utils/errorReporter';

installGlobalErrorHandlers();

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Forward Core Web Vitals to Google Analytics when present, and to the console in
// development, so the FCP/LCP/INP/CLS budgets in the project guidelines are measurable.
reportWebVitals((metric) => {
  logger.log('[web-vitals]', metric.name, Math.round(metric.value), metric.rating);

  window.gtag?.('event', metric.name, {
    event_category: 'Web Vitals',
    // CLS is a small fraction; scale it so GA's integer metric values stay useful.
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,
    event_label: metric.id,
    non_interaction: true,
  });
});

// Service worker for offline support. Development is skipped: a SW caching Vite's
// unbundled dev modules causes confusing stale-code bugs.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      logger.warn('Service worker registration failed; offline support unavailable', error);
    });
  });
}
