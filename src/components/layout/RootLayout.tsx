import React, { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useAnalyticsContext } from '../../context/AnalyticsProvider';

/**
 * Top-level route element shared by every page.
 *
 * - Restores scroll position on back/forward and resets it on new navigations
 *   (previously a tool opened scrolled to wherever the last page was).
 * - Reports SPA page views: gtag only records the initial full page load by itself.
 *
 * Framer Motion is deliberately not imported here: this component is on the landing
 * page's critical path. AppLayout applies `MotionConfig reducedMotion="user"`.
 */
export const RootLayout: React.FC = () => {
  const location = useLocation();
  const { trackPageView } = useAnalyticsContext();

  useEffect(() => {
    // Let the page set its <title> first (SEOHelmet runs in an effect too).
    const id = window.setTimeout(() => trackPageView(location.pathname), 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, trackPageView]);

  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
};
