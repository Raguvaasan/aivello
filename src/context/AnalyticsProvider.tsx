import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { logger } from '../utils/logger';

type EventParams = Record<string, string | number | boolean | undefined>;

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: EventParams) => void;
  trackPageView: (path: string, title?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

/**
 * Sends events to Google Analytics through the gtag.js snippet in index.html.
 *
 * This used to initialise the Firebase Analytics + Performance SDKs, which (a) pulled
 * the Firebase core into the landing page bundle through a static import and (b)
 * reported to the same GA property gtag already reports to, double counting. gtag is
 * already on the page, so it is used directly. Ad blockers that remove gtag simply
 * turn tracking into a no-op.
 */
const sendToGtag = (command: 'event', name: string, params?: EventParams) => {
  try {
    window.gtag?.(command, name, params);
  } catch (error) {
    logger.warn('Analytics event failed', error);
  }
};

const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const trackEvent = useCallback((eventName: string, properties?: EventParams) => {
    sendToGtag('event', eventName, properties);
  }, []);

  const trackPageView = useCallback((path: string, title?: string) => {
    sendToGtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: title ?? document.title,
    });
  }, []);

  const value = useMemo(() => ({ trackEvent, trackPageView }), [trackEvent, trackPageView]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

export default AnalyticsProvider;
