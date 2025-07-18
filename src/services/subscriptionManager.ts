import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import { subscriptionPlans } from '../config/monetization';
import UsageTracker from './usageTracker';

export interface UserSubscription {
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  stripeSubscriptionId?: string;
  paypalSubscriptionId?: string;
  cancelledAt?: Date;
  trialEndDate?: Date;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private usageTracker: UsageTracker;

  constructor() {
    this.usageTracker = UsageTracker.getInstance();
  }

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          cancelledAt: data.cancelledAt?.toDate(),
          trialEndDate: data.trialEndDate?.toDate()
        } as UserSubscription;
      }
      
      // Return default free subscription
      return {
        userId,
        planId: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  async updateSubscription(subscription: UserSubscription): Promise<void> {
    try {
      const docRef = doc(db, 'subscriptions', subscription.userId);
      await setDoc(docRef, {
        ...subscription,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        cancelledAt: subscription.cancelledAt || null,
        trialEndDate: subscription.trialEndDate || null
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  async canUserAccessFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      const plan = subscriptionPlans.find(p => p.id === subscription.planId);
      if (!plan) return false;

      // Check if subscription is active
      if (subscription.status !== 'active' && subscription.status !== 'trial') {
        return false;
      }

      // Check if subscription has expired
      if (subscription.endDate < new Date()) {
        return false;
      }

      // Check feature access based on plan
      switch (feature) {
        case 'advanced_ai':
          return plan.limits.advancedFeatures;
        case 'unlimited_usage':
          return plan.limits.dailyUsage === -1;
        case 'api_access':
          return plan.limits.apiAccess;
        case 'priority_support':
          return plan.limits.prioritySupport;
        case 'team_collaboration':
          return plan.limits.teamMembers > 1;
        case 'custom_branding':
          return plan.limits.customBranding;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  async checkUsageLimit(userId: string, toolId: string): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return { allowed: false, remaining: 0, resetTime: new Date() };

      const plan = subscriptionPlans.find(p => p.id === subscription.planId);
      if (!plan) return { allowed: false, remaining: 0, resetTime: new Date() };

      // Unlimited usage for premium plans
      if (plan.limits.dailyUsage === -1) {
        return { allowed: true, remaining: -1, resetTime: new Date() };
      }

      // Check daily usage
      const today = new Date().toISOString().split('T')[0];
      const dailyUsage = await this.usageTracker.getUserDailyUsage(userId, today);
      
      const remaining = Math.max(0, plan.limits.dailyUsage - dailyUsage);
      const resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);

      return {
        allowed: remaining > 0,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { allowed: false, remaining: 0, resetTime: new Date() };
    }
  }

  async createTrialSubscription(userId: string, planId: string): Promise<UserSubscription> {
    const trialDays = 14;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscription: UserSubscription = {
      userId,
      planId,
      status: 'trial',
      startDate,
      endDate,
      trialEndDate: endDate
    };

    await this.updateSubscription(subscription);
    return subscription;
  }

  async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return;

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();

      await this.updateSubscription(subscription);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  async getSubscriptionAnalytics(): Promise<any> {
    try {
      const q = query(collection(db, 'subscriptions'));
      const querySnapshot = await getDocs(q);
      
      const subscriptions = querySnapshot.docs.map(doc => doc.data());
      
      const analytics = {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        trialSubscriptions: subscriptions.filter(s => s.status === 'trial').length,
        cancelledSubscriptions: subscriptions.filter(s => s.status === 'cancelled').length,
        planBreakdown: subscriptions.reduce((acc, sub) => {
          acc[sub.planId] = (acc[sub.planId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        monthlyRecurringRevenue: subscriptions
          .filter(s => s.status === 'active' && s.planId !== 'free')
          .reduce((sum, sub) => {
            const plan = subscriptionPlans.find(p => p.id === sub.planId);
            return sum + (plan?.price || 0);
          }, 0)
      };

      return analytics;
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return null;
    }
  }
}

export default SubscriptionManager;
