/**
 * Client-side business plan builder.
 *
 * There is no paid AI API behind this tool, so the plan is assembled from industry
 * profiles, signals detected in the user's own description, and a small 36-month
 * financial model driven by the budget they pick. Every section is derived from the
 * input; nothing here is a fixed placeholder that ignores what the user typed.
 */

export const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Food & Beverage',
  'Real Estate', 'Manufacturing', 'Entertainment', 'Consulting', 'Agriculture', 'Energy',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const BUDGET_OPTIONS = [
  { value: '$0-$50K', label: '$0 - $50K', amount: 30_000 },
  { value: '$50K-$250K', label: '$50K - $250K', amount: 150_000 },
  { value: '$250K-$1M', label: '$250K - $1M', amount: 600_000 },
  { value: '$1M+', label: '$1M+', amount: 1_500_000 },
] as const;

export const TIMEFRAME_OPTIONS = [
  { value: '6 months', label: '6 months', months: 6 },
  { value: '1 year', label: '1 year', months: 12 },
  { value: '2 years', label: '2 years', months: 24 },
  { value: '3+ years', label: '3+ years', months: 36 },
] as const;

export interface BusinessPlanInput {
  businessName: string;
  industry: string;
  businessIdea: string;
  targetMarket: string;
  budgetRange: string;
  timeframe: string;
}

export type SectionId =
  | 'executive-summary'
  | 'market-analysis'
  | 'competitor-analysis'
  | 'marketing-strategy'
  | 'financial-projections'
  | 'operational-plan'
  | 'risk-assessment'
  | 'funding-requirements';

export interface PlanSection {
  id: SectionId;
  title: string;
  icon: string;
  content: string;
}

export interface BusinessPlan {
  businessName: string;
  generatedAt: string;
  sections: PlanSection[];
  assumptions: string[];
}

export type BusinessPlanErrors = Partial<Record<'businessName' | 'industry' | 'businessIdea', string>>;

export const IDEA_MIN_LENGTH = 30;

export const validateBusinessPlanInput = (input: BusinessPlanInput): BusinessPlanErrors => {
  const errors: BusinessPlanErrors = {};
  const name = input.businessName.trim();
  if (!name) errors.businessName = 'Enter a business name.';
  else if (name.length > 80) errors.businessName = 'Keep the business name under 80 characters.';
  if (!input.industry) errors.industry = 'Choose the industry you operate in.';
  const idea = input.businessIdea.trim();
  if (!idea) errors.businessIdea = 'Describe your business idea.';
  else if (idea.length < IDEA_MIN_LENGTH) {
    errors.businessIdea = `Add a little more detail (at least ${IDEA_MIN_LENGTH} characters) so the plan can reflect your idea.`;
  }
  return errors;
};

interface CompetitorArchetype {
  type: string;
  strengths: string;
  weaknesses: string;
}

interface IndustryProfile {
  trends: string[];
  competitors: CompetitorArchetype[];
  risks: string[];
  regulation: string;
  grossMargin: number;
  /** Year-over-year revenue multiplier used by the model. */
  growth: number;
  /** Steady-state yearly revenue at launch, as a multiple of the starting budget. */
  revenueRatio: number;
  defaultMarket: string;
  channels: string[];
  roles: string[];
  kpis: string[];
  /** Use of funds, percentages summing to 100. */
  funds: [string, number][];
}

