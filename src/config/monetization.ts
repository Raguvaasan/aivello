// Subscription plans configuration
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    dailyUsage: number;
    monthlyUsage: number;
    advancedFeatures: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    teamMembers: number;
    customBranding: boolean;
  };
  popular?: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    features: [
      '10 AI tool uses per day',
      'Basic AI functionality',
      'Standard export formats',
      'Community support',
      'Access to 15+ tools'
    ],
    limits: {
      dailyUsage: 10,
      monthlyUsage: 300,
      advancedFeatures: false,
      prioritySupport: false,
      apiAccess: false,
      teamMembers: 1,
      customBranding: false
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'monthly',
    features: [
      'Unlimited AI tool usage',
      'Advanced AI models (GPT-4, Claude-3)',
      'Priority processing',
      'Advanced export formats',
      'Email support',
      'Usage analytics',
      'Custom templates'
    ],
    limits: {
      dailyUsage: -1, // unlimited
      monthlyUsage: -1,
      advancedFeatures: true,
      prioritySupport: true,
      apiAccess: false,
      teamMembers: 1,
      customBranding: false
    },
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 29.99,
    interval: 'monthly',
    features: [
      'Everything in Pro',
      'Team collaboration (5 members)',
      'API access (10,000 calls/month)',
      'Custom branding',
      'Advanced analytics',
      'Phone support',
      'Custom integrations'
    ],
    limits: {
      dailyUsage: -1,
      monthlyUsage: -1,
      advancedFeatures: true,
      prioritySupport: true,
      apiAccess: true,
      teamMembers: 5,
      customBranding: true
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    interval: 'monthly',
    features: [
      'Everything in Business',
      'Unlimited team members',
      'White-label solutions',
      'Dedicated support manager',
      'Custom AI model training',
      'SLA guarantee',
      'On-premise deployment'
    ],
    limits: {
      dailyUsage: -1,
      monthlyUsage: -1,
      advancedFeatures: true,
      prioritySupport: true,
      apiAccess: true,
      teamMembers: -1,
      customBranding: true
    }
  }
];

// Revenue tracking
export interface RevenueMetrics {
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  conversionRate: number;
}

// Usage tracking for monetization
export interface UsageTracking {
  userId: string;
  toolId: string;
  timestamp: Date;
  subscriptionPlan: string;
  usageType: 'tool_use' | 'api_call' | 'export' | 'advanced_feature';
  success: boolean;
  processingTime: number;
}

// Monetization utilities
export class MonetizationService {
  static checkUsageLimit(userId: string, plan: SubscriptionPlan): boolean {
    // Implementation to check if user has exceeded usage limits
    return true;
  }

  static trackUsage(usage: UsageTracking): void {
    // Implementation to track usage for billing and analytics
  }

  static calculateRevenue(subscriptions: any[]): RevenueMetrics {
    // Implementation to calculate revenue metrics
    return {
      monthlyRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      customerLifetimeValue: 0,
      churnRate: 0,
      conversionRate: 0
    };
  }
}

// Feature flags for different subscription tiers
export const featureFlags = {
  advancedAI: (plan: string) => ['pro', 'business', 'enterprise'].includes(plan),
  apiAccess: (plan: string) => ['business', 'enterprise'].includes(plan),
  customBranding: (plan: string) => ['business', 'enterprise'].includes(plan),
  prioritySupport: (plan: string) => ['pro', 'business', 'enterprise'].includes(plan),
  teamCollaboration: (plan: string) => ['business', 'enterprise'].includes(plan),
  unlimitedUsage: (plan: string) => ['pro', 'business', 'enterprise'].includes(plan)
};
