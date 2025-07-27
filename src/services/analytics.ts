import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { addDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

class AnalyticsService {
  private analytics: Analytics;

  constructor() {
    this.analytics = getAnalytics();
  }

  /**
   * Track a general event
   */
  async trackEvent(eventName: string, eventData?: Record<string, any>) {
    try {
      // Log to Firebase Analytics
      logEvent(this.analytics, eventName, eventData);

      // Store in Firestore for detailed analysis
      await addDoc(collection(db, 'analytics_events'), {
        eventName,
        eventData,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track tool usage
   */
  async trackToolUsage(toolId: string, action: 'view' | 'use' | 'complete', metadata?: Record<string, any>) {
    try {
      const eventData = {
        tool_id: toolId,
        action,
        ...metadata,
      };

      // Log to Firebase Analytics
      logEvent(this.analytics, 'tool_usage', eventData);

      // Store in Firestore
      await addDoc(collection(db, 'tool_usage'), {
        ...eventData,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to track tool usage:', error);
    }
  }

  /**
   * Track user engagement
   */
  async trackEngagement(userId: string, actionType: string, details?: Record<string, any>) {
    try {
      const eventData = {
        user_id: userId,
        action_type: actionType,
        ...details,
      };

      // Log to Firebase Analytics
      logEvent(this.analytics, 'user_engagement', eventData);

      // Store in Firestore
      await addDoc(collection(db, 'user_engagement'), {
        ...eventData,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  }

  /**
   * Get tool usage statistics
   */
  async getToolStats(toolId: string) {
    try {
      const toolUsageRef = collection(db, 'tool_usage');
      const q = query(
        toolUsageRef,
        where('tool_id', '==', toolId),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      const usageData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        totalUses: usageData.length,
        recentUses: usageData.slice(0, 10),
        usageByType: this.aggregateUsageByType(usageData),
      };
    } catch (error) {
      console.error('Failed to get tool stats:', error);
      return null;
    }
  }

  /**
   * Helper method to aggregate usage data
   */
  private aggregateUsageByType(usageData: any[]) {
    return usageData.reduce((acc, curr) => {
      const action = curr.action;
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const analyticsService = new AnalyticsService();
