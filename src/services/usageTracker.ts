import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export interface UsageEvent {
  userId: string;
  toolId: string;
  action: 'generate' | 'analyze' | 'export' | 'api_call';
  timestamp: Timestamp;
  metadata?: {
    language?: string;
    codeLength?: number;
    processingTime?: number;
    success: boolean;
  };
  subscriptionPlan: string;
}

export interface DailyUsage {
  userId: string;
  date: string;
  toolUsage: Record<string, number>;
  totalUsage: number;
  subscriptionPlan: string;
}

export class UsageTracker {
  private static instance: UsageTracker;

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  async trackUsage(event: UsageEvent): Promise<void> {
    try {
      await addDoc(collection(db, 'usage_events'), {
        ...event,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  async getUserDailyUsage(userId: string, date: string): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'usage_events'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting daily usage:', error);
      return 0;
    }
  }

  async getUserMonthlyUsage(userId: string, month: string): Promise<number> {
    try {
      const startOfMonth = new Date(month + '-01');
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'usage_events'),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startOfMonth)),
        where('timestamp', '<=', Timestamp.fromDate(endOfMonth))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting monthly usage:', error);
      return 0;
    }
  }

  async getToolUsageStats(toolId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'usage_events'),
        where('toolId', '==', toolId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => doc.data());

      return {
        totalUsage: events.length,
        successRate: events.filter(e => e.metadata?.success).length / events.length * 100,
        averageProcessingTime: events.reduce((sum, e) => sum + (e.metadata?.processingTime || 0), 0) / events.length,
        languageBreakdown: events.reduce((acc, e) => {
          const lang = e.metadata?.language || 'unknown';
          acc[lang] = (acc[lang] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error getting tool usage stats:', error);
      return null;
    }
  }
}

export default UsageTracker;
