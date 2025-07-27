import { useCallback } from 'react';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const useAnalytics = () => {
  const analytics = getAnalytics();

  const trackEvent = useCallback(async (
    eventName: string,
    eventData?: Record<string, any>
  ) => {
    try {
      // Log to Firebase Analytics
      logEvent(analytics, eventName, eventData);

      // Log to Firestore for detailed analysis
      await addDoc(collection(db, 'analytics_events'), {
        eventName,
        eventData,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }, [analytics]);

  const trackToolUsage = useCallback(async (
    toolId: string,
    actionType: 'view' | 'use' | 'complete',
    metadata?: Record<string, any>
  ) => {
    try {
      const eventData = {
        tool_id: toolId,
        action: actionType,
        ...metadata,
      };

      // Log to Firebase Analytics
      logEvent(analytics, 'tool_usage', eventData);

      // Log to Firestore for detailed analysis
      await addDoc(collection(db, 'tool_usage'), {
        ...eventData,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Tool usage tracking failed:', error);
    }
  }, [analytics]);

  return {
    trackEvent,
    trackToolUsage,
  };
};