const PROFILES: Record<Industry, IndustryProfile> = {
  Technology: {
    trends: ['AI features are becoming a baseline expectation', 'Buyers favour usage-based and subscription pricing', 'Security and privacy are part of every purchase decision', 'Product-led growth (free trials, self-serve onboarding)'],
    competitors: [
      { type: 'Established software incumbents', strengths: 'Brand trust, large install base, integrations', weaknesses: 'Slow release cycles, complex pricing' },
      { type: 'Venture-backed startups', strengths: 'Fast iteration, aggressive marketing', weaknesses: 'High burn rate, may pivot or shut down' },
      { type: 'Open-source / DIY alternatives', strengths: 'Free, flexible', weaknesses: 'Require technical skill, no support' },
    ],
    risks: ['Technical debt slowing down releases', 'Cloud costs growing faster than revenue', 'Security incident or data breach'],
    regulation: 'Data protection (GDPR/CCPA), accessibility requirements and software licensing terms.',
    grossMargin: 0.78, growth: 2.6, revenueRatio: 0.4, defaultMarket: 'small and mid-sized businesses',
    channels: ['Content marketing and SEO around the problems you solve', 'Free trial or freemium tier', 'Integration marketplaces and partner listings'],
    roles: ['Full-stack developers', 'Product designer', 'Customer success lead'],
    kpis: ['Monthly recurring revenue (MRR)', 'Trial-to-paid conversion', 'Monthly churn'],
    funds: [['Product development', 40], ['Marketing & sales', 30], ['Operations & overhead', 15], ['Working capital reserve', 10], ['Legal & compliance', 5]],
  },
  Healthcare: {
    trends: ['Telehealth and remote monitoring adoption', 'Shift toward preventive and value-based care', 'Patient demand for convenient digital access', 'Interoperability of health records'],
    competitors: [
      { type: 'Hospital networks and large clinics', strengths: 'Referral networks, insurer contracts', weaknesses: 'Long wait times, impersonal experience' },
      { type: 'Digital health startups', strengths: 'Convenient apps, modern UX', weaknesses: 'Limited clinical validation' },
      { type: 'Independent practitioners', strengths: 'Personal relationships, local trust', weaknesses: 'Limited capacity and technology' },
    ],
    risks: ['Regulatory approval or licensing delays', 'Clinical liability claims', 'Long sales cycles with providers and insurers'],
    regulation: 'Patient privacy (HIPAA or local equivalent), practitioner licensing, and medical device rules if applicable.',
    grossMargin: 0.6, growth: 2.0, revenueRatio: 0.8, defaultMarket: 'patients and care providers',
    channels: ['Referral partnerships with practitioners', 'Educational content reviewed by clinicians', 'Community health events'],
    roles: ['Licensed clinical lead', 'Compliance officer', 'Patient support coordinator'],
    kpis: ['Patient acquisition cost', 'Patient retention / repeat visits', 'Net promoter score'],
    funds: [['Clinical operations & staff', 35], ['Compliance & certification', 15], ['Technology & equipment', 20], ['Marketing & partnerships', 20], ['Working capital reserve', 10]],
  },
  Finance: {
    trends: ['Embedded finance inside non-financial apps', 'Real-time payments and open banking', 'Demand for transparent, low-fee products', 'Automation of compliance (RegTech)'],
    competitors: [
      { type: 'Traditional banks and brokers', strengths: 'Trust, licences, capital', weaknesses: 'Legacy systems, high fees' },
      { type: 'Fintech challengers', strengths: 'Slick apps, low fees', weaknesses: 'Thin margins, regulatory scrutiny' },
      { type: 'Independent advisors', strengths: 'Personal advice', weaknesses: 'Hard to scale, expensive' },
    ],
    risks: ['Licensing and regulatory change', 'Fraud and chargebacks', 'Customer trust after any security issue'],
    regulation: 'Financial licensing, KYC/AML obligations, consumer credit and data protection rules.',
    grossMargin: 0.65, growth: 2.2, revenueRatio: 0.5, defaultMarket: 'consumers and small businesses managing money',
    channels: ['Comparison sites and financial content', 'Partnerships with accountants and advisors', 'Referral rewards'],
    roles: ['Compliance & risk manager', 'Backend engineers', 'Customer support specialists'],
    kpis: ['Assets or payment volume processed', 'Customer acquisition cost', 'Fraud / loss rate'],
    funds: [['Licensing & compliance', 25], ['Product development', 30], ['Marketing & sales', 25], ['Working capital reserve', 15], ['Operations & overhead', 5]],
  },
  'E-commerce': {
    trends: ['Social commerce and creator-led selling', 'Fast, free shipping as a baseline expectation', 'Sustainable packaging and ethical sourcing', 'Repeat purchase via subscriptions and bundles'],
    competitors: [
      { type: 'Large marketplaces (Amazon-style)', strengths: 'Selection, fast delivery, low prices', weaknesses: 'Generic experience, no brand story' },
      { type: 'Direct-to-consumer brands', strengths: 'Strong branding, loyal communities', weaknesses: 'High ad spend dependence' },
      { type: 'Local retailers', strengths: 'Try-before-you-buy, instant pickup', weaknesses: 'Limited reach, smaller catalogue' },
    ],
    risks: ['Rising paid-ad acquisition costs', 'Inventory tied up in slow-moving stock', 'Supplier or shipping disruption'],
    regulation: 'Consumer protection and returns rules, sales tax/VAT collection, product safety labelling.',
    grossMargin: 0.45, growth: 2.1, revenueRatio: 1.2, defaultMarket: 'online shoppers',
    channels: ['Instagram/TikTok content and creator partnerships', 'Email and SMS retention flows', 'Marketplace listings as a secondary channel'],
    roles: ['E-commerce / store manager', 'Performance marketer', 'Fulfilment and customer service'],
    kpis: ['Conversion rate', 'Average order value', 'Repeat purchase rate'],
    funds: [['Inventory & sourcing', 35], ['Marketing & ads', 30], ['Store & technology', 10], ['Fulfilment & logistics', 15], ['Working capital reserve', 10]],
  },
  Education: {
    trends: ['Online and hybrid learning', 'Short, skills-based courses and certificates', 'Personalised learning paths', 'Employers funding upskilling'],
    competitors: [
      { type: 'Established institutions', strengths: 'Accreditation, reputation', weaknesses: 'Expensive, slow to update curriculum' },
      { type: 'Online course platforms', strengths: 'Huge catalogues, low prices', weaknesses: 'Low completion rates, little support' },
      { type: 'Private tutors', strengths: 'Personal attention', weaknesses: 'Expensive, limited availability' },
    ],
    risks: ['Low course completion hurting reviews', 'Seasonal enrolment swings', 'Accreditation requirements'],
    regulation: 'Accreditation (if issuing credentials), child safeguarding for minors, and student data privacy.',
    grossMargin: 0.7, growth: 2.0, revenueRatio: 0.7, defaultMarket: 'learners and parents',
    channels: ['Free lessons, webinars and YouTube content', 'Partnerships with schools or employers', 'Student referral programme'],
    roles: ['Curriculum designer', 'Instructors / tutors', 'Community & student success manager'],
    kpis: ['Enrolments per month', 'Completion rate', 'Student satisfaction'],
    funds: [['Curriculum & content production', 35], ['Marketing & enrolment', 30], ['Platform & technology', 15], ['Operations & overhead', 10], ['Working capital reserve', 10]],
  },
  'Food & Beverage': {
    trends: ['Health-conscious and plant-based options', 'Delivery and online ordering', 'Local and sustainable sourcing', 'Experience-driven dining'],
    competitors: [
      { type: 'Chains and franchises', strengths: 'Brand recognition, buying power', weaknesses: 'Standardised, less personal' },
      { type: 'Independent local venues', strengths: 'Character, community loyalty', weaknesses: 'Inconsistent marketing' },
      { type: 'Delivery-only / ghost kitchens', strengths: 'Low overhead, convenience', weaknesses: 'Platform fees, weak brand' },
    ],
    risks: ['Food cost inflation', 'Staff turnover', 'Health inspection or food safety incident'],
    regulation: 'Food safety certification, health inspections, alcohol licensing (if applicable) and allergen labelling.',
    grossMargin: 0.62, growth: 1.5, revenueRatio: 1.5, defaultMarket: 'local diners and food lovers',
    channels: ['Google Business Profile and local reviews', 'Instagram food photography', 'Delivery app listings'],
    roles: ['Head chef / production lead', 'Front-of-house staff', 'Purchasing and inventory manager'],
    kpis: ['Food cost percentage', 'Covers or orders per day', 'Average ticket size'],
    funds: [['Fit-out & equipment', 35], ['Initial inventory', 10], ['Staffing (first months)', 20], ['Marketing & launch', 15], ['Working capital reserve', 20]],
  },
  'Real Estate': {
    trends: ['Digital-first property search and virtual tours', 'Demand for flexible and short-term rentals', 'Energy-efficient buildings', 'Data-driven pricing'],
    competitors: [
      { type: 'Large brokerages', strengths: 'Listings volume, brand', weaknesses: 'High commissions, less personal' },
      { type: 'Online property portals', strengths: 'Reach, convenience', weaknesses: 'Little local expertise' },
      { type: 'Independent agents / landlords', strengths: 'Local knowledge', weaknesses: 'Limited marketing budget' },
    ],
    risks: ['Interest-rate changes reducing demand', 'Vacancy periods', 'Property value decline'],
    regulation: 'Agent licensing, tenancy and fair-housing laws, zoning and building codes.',
    grossMargin: 0.55, growth: 1.6, revenueRatio: 0.8, defaultMarket: 'home buyers, sellers and renters',
    channels: ['Listing portals and local SEO', 'Referral partnerships with mortgage brokers', 'Neighbourhood content and open houses'],
    roles: ['Licensed agent / property manager', 'Transaction coordinator', 'Marketing & listings specialist'],
    kpis: ['Deals closed per quarter', 'Average commission or yield', 'Occupancy rate'],
    funds: [['Property / acquisition costs', 45], ['Marketing & lead generation', 20], ['Licensing & legal', 10], ['Operations & overhead', 10], ['Working capital reserve', 15]],
  },
  Manufacturing: {
    trends: ['Automation and smart factories', 'Near-shoring of supply chains', 'Sustainable materials', 'Small-batch and on-demand production'],
    competitors: [
      { type: 'Large-scale manufacturers', strengths: 'Economies of scale', weaknesses: 'High minimum orders, slow customisation' },
      { type: 'Overseas suppliers', strengths: 'Low unit cost', weaknesses: 'Long lead times, quality variance' },
      { type: 'Specialist workshops', strengths: 'Craftsmanship, flexibility', weaknesses: 'Limited capacity' },
    ],
    risks: ['Raw material price swings', 'Equipment breakdown', 'Quality defects and recalls'],
    regulation: 'Product safety standards, workplace health & safety, environmental permits.',
    grossMargin: 0.38, growth: 1.6, revenueRatio: 1.0, defaultMarket: 'businesses that need reliable production partners',
    channels: ['Trade shows and industry directories', 'Direct B2B outreach', 'Distributor partnerships'],
    roles: ['Production manager', 'Quality assurance lead', 'Procurement specialist'],
    kpis: ['Unit cost', 'On-time delivery rate', 'Defect rate'],
    funds: [['Equipment & tooling', 40], ['Raw materials', 20], ['Facility & utilities', 15], ['Sales & marketing', 10], ['Working capital reserve', 15]],
  },
  Entertainment: {
    trends: ['Short-form video and creator economy', 'Live and immersive experiences', 'Subscription and fan-funding models', 'Community-driven content'],
    competitors: [
      { type: 'Major studios / platforms', strengths: 'Budgets, distribution', weaknesses: 'Risk-averse, generic content' },
      { type: 'Independent creators', strengths: 'Authenticity, niche audiences', weaknesses: 'Inconsistent income' },
      { type: 'Local venues and events', strengths: 'In-person experience', weaknesses: 'Capacity limits' },
    ],
    risks: ['Audience tastes shifting quickly', 'Platform algorithm changes', 'Rights and licensing disputes'],
    regulation: 'Copyright and licensing, event permits, age ratings where relevant.',
    grossMargin: 0.55, growth: 2.0, revenueRatio: 0.6, defaultMarket: 'fans and audiences in your niche',
    channels: ['Short-form video on TikTok/Reels/Shorts', 'Collaborations with other creators', 'Community on Discord or newsletters'],
    roles: ['Content producer', 'Community manager', 'Partnerships & sponsorship lead'],
    kpis: ['Audience growth', 'Engagement rate', 'Revenue per fan'],
    funds: [['Content & production', 40], ['Marketing & promotion', 30], ['Equipment & software', 10], ['Rights & legal', 5], ['Working capital reserve', 15]],
  },
  Consulting: {
    trends: ['Demand for specialised, outcome-based advice', 'Remote delivery of workshops', 'Productised services with fixed prices', 'AI-assisted analysis'],
    competitors: [
      { type: 'Large consulting firms', strengths: 'Brand, breadth', weaknesses: 'Expensive, junior staff on projects' },
      { type: 'Freelance consultants', strengths: 'Low cost, flexible', weaknesses: 'Limited capacity, variable quality' },
      { type: 'Online courses and templates', strengths: 'Cheap, self-serve', weaknesses: 'No tailoring or accountability' },
    ],
    risks: ['Revenue concentration in a few clients', 'Founder capacity limits', 'Scope creep on fixed-price work'],
    regulation: 'Professional liability insurance, contracts and any sector-specific certifications.',
    grossMargin: 0.7, growth: 1.8, revenueRatio: 1.2, defaultMarket: 'businesses needing specialist expertise',
    channels: ['LinkedIn thought leadership', 'Case studies and referrals', 'Speaking at industry events'],
    roles: ['Senior consultants', 'Business development lead', 'Operations / project coordinator'],
    kpis: ['Utilisation rate', 'Average project value', 'Client retention'],
    funds: [['Business development', 30], ['Team & contractors', 35], ['Tools & software', 10], ['Insurance & legal', 10], ['Working capital reserve', 15]],
  },
  Agriculture: {
    trends: ['Precision farming and sensors', 'Direct-to-consumer farm sales', 'Regenerative and organic practices', 'Climate resilience'],
    competitors: [
      { type: 'Large agribusiness', strengths: 'Scale, distribution', weaknesses: 'Commodity pricing, weak provenance story' },
      { type: 'Local farms and co-ops', strengths: 'Freshness, community trust', weaknesses: 'Limited marketing' },
      { type: 'Imported produce', strengths: 'Year-round supply', weaknesses: 'Freshness, carbon footprint' },
    ],
    risks: ['Weather and climate events', 'Crop disease or pests', 'Commodity price volatility'],
    regulation: 'Food safety, land use, water rights and organic certification if claimed.',
    grossMargin: 0.45, growth: 1.4, revenueRatio: 1.0, defaultMarket: 'local consumers, grocers and restaurants',
    channels: ['Farmers markets and CSA boxes', 'Restaurant and grocer partnerships', 'Farm-story content on social media'],
    roles: ['Farm operations manager', 'Seasonal workers', 'Sales & distribution coordinator'],
    kpis: ['Yield per acre', 'Cost per unit produced', 'Direct-sales share'],
    funds: [['Land, seeds & inputs', 35], ['Equipment', 25], ['Labour', 15], ['Distribution & marketing', 10], ['Working capital reserve', 15]],
  },
  Energy: {
    trends: ['Rapid growth in solar, storage and EV charging', 'Government incentives for clean energy', 'Corporate net-zero commitments', 'Smart-grid and efficiency software'],
    competitors: [
      { type: 'Utilities and large energy companies', strengths: 'Capital, infrastructure', weaknesses: 'Slow to innovate' },
      { type: 'Clean-tech startups', strengths: 'Innovation, incentives expertise', weaknesses: 'Capital intensive, long payback' },
      { type: 'Local installers', strengths: 'Local presence', weaknesses: 'Limited financing options' },
    ],
    risks: ['Changes to subsidies or incentives', 'High upfront capital needs', 'Permitting and grid-connection delays'],
    regulation: 'Energy regulation, permitting, safety certification and grid-connection rules.',
    grossMargin: 0.35, growth: 1.9, revenueRatio: 0.9, defaultMarket: 'homeowners and businesses reducing energy costs',
    channels: ['Savings calculators and educational content', 'Partnerships with builders and property managers', 'Incentive-driven campaigns'],
    roles: ['Engineers / certified installers', 'Project manager', 'Sales & incentives specialist'],
    kpis: ['Projects completed', 'Installed capacity', 'Customer payback period'],
    funds: [['Equipment & inventory', 35], ['Certification & permits', 15], ['Installation team', 20], ['Marketing & sales', 15], ['Working capital reserve', 15]],
  },
};

