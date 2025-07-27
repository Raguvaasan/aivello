import React, { createContext, useContext, ReactNode } from 'react';

// Define the type for our analytics context
interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (pageName: string) => void;
}

// Create the context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Custom hook to use analytics
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Props type for the provider component
interface AnalyticsProviderProps {
  children: ReactNode;
}

// Analytics Provider component
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  // Function to track events
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    // You can implement your analytics tracking here
    // For now, just console log
    console.log('[Analytics Event]:', eventName, properties);
  };

  // Function to track page views
  const trackPageView = (pageName: string) => {
    // You can implement your page view tracking here
    console.log('[Page View]:', pageName);
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackPageView }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Export the provider as default
export default AnalyticsProvider;
