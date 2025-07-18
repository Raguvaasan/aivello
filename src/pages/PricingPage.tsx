import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { subscriptionPlans, SubscriptionPlan } from '../config/monetization';

interface PricingPageProps {
  onSubscribe?: (planId: string) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSubscribe }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = (planId: string) => {
    if (onSubscribe) {
      onSubscribe(planId);
    } else {
      // Redirect to payment processor (Stripe, PayPal, etc.)
      window.location.href = `/subscribe/${planId}`;
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8); // 20% discount for yearly
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 mb-8">
          Unlock the full potential of AI-powered productivity tools
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-8">
          <span className={`mr-3 ${billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`ml-3 ${billingCycle === 'yearly' ? 'font-semibold' : 'text-gray-500'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
              Save 20%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {subscriptionPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular
                ? 'border-blue-500 border-2 transform scale-105'
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    ${billingCycle === 'monthly' ? plan.price : getYearlyPrice(plan.price)}
                  </span>
                  <span className="text-gray-500">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full mb-6 ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  disabled={plan.id === 'free'}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Get Started'}
                </Button>
                
                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
            <p className="text-gray-600">
              Your data remains safe for 30 days after cancellation. You can reactivate anytime during this period.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
            <p className="text-gray-600">
              Yes, we offer a 30-day money-back guarantee for all paid plans. No questions asked.
            </p>
          </div>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="mt-16 text-center bg-blue-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
        <p className="text-xl text-gray-600 mb-6">
          Enterprise customers get dedicated support, custom integrations, and white-label solutions.
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
          Contact Sales
        </Button>
      </div>
    </div>
  );
};

export default PricingPage;