interface IdeaSignal {
  key: string;
  label: string;
  re: RegExp;
  revenue?: string;
  channel?: string;
  advantage?: string;
  risk?: string;
}

const SIGNALS: IdeaSignal[] = [
  { key: 'subscription', label: 'recurring subscription model', re: /\b(subscription|subscribe|monthly plan|saas|membership|recurring)\b/i, revenue: 'Recurring subscription plans (monthly and discounted annual)', advantage: 'Predictable recurring revenue', risk: 'Churn - customers cancelling after the first months' },
  { key: 'marketplace', label: 'marketplace', re: /\b(marketplace|two-sided|connects?|connecting|matching|vendors?|sellers? and buyers?)\b/i, revenue: 'Commission or booking fee on each transaction', advantage: 'Network effects as both sides grow', risk: 'Chicken-and-egg problem attracting both sides at launch' },
  { key: 'app', label: 'mobile app', re: /\b(app|mobile|ios|android)\b/i, channel: 'App Store / Google Play optimisation and in-app referrals', risk: 'App-store review delays and platform fees' },
  { key: 'b2b', label: 'B2B focus', re: /\b(b2b|businesses|companies|enterprises?|smbs?|small business(es)?|teams|organi[sz]ations)\b/i, channel: 'Targeted outbound sales and LinkedIn outreach', risk: 'Long B2B sales cycles delaying revenue' },
  { key: 'local', label: 'local presence', re: /\b(local|neighbou?rhood|city|store|shop|restaurant|cafe|café|studio|salon|gym|bakery)\b/i, channel: 'Local SEO, Google Business Profile and community events', advantage: 'Personal relationships with a local customer base' },
  { key: 'sustainable', label: 'sustainability angle', re: /\b(eco|green|sustainab\w*|recycl\w*|organic|carbon|zero[- ]waste|ethical)\b/i, advantage: 'Sustainability positioning that resonates with values-driven buyers', channel: 'Partnerships with sustainability communities and certifications' },
  { key: 'ai', label: 'AI / automation', re: /\b(ai|artificial intelligence|machine learning|automat\w*|chatbot)\b/i, advantage: 'Automation that lowers the cost of serving each customer', risk: 'Accuracy and trust concerns about automated output' },
  { key: 'ecommerce', label: 'online sales', re: /\b(online store|e-?commerce|shopify|sell online|d2c|dtc|direct[- ]to[- ]consumer|delivery)\b/i, revenue: 'Direct online sales with bundles and upsells', channel: 'Retargeting ads and email flows for abandoned carts' },
  { key: 'service', label: 'service-based offering', re: /\b(consult\w*|agency|coaching|freelanc\w*|done-for-you|professional services)\b/i, revenue: 'Project fees and monthly retainers', advantage: 'Deep, tailored relationships with each client' },
  { key: 'premium', label: 'premium positioning', re: /\b(premium|luxury|high-end|bespoke|artisan\w*|handmade|custom)\b/i, revenue: 'Premium pricing backed by quality and craftsmanship', advantage: 'Higher margins per sale' },
  { key: 'affordable', label: 'affordability focus', re: /\b(affordable|cheap|low[- ]cost|budget|free)\b/i, advantage: 'Lower price point than established alternatives', risk: 'Thin margins leave little room for error' },
];

