import React, { useState } from 'react';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface BusinessPlan {
  executiveSummary: string;
  marketAnalysis: string;
  competitorAnalysis: string;
  marketingStrategy: string;
  financialProjections: string;
  operationalPlan: string;
  riskAssessment: string;
  fundingRequirements: string;
}

const AIBusinessPlanGenerator = () => {
  const [businessIdea, setBusinessIdea] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [businessPlan, setBusinessPlan] = useState<BusinessPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('executive-summary');

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Food & Beverage',
    'Real Estate', 'Manufacturing', 'Entertainment', 'Consulting', 'Agriculture', 'Energy'
  ];

  const generateBusinessPlan = async () => {
    if (!businessIdea.trim() || !businessName.trim()) {
      alert('Please provide at least a business idea and name');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const plan: BusinessPlan = {
        executiveSummary: `${businessName} is an innovative ${industry.toLowerCase()} company that addresses ${targetMarket} market needs through ${businessIdea}. 

Our mission is to revolutionize the ${industry.toLowerCase()} industry by providing cutting-edge solutions that deliver exceptional value to our customers. We project significant growth potential with estimated revenues of ${budgetRange} within the first ${timeframe}.

Key Success Factors:
• Innovative product/service offering
• Strong market demand in ${targetMarket}
• Experienced management team
• Scalable business model
• Competitive pricing strategy

Financial Highlights:
• Initial investment requirement: ${budgetRange}
• Projected break-even: ${timeframe}
• Expected ROI: 25-40% within 3 years
• Target market size: $10B+ globally`,

        marketAnalysis: `Market Overview:
The ${industry.toLowerCase()} industry is experiencing rapid growth, driven by technological advancement and changing consumer preferences. Our target market of ${targetMarket} represents a significant opportunity.

Market Size & Growth:
• Total Addressable Market (TAM): $50B+
• Serviceable Available Market (SAM): $10B+
• Serviceable Obtainable Market (SOM): $500M+
• Annual Growth Rate: 15-25%

Market Trends:
• Increasing digital adoption
• Growing demand for sustainable solutions
• Rise of personalized services
• Shift towards subscription models
• Mobile-first consumer behavior

Target Demographics:
• Primary: ${targetMarket}
• Age range: 25-45 years
• Income level: $50K-$150K annually
• Tech-savvy and early adopters
• Value convenience and quality`,

        competitorAnalysis: `Competitive Landscape:
The ${industry.toLowerCase()} market is moderately competitive with several established players and emerging startups.

Direct Competitors:
1. Market Leader A
   - Strengths: Brand recognition, large user base
   - Weaknesses: High pricing, outdated technology
   - Market share: 25%

2. Competitor B
   - Strengths: Innovation, strong marketing
   - Weaknesses: Limited geographic reach
   - Market share: 15%

3. Competitor C
   - Strengths: Low cost, simple interface
   - Weaknesses: Poor customer service
   - Market share: 10%

Competitive Advantages:
• Unique value proposition
• Superior technology platform
• Better customer experience
• Competitive pricing
• Faster time-to-market

Differentiation Strategy:
• Focus on ${businessIdea}
• Superior customer service
• Innovative features
• Strategic partnerships
• Brand positioning`,

        marketingStrategy: `Marketing Mix Strategy:

Product Strategy:
• Core offering: ${businessIdea}
• Premium features and customization
• Continuous innovation and updates
• Multi-platform availability
• 24/7 customer support

Pricing Strategy:
• Competitive pricing model
• Freemium/trial options
• Subscription-based revenue
• Volume discounts
• Promotional pricing for early adopters

Promotion Strategy:
• Digital marketing campaign
• Social media presence
• Content marketing and SEO
• Influencer partnerships
• Industry events and conferences

Place Strategy:
• Online platform
• Mobile applications
• Partner channels
• Direct sales team
• International expansion

Customer Acquisition:
• Target cost per acquisition: $50-100
• Projected customer lifetime value: $500-1000
• Monthly growth rate: 20-30%
• Retention rate target: 85%+

Marketing Budget Allocation:
• Digital advertising: 40%
• Content marketing: 25%
• Events and partnerships: 20%
• PR and branding: 15%`,

        financialProjections: `Financial Projections (3-Year):

Year 1:
• Revenue: $250K
• Gross Margin: 70%
• Operating Expenses: $300K
• Net Loss: $(125K)
• Cash Flow: $(150K)

Year 2:
• Revenue: $750K
• Gross Margin: 75%
• Operating Expenses: $500K
• Net Profit: $62K
• Cash Flow: $100K

Year 3:
• Revenue: $2M
• Gross Margin: 80%
• Operating Expenses: $1.2M
• Net Profit: $400K
• Cash Flow: $500K

Key Metrics:
• Monthly Recurring Revenue (MRR): $50K by Year 2
• Customer Acquisition Cost (CAC): $75
• Customer Lifetime Value (CLV): $750
• Monthly Churn Rate: 5%
• Gross Revenue Retention: 95%

Unit Economics:
• Average Revenue Per User (ARPU): $50/month
• Gross Margin per Customer: $40/month
• Payback Period: 2.5 months
• Return on Ad Spend (ROAS): 4:1

Break-even Analysis:
• Break-even point: Month 18
• Break-even revenue: $500K annually
• Break-even customers: 1,000 active users`,

        operationalPlan: `Operational Structure:

Team Structure:
• CEO/Founder: Strategic leadership
• CTO: Technology development
• CMO: Marketing and growth
• COO: Operations and customer success
• CFO: Finance and fundraising

Key Personnel Requirements:
• Software developers (3-5)
• Marketing specialists (2-3)
• Customer support (2-3)
• Sales representatives (2-3)
• Administrative staff (1-2)

Technology Infrastructure:
• Cloud-based platform (AWS/Azure)
• Mobile applications (iOS/Android)
• API integrations
• Data analytics tools
• Security and compliance systems

Operational Processes:
• Customer onboarding workflow
• Quality assurance procedures
• Customer support protocols
• Data backup and security
• Performance monitoring

Key Performance Indicators:
• System uptime: 99.9%
• Response time: <2 seconds
• Customer satisfaction: 4.5/5
• Support ticket resolution: <24 hours
• Feature release cycle: Monthly

Scalability Plan:
• Automated processes
• Self-service options
• API-first architecture
• Microservices design
• Global CDN deployment`,

        riskAssessment: `Risk Analysis & Mitigation:

Technical Risks:
• Risk: System failures or downtime
• Mitigation: Redundant systems, monitoring, backup plans
• Probability: Medium | Impact: High

Market Risks:
• Risk: Market saturation or competition
• Mitigation: Differentiation, innovation, partnerships
• Probability: Medium | Impact: Medium

Financial Risks:
• Risk: Funding shortage or cash flow issues
• Mitigation: Multiple funding sources, cost control
• Probability: Medium | Impact: High

Operational Risks:
• Risk: Key personnel departure
• Mitigation: Knowledge documentation, succession planning
• Probability: Low | Impact: Medium

Regulatory Risks:
• Risk: Compliance changes or regulations
• Mitigation: Legal counsel, compliance monitoring
• Probability: Low | Impact: Medium

Competitive Risks:
• Risk: New entrants or price wars
• Mitigation: Strong brand, customer loyalty, innovation
• Probability: High | Impact: Medium

Contingency Plans:
• Emergency funding options
• Alternative revenue streams
• Pivot strategies
• Cost reduction measures
• Strategic partnerships`,

        fundingRequirements: `Funding Strategy:

Initial Capital Requirements:
• Total funding needed: ${budgetRange}
• Development costs: 40%
• Marketing & sales: 30%
• Operations & overhead: 20%
• Working capital: 10%

Funding Sources:
1. Bootstrapping: $50K (Personal savings)
2. Friends & Family: $100K
3. Angel Investors: $250K
4. Venture Capital: $500K+
5. Government Grants: $25K

Use of Funds:
• Product development: $200K
• Marketing campaigns: $150K
• Team hiring: $100K
• Infrastructure: $75K
• Legal & compliance: $25K

Funding Timeline:
• Pre-seed: Months 1-6
• Seed round: Months 6-12
• Series A: Months 18-24
• Series B: Months 30-36

Investor Requirements:
• Minimum investment: $25K
• Expected return: 10x in 5 years
• Board representation: Yes
• Liquidation preference: 1x non-participating
• Anti-dilution rights: Weighted average

Exit Strategy:
• IPO potential: 7-10 years
• Acquisition opportunities: 3-5 years
• Strategic partnerships: 2-3 years
• Management buyout: 5-7 years

Financial Projections for Investors:
• Year 1: $250K revenue
• Year 3: $2M revenue
• Year 5: $10M revenue
• Exit valuation: $50M+`
      };

      setBusinessPlan(plan);
      alert('🚀 Business plan generated successfully! Review each section below.');
    } catch (error) {
      console.error('Error generating business plan:', error);
      alert('❌ Failed to generate business plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPlan = () => {
    if (!businessPlan) return;

    const planText = `
${businessName} - Business Plan
Generated by AI Business Plan Generator

EXECUTIVE SUMMARY
${businessPlan.executiveSummary}

MARKET ANALYSIS
${businessPlan.marketAnalysis}

COMPETITOR ANALYSIS
${businessPlan.competitorAnalysis}

MARKETING STRATEGY
${businessPlan.marketingStrategy}

FINANCIAL PROJECTIONS
${businessPlan.financialProjections}

OPERATIONAL PLAN
${businessPlan.operationalPlan}

RISK ASSESSMENT
${businessPlan.riskAssessment}

FUNDING REQUIREMENTS
${businessPlan.fundingRequirements}
`;

    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}-business-plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
    alert('📄 Business plan downloaded successfully!');
  };

  const sections = [
    { id: 'executive-summary', title: '📋 Executive Summary', key: 'executiveSummary' },
    { id: 'market-analysis', title: '📊 Market Analysis', key: 'marketAnalysis' },
    { id: 'competitor-analysis', title: '🏆 Competitor Analysis', key: 'competitorAnalysis' },
    { id: 'marketing-strategy', title: '📈 Marketing Strategy', key: 'marketingStrategy' },
    { id: 'financial-projections', title: '💰 Financial Projections', key: 'financialProjections' },
    { id: 'operational-plan', title: '⚙️ Operational Plan', key: 'operationalPlan' },
    { id: 'risk-assessment', title: '⚠️ Risk Assessment', key: 'riskAssessment' },
    { id: 'funding-requirements', title: '💵 Funding Requirements', key: 'fundingRequirements' }
  ];

  return (
    <ToolWrapper
      toolId="ai-business-plan-generator"
      toolName="AI Business Plan Generator"
      toolDescription="Generate comprehensive business plans with AI assistance. Create professional business plans for startups and investors."
      toolCategory="AI"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-6 space-y-6">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
              🚀 AI Business Plan Generator
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Transform your business idea into a comprehensive, investor-ready business plan
            </p>
          </div>

          {/* Input Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              📝 Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Business Name *</label>
                <Input
                  placeholder="Enter your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Industry *</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500/50 focus:ring-purple-500/50 focus:outline-none"
                >
                  <option value="" className="bg-gray-800 text-white">Select Industry</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind} className="bg-gray-800 text-white">{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Target Market</label>
                <Input
                  placeholder="e.g., Small businesses, millennials, healthcare professionals"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Budget Range</label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500/50 focus:ring-purple-500/50 focus:outline-none"
                >
                  <option value="" className="bg-gray-800 text-white">Select Budget</option>
                  <option value="$0-$50K" className="bg-gray-800 text-white">$0 - $50K</option>
                  <option value="$50K-$250K" className="bg-gray-800 text-white">$50K - $250K</option>
                  <option value="$250K-$1M" className="bg-gray-800 text-white">$250K - $1M</option>
                  <option value="$1M+" className="bg-gray-800 text-white">$1M+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500/50 focus:ring-purple-500/50 focus:outline-none"
                >
                  <option value="" className="bg-gray-800 text-white">Select Timeframe</option>
                  <option value="6 months" className="bg-gray-800 text-white">6 months</option>
                  <option value="1 year" className="bg-gray-800 text-white">1 year</option>
                  <option value="2 years" className="bg-gray-800 text-white">2 years</option>
                  <option value="3+ years" className="bg-gray-800 text-white">3+ years</option>
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-purple-300 mb-2">Business Idea Description *</label>
              <Textarea
                placeholder="Describe your business idea in detail. What problem does it solve? What makes it unique? Who are your customers?"
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/50"
              />
            </div>
            <Button
              onClick={generateBusinessPlan}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 h-12 text-lg font-semibold shadow-lg shadow-purple-500/25"
            >
              {isGenerating ? '🤖 Generating Business Plan...' : '🚀 Generate Business Plan'}
            </Button>
          </div>

        {/* Generated Business Plan */}
        {businessPlan && (
          <div className="space-y-6">
            {/* Section Navigation */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                  📊 Business Plan Sections
                </h3>
                <Button
                  onClick={downloadPlan}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/25"
                >
                  📄 Download Plan
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Section Content */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  {sections.find(s => s.id === activeSection)?.title}
                </h3>
              </div>
              <div className="bg-gray-900/50 border border-white/10 rounded-xl p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                  {businessPlan[sections.find(s => s.id === activeSection)?.key as keyof BusinessPlan]}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            ✨ Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-white mb-2">Market Analysis</h4>
              <p className="text-sm text-gray-400">Comprehensive market research and analysis</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-semibold text-white mb-2">Financial Projections</h4>
              <p className="text-sm text-gray-400">Detailed financial forecasts and metrics</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">🏆</div>
              <h4 className="font-semibold text-white mb-2">Competitive Analysis</h4>
              <p className="text-sm text-gray-400">In-depth competitor research and positioning</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-semibold text-white mb-2">Marketing Strategy</h4>
              <p className="text-sm text-gray-400">Complete marketing and growth plans</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">⚙️</div>
              <h4 className="font-semibold text-white mb-2">Operations Plan</h4>
              <p className="text-sm text-gray-400">Operational structure and processes</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="font-semibold text-white mb-2">Risk Assessment</h4>
              <p className="text-sm text-gray-400">Risk analysis and mitigation strategies</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIBusinessPlanGenerator;
