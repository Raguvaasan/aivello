import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiStar, FiZap } from 'react-icons/fi';
import { Card, CardContent } from '../components/ui/card';
import { subscriptionPlans } from '../config/monetization';
import { IconWrapper } from '../components/common/IconWrapper';
import { SEOHelmet } from '../components/common/SEOHelmet';

interface PricingPageProps {
  onSubscribe?: (planId: string) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSubscribe = () => {} }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = (planId: string) => {
    if (onSubscribe) {
      onSubscribe(planId);
    } else {
      window.location.href = `/subscribe/${planId}`;
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8);
  };

  return (
    <>
      <SEOHelmet
        title="Pricing Plans - AiVello | Affordable AI Tools"
        description="Choose the perfect plan for your AI productivity needs. Free tier available with premium options starting at $9.99/month."
        keywords="pricing, subscription, AI tools, plans, affordable AI"
        url="https://aivello.vercel.app/pricing"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 py-20">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6">
              Simple Pricing
            </h1>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Choose the perfect plan for your AI productivity needs. Start free, upgrade anytime.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center gap-4 bg-gray-800/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-700 w-fit mx-auto"
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded-full font-bold">
                  Save 20%
                </span>
              </button>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {subscriptionPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <Card
                  className={`relative h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 backdrop-blur-sm hover:scale-105 transition-all duration-300 ${
                    plan.popular
                      ? 'border-purple-500 border-2 shadow-2xl shadow-purple-500/25'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1">
                        <IconWrapper icon={FiStar} className="w-4 h-4" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-8 text-center">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                      <div className="mb-6">
                        <span className="text-5xl font-bold text-white">
                          ${billingCycle === 'monthly' ? plan.price : getYearlyPrice(plan.price)}
                        </span>
                        <span className="text-gray-400 text-lg">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSubscribe(plan.id)}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                            : plan.id === 'free'
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        disabled={plan.id === 'free'}
                      >
                        {plan.id === 'free' ? 'Current Plan' : `Get ${plan.name}`}
                      </motion.button>
                    </div>
                    
                    <ul className="space-y-4 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="mt-1">
                            <IconWrapper icon={FiCheck} className="w-5 h-5 text-green-400" />
                          </div>
                          <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-20 text-center"
          >
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 p-12 rounded-3xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Need a Custom Solution?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Enterprise customers get dedicated support, custom integrations, and white-label solutions.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <IconWrapper icon={FiZap} className="w-5 h-5" />
                Contact Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;