const STOPWORDS = new Set('a an and are as at be but by for from has have i in into is it its of on or our that the their them they this to we will with who what which you your can help helps people customers users make makes more'.split(' '));

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

const firstSentence = (text: string, max = 220): string => {
  const t = clean(text);
  const m = t.match(/^(.+?[.!?])(\s|$)/);
  const s = m ? m[1] : t;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

const ensurePeriod = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);

/** Most frequent meaningful words in the idea, used to echo the user's own vocabulary. */
export const extractKeywords = (text: string, limit = 5): string[] => {
  const counts = new Map<string, number>();
  (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []).forEach((w) => {
    if (STOPWORDS.has(w)) return;
    counts.set(w, (counts.get(w) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([w]) => w);
};

export const formatMoney = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  let body: string;
  if (v >= 1_000_000) body = `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  else if (v >= 1_000) body = `$${Math.round(v / 1_000)}K`;
  else body = `$${Math.round(v)}`;
  return `${sign}${body}`;
};

interface YearFigures {
  year: number;
  revenue: number;
  grossProfit: number;
  opex: number;
  net: number;
}

interface FinancialModel {
  budget: number;
  budgetAssumed: boolean;
  years: YearFigures[];
  breakEvenMonth: number | null;
  /** Month the starting budget runs out, or null if it lasts the full 36 months. */
  cashOutMonth: number | null;
  /** Largest cumulative shortfall before break-even (how much money the plan really needs). */
  peakFundingNeed: number;
  monthlyBurnY1: number;
}

/**
 * A deliberately simple 36-month model. Revenue starts at an industry-typical multiple
 * of the budget, ramps up over the first six months after launch and then grows at the
 * industry's yearly rate; fixed operating costs step up 15% a year. Cash is simulated
 * month by month to find break-even, runway and the real funding need.
 */
const buildFinancialModel = (budget: number, budgetAssumed: boolean, profile: IndustryProfile, signals: Set<string>): FinancialModel => {
  let margin = profile.grossMargin;
  if (signals.has('premium')) margin = Math.min(0.9, margin + 0.07);
  if (signals.has('affordable')) margin = Math.max(0.2, margin - 0.07);

  const growth = profile.growth * (signals.has('subscription') ? 1.1 : 1);
  const baseMonthlyRevenue = (budget * profile.revenueRatio) / 12;
  const opexByYear = [0, 1, 2].map((y) => budget * 0.75 * Math.pow(1.15, y));
  const years: YearFigures[] = [0, 1, 2].map((y) => ({ year: y + 1, revenue: 0, grossProfit: 0, opex: opexByYear[y], net: 0 }));

  let breakEvenMonth: number | null = null;
  let cashOutMonth: number | null = null;
  let cash = budget;
  let cumulative = 0;
  let worstCumulative = 0;
  for (let m = 0; m < 36; m += 1) {
    const y = Math.floor(m / 12);
    const ramp = Math.min(1, (m + 1) / 6);
    const revenue = baseMonthlyRevenue * Math.pow(growth, m / 12) * ramp;
    const gross = revenue * margin;
    const monthlyNet = gross - opexByYear[y] / 12;
    years[y].revenue += revenue;
    years[y].grossProfit += gross;
    if (breakEvenMonth === null && monthlyNet >= 0) breakEvenMonth = m + 1;
    cash += monthlyNet;
    cumulative += monthlyNet;
    worstCumulative = Math.min(worstCumulative, cumulative);
    if (cashOutMonth === null && cash < 0) cashOutMonth = m + 1;
  }
  years.forEach((yr) => {
    yr.net = yr.grossProfit - yr.opex;
  });

  return {
    budget,
    budgetAssumed,
    years,
    breakEvenMonth,
    cashOutMonth,
    peakFundingNeed: -worstCumulative,
    monthlyBurnY1: Math.max(0, (opexByYear[0] - years[0].grossProfit) / 12),
  };
};

const bullet = (items: string[]) => items.map((i) => `• ${i}`).join('\n');

const fundingSources = (budget: number, industry: Industry): string[] => {
  if (budget <= 50_000) {
    return ['Personal savings (bootstrapping)', 'Friends & family', 'Pre-sales, deposits or crowdfunding', 'Local small-business grants and competitions'];
  }
  if (budget <= 250_000) {
    return ['Founder investment', 'Angel investors', 'Small-business bank loan or government-backed loan', 'Accelerator programmes'];
  }
  if (budget <= 1_000_000) {
    const vc = industry === 'Technology' || industry === 'Finance' || industry === 'Healthcare' ? 'Seed-stage venture capital' : 'Angel syndicates';
    return [vc, 'Government-backed loans or equipment financing', 'Revenue-based financing once sales are recurring', 'Strategic partners in your industry'];
  }
  return ['Seed / Series A venture capital', 'Strategic corporate investors', 'Venture debt or asset-backed lending', 'Industry grants and incentive programmes'];
};

export const generateBusinessPlan = (input: BusinessPlanInput): BusinessPlan => {
  const name = clean(input.businessName);
  const industry = (INDUSTRIES as readonly string[]).includes(input.industry) ? (input.industry as Industry) : 'Technology';
  const profile = PROFILES[industry];
  const idea = clean(input.businessIdea);
  const ideaSummary = ensurePeriod(firstSentence(idea));
  const market = clean(input.targetMarket) || profile.defaultMarket;
  const marketProvided = Boolean(clean(input.targetMarket));

  const budgetOpt = BUDGET_OPTIONS.find((b) => b.value === input.budgetRange);
  const budget = budgetOpt ? budgetOpt.amount : 100_000;
  const budgetLabel = budgetOpt ? budgetOpt.label : 'not specified';
  const timeframeOpt = TIMEFRAME_OPTIONS.find((t) => t.value === input.timeframe);

  const matched = SIGNALS.filter((s) => s.re.test(idea));
  const signalKeys = new Set(matched.map((s) => s.key));
  const keywords = extractKeywords(idea);
  const model = buildFinancialModel(budget, !budgetOpt, profile, signalKeys);

  const revenueStreams = matched.map((s) => s.revenue).filter((r): r is string => Boolean(r));
  if (revenueStreams.length === 0) revenueStreams.push('Direct sales of your core product or service');
  const advantages = matched.map((s) => s.advantage).filter((a): a is string => Boolean(a));
  advantages.push(`A focused offer built specifically for ${market}`);
  const channels = [...profile.channels, ...matched.map((s) => s.channel).filter((c): c is string => Boolean(c))];
  const signalRisks = matched.map((s) => s.risk).filter((r): r is string => Boolean(r));

  const [y1, y2, y3] = model.years;
  const breakEvenText = model.breakEvenMonth ? `month ${model.breakEvenMonth}` : 'beyond month 36';
  let targetCheck = '';
  if (timeframeOpt) {
    if (!model.breakEvenMonth) targetCheck = `Your ${timeframeOpt.label} target is not reached within 36 months in this model - revisit pricing, costs or funding.`;
    else if (model.breakEvenMonth <= timeframeOpt.months) targetCheck = `This is within your ${timeframeOpt.label} target.`;
    else targetCheck = `That is later than your ${timeframeOpt.label} target, so the target is ambitious - plan for extra runway or faster sales.`;
  }

  const assumptions = [
    model.budgetAssumed ? 'No budget selected - a $100K starting budget was assumed.' : `Starting budget of about ${formatMoney(budget)} (midpoint of ${budgetLabel}).`,
    `Gross margin around ${Math.round((y1.grossProfit / Math.max(1, y1.revenue)) * 100)}%, typical for ${industry.toLowerCase()}.`,
    `Revenue starts near ${profile.revenueRatio}x the budget per year, ramps up over 6 months, then grows about ${profile.growth.toFixed(1)}x per year; fixed costs rise 15% a year.`,
    marketProvided ? `Target market: ${market}.` : `No target market given - "${market}" was used as a typical ${industry.toLowerCase()} audience.`,
  ];

  const keywordLine = keywords.length ? `Key terms from your idea: ${keywords.join(', ')}.` : '';
  const signalLine = matched.length ? `Detected in your description: ${matched.map((s) => s.label).join(', ')}.` : '';

  const executiveSummary = [
    `${name} is a new ${industry.toLowerCase()} business serving ${market}.`,
    '',
    `The concept: ${ideaSummary}`,
    '',
    'Value proposition:',
    bullet(advantages.slice(0, 4)),
    '',
    'Revenue model:',
    bullet(revenueStreams),
    '',
    'Financial snapshot (model estimates, not guarantees):',
    bullet([
      `Starting budget: ${formatMoney(budget)}${model.budgetAssumed ? ' (assumed)' : ''}`,
      `Year 1 revenue: ${formatMoney(y1.revenue)} · Year 3 revenue: ${formatMoney(y3.revenue)}`,
      `Projected monthly break-even: ${breakEvenText}`,
      timeframeOpt ? `Target break-even timeframe: ${timeframeOpt.label}` : 'Target break-even timeframe: not specified',
    ]),
    targetCheck ? `\n${targetCheck}` : '',
  ].filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');

  const marketAnalysis = [
    `Target market: ${market}`,
    '',
    `Industry trends in ${industry.toLowerCase()} that support ${name}:`,
    bullet(profile.trends),
    '',
    'Market sizing worksheet (fill in with your own research):',
    bullet([
      `TAM - total number of ${market} × average yearly spend on this kind of solution`,
      'SAM - the part of that market you can realistically reach (region, language, channel)',
      'SOM - the share you can win in 3 years; 1-5% of SAM is a common, defensible starting point',
    ]),
    '',
    'Customer research to do next:',
    bullet([
      `Interview 10-15 people from "${market}" about how they solve this problem today`,
      'Validate willingness to pay with a pre-order, waitlist or pilot price',
      keywords.length ? `Test messaging built around: ${keywords.slice(0, 3).join(', ')}` : 'Test two or three different value-proposition headlines',
    ]),
    signalLine ? `\n${signalLine}` : '',
  ].join('\n');

  const competitorAnalysis = [
    `Competitive landscape for ${name} (typical competitor types in ${industry.toLowerCase()}):`,
    '',
    profile.competitors.map((c, i) => `${i + 1}. ${c.type}\n   Strengths: ${c.strengths}\n   Weaknesses: ${c.weaknesses}`).join('\n\n'),
    '',
    `Where ${name} can win:`,
    bullet(advantages),
    '',
    'Next step: list 3-5 named competitors, their prices, and what their reviews complain about - those complaints are your positioning opportunities.',
  ].join('\n');

  const marketingBudget = budget * ((profile.funds.find(([k]) => /marketing|business development|sales/i.test(k))?.[1] ?? 20) / 100);
  const marketingStrategy = [
    `Positioning: ${name} - ${ideaSummary}`,
    '',
    `Priority channels for reaching ${market}:`,
    bullet(Array.from(new Set(channels)).slice(0, 6)),
    '',
    'Pricing approach:',
    bullet([
      ...revenueStreams,
      signalKeys.has('premium') ? 'Anchor on quality; avoid discounting that erodes the premium position' : 'Offer an introductory price or pilot to reduce first-purchase risk',
    ]),
    '',
    `Launch marketing budget: about ${formatMoney(marketingBudget)}`,
    bullet([
      `First 90 days: validate one channel with ~40% (${formatMoney(marketingBudget * 0.4)})`,
      `Months 4-6: double down on the best-performing channel with ~40% (${formatMoney(marketingBudget * 0.4)})`,
      `Keep ~20% (${formatMoney(marketingBudget * 0.2)}) for experiments and referral rewards`,
    ]),
    '',
    'Metrics to track:',
    bullet(profile.kpis),
  ].join('\n');

  const yearLine = (y: YearFigures) =>
    `Year ${y.year}:\n• Revenue: ${formatMoney(y.revenue)}\n• Gross profit: ${formatMoney(y.grossProfit)}\n• Operating expenses: ${formatMoney(y.opex)}\n• Net ${y.net >= 0 ? 'profit' : 'loss'}: ${formatMoney(y.net)}`;

  const financialProjections = [
    `3-year projection for ${name} (${industry}), based on a ${formatMoney(budget)} starting budget:`,
    '',
    [y1, y2, y3].map(yearLine).join('\n\n'),
    '',
    'Break-even & runway:',
    bullet([
      `Monthly break-even: ${breakEvenText}`,
      model.monthlyBurnY1 > 0 ? `Average monthly burn in year 1: ${formatMoney(model.monthlyBurnY1)}` : 'Year 1 is cash-flow positive in this model',
      `Peak cumulative shortfall before break-even: ${formatMoney(model.peakFundingNeed)}`,
      model.cashOutMonth ? `The starting budget runs out around month ${model.cashOutMonth}` : 'The starting budget covers the full 36-month projection',
    ]),
    targetCheck ? `\n${targetCheck}` : '',
    '',
    'These figures come from a simple model using typical industry margins and growth. Replace them with your own pricing, costs and sales forecasts before sharing with investors.',
  ].join('\n');

  const horizon = timeframeOpt ? timeframeOpt.months : 12;
  const milestones = [
    'Months 1-3: validate demand, finalise the offer, set up legal entity and tools',
    'Months 4-6: launch to first customers, collect feedback, refine pricing',
    horizon > 6 ? 'Months 7-12: scale the best acquisition channel and make first key hires' : 'Month 6: review break-even progress against target',
    horizon > 12 ? 'Year 2: systemise operations, expand offer or territory' : '',
    horizon > 24 ? 'Year 3: build the management layer and explore new segments' : '',
  ].filter(Boolean);

  const operationalPlan = [
    `How ${name} will operate:`,
    '',
    'Key roles:',
    bullet(['Founder / CEO: strategy, fundraising and key partnerships', ...profile.roles]),
    '',
    'Core processes:',
    bullet([
      `Acquiring and onboarding ${market}`,
      signalKeys.has('ecommerce') || industry === 'E-commerce' ? 'Order fulfilment, returns and inventory management' : 'Delivering the product or service consistently',
      'Customer support and feedback loop',
      'Monthly financial review against this plan',
    ]),
    '',
    'Milestones:',
    bullet(milestones),
    '',
    'KPIs:',
    bullet(profile.kpis),
  ].join('\n');

  const runwayRisk = model.cashOutMonth
    ? `The model runs out of cash around month ${model.cashOutMonth} - secure about ${formatMoney(model.peakFundingNeed - budget)} more or cut fixed costs early`
    : `Peak shortfall of ${formatMoney(model.peakFundingNeed)} stays within the ${formatMoney(budget)} budget - keep monitoring burn monthly`;

  const riskAssessment = [
    `Main risks for ${name} and how to reduce them:`,
    '',
    'Industry risks:',
    bullet(profile.risks),
    '',
    signalRisks.length ? `Risks from your business model:\n${bullet(signalRisks)}\n` : '',
    'Financial risk:',
    bullet([runwayRisk]),
    '',
    'Regulatory checklist:',
    bullet([profile.regulation]),
    '',
    'Mitigation plan:',
    bullet([
      'Validate demand with paying customers before large fixed commitments',
      'Keep 3-6 months of operating costs as a cash reserve',
      'Avoid relying on a single customer, supplier or channel',
      'Get professional legal and accounting advice for your jurisdiction',
    ]),
  ].join('\n');

  const fundingRequirements = [
    `Funding needed: about ${formatMoney(budget)}${model.budgetAssumed ? ' (assumed - select a budget range to tailor this)' : ` (${budgetLabel})`}`,
    '',
    'Use of funds:',
    bullet(profile.funds.map(([k, pct]) => `${k}: ${pct}% (${formatMoney((budget * pct) / 100)})`)),
    '',
    'Suitable funding sources at this size:',
    bullet(fundingSources(budget, industry)),
    '',
    'What investors or lenders will ask for:',
    bullet([
      'Evidence of demand (waitlist, pilots, letters of intent or early revenue)',
      `Clear unit economics for ${market}`,
      'A realistic path to break-even and the milestones this money unlocks',
    ]),
  ].join('\n');

  const sections: PlanSection[] = [
    { id: 'executive-summary', title: 'Executive Summary', icon: '📋', content: executiveSummary },
    { id: 'market-analysis', title: 'Market Analysis', icon: '📊', content: marketAnalysis },
    { id: 'competitor-analysis', title: 'Competitor Analysis', icon: '🏆', content: competitorAnalysis },
    { id: 'marketing-strategy', title: 'Marketing Strategy', icon: '📈', content: marketingStrategy },
    { id: 'financial-projections', title: 'Financial Projections', icon: '💰', content: financialProjections },
    { id: 'operational-plan', title: 'Operational Plan', icon: '⚙️', content: operationalPlan },
    { id: 'risk-assessment', title: 'Risk Assessment', icon: '⚠️', content: riskAssessment },
    { id: 'funding-requirements', title: 'Funding Requirements', icon: '💵', content: fundingRequirements },
  ].map((s) => ({ ...s, id: s.id as SectionId, content: s.content.replace(/\n{3,}/g, '\n\n').trim() }));

  if (keywordLine) sections[1].content += `\n\n${keywordLine}`;

  return { businessName: name, generatedAt: new Date().toLocaleString(), sections, assumptions };
};

export const businessPlanToText = (plan: BusinessPlan): string =>
  [
    `${plan.businessName} - Business Plan`,
    `Generated ${plan.generatedAt} with the Aivello Business Plan Generator`,
    '',
    'ASSUMPTIONS',
    bullet(plan.assumptions),
    '',
    ...plan.sections.flatMap((s) => [s.title.toUpperCase(), s.content, '']),
  ].join('\n');

/** Filesystem-safe slug for download names. */
export const toFileSlug = (value: string, fallback: string): string => {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return slug || fallback;
};

/** Triggers a browser download for a text file. */
export const downloadTextFile = (content: string, filename: string, mime = 'text/plain;charset=utf-8'): void => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so every browser has started the download first.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
