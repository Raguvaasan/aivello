import type { MetricType } from 'web-vitals';

export type WebVitalHandler = (metric: MetricType) => void;

/**
 * Loads web-vitals lazily and subscribes to the Core Web Vitals.
 *
 * web-vitals v5 replaced FID with INP (Interaction to Next Paint), which is what
 * Google now uses as the responsiveness Core Web Vital.
 */
const reportWebVitals = (onPerfEntry?: WebVitalHandler) => {
  if (!onPerfEntry) return;
  void import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  });
};

export default reportWebVitals;
