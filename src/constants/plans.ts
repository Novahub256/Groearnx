import { InvestmentPlan, PaymentMethod } from '../types/platform';

export const ILLUSTRATIVE_RATES_NOTICE =
  'All displayed daily rates are hypothetical projections for illustrative modeling only and are not guaranteed or verified returns. Real-money deposits, custody, and payouts remain disabled pending independent verification, compliance controls, and legal approval.';

export const CANONICAL_PLANS: InvestmentPlan[] = [
  {
    id: 'plan_1',
    tierNumber: 1,
    name: 'Plan 1',
    amount: 100,
    illustrativeDailyRate: 5,
    durationDays: 30,
    isVisible: true,
    description: 'Entry-level simulated tier for exploring basic portfolio allocation workflows.',
  },
  {
    id: 'plan_2',
    tierNumber: 2,
    name: 'Plan 2',
    amount: 200,
    illustrativeDailyRate: 5,
    durationDays: 30,
    isVisible: true,
    description: 'Introductory simulated tier with multi-day hypothetical projection modeling.',
  },
  {
    id: 'plan_3',
    tierNumber: 3,
    name: 'Plan 3',
    amount: 300,
    illustrativeDailyRate: 7,
    durationDays: 30,
    isVisible: true,
    description: 'Starter allocation tier illustrating medium-step rate scenarios.',
  },
  {
    id: 'plan_4',
    tierNumber: 4,
    name: 'Plan 4',
    amount: 500,
    illustrativeDailyRate: 7,
    durationDays: 30,
    isVisible: true,
    description: 'Core simulated portfolio tier for tracking allocation lifecycle states.',
  },
  {
    id: 'plan_5',
    tierNumber: 5,
    name: 'Plan 5',
    amount: 1000,
    illustrativeDailyRate: 7,
    durationDays: 30,
    isVisible: true,
    description: 'Balanced simulated tier designed for structured multi-position testing.',
  },
  {
    id: 'plan_6',
    tierNumber: 6,
    name: 'Plan 6',
    amount: 2000,
    illustrativeDailyRate: 10,
    durationDays: 30,
    isVisible: true,
    description: 'Expanded simulated tier illustrating elevated hypothetical rate scenarios.',
  },
  {
    id: 'plan_7',
    tierNumber: 7,
    name: 'Plan 7',
    amount: 3000,
    illustrativeDailyRate: 10,
    durationDays: 30,
    isVisible: true,
    description: 'Advanced simulated tier for modeling larger portfolio allocations.',
  },
  {
    id: 'plan_8',
    tierNumber: 8,
    name: 'Plan 8',
    amount: 5000,
    illustrativeDailyRate: 12,
    durationDays: 30,
    isVisible: true,
    description: 'High-tier simulated model for reviewing ledger and approval workflows.',
  },
  {
    id: 'plan_9',
    tierNumber: 9,
    name: 'Plan 9',
    amount: 10000,
    illustrativeDailyRate: 15,
    durationDays: 30,
    isVisible: true,
    description: 'Maximum tier displaying upper-bound hypothetical projection figures.',
  },
];

export interface PaymentMethodMeta {
  id: PaymentMethod;
  label: string;
  shortCode: string;
  currency: string;
  accentColor: string;
  destinationLabel: string;
  destinationPlaceholder: string;
  demoInstruction: string;
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  {
    id: 'Bitcoin (BTC)',
    label: 'Bitcoin (BTC)',
    shortCode: 'BTC',
    currency: 'BTC',
    accentColor: '#F7931A',
    destinationLabel: 'BTC Reference Label',
    destinationPlaceholder: 'e.g. Personal BTC reference (no live transfer)',
    demoInstruction:
      'No live blockchain wallet address is generated and real cryptocurrency transfers are disabled. Submitting records a payment request for administrative review.',
  },
  {
    id: 'USDT',
    label: 'USDT',
    shortCode: 'USDT',
    currency: 'USDT',
    accentColor: '#26A17B',
    destinationLabel: 'USDT Network / Reference Label',
    destinationPlaceholder: 'e.g. TRC20/ERC20 reference label',
    demoInstruction:
      'No live stablecoin deposit address is issued. External custody integration remains disabled pending regulatory and provider approvals.',
  },
  {
    id: 'PayPal',
    label: 'PayPal',
    shortCode: 'PP',
    currency: 'USD',
    accentColor: '#0070BA',
    destinationLabel: 'PayPal Reference Email',
    destinationPlaceholder: 'e.g. member@example.com',
    demoInstruction:
      'No external PayPal checkout link is generated and no funds are charged. Submitting records a payment request for administrative review.',
  },
  {
    id: 'Mobile Money',
    label: 'Mobile Money',
    shortCode: 'MOMO',
    currency: 'MoMo',
    accentColor: '#F59E0B',
    destinationLabel: 'Mobile Money Number / Provider Label',
    destinationPlaceholder: 'e.g. +1 555-0100 (reference only)',
    demoInstruction:
      'Mobile Money carrier settlement is inactive. Submitting records a payment request in your ledger for request-tracking review.',
  },
  {
    id: 'Ethereum (ETH)',
    label: 'Ethereum (ETH)',
    shortCode: 'ETH',
    currency: 'ETH',
    accentColor: '#627EEA',
    destinationLabel: 'ETH Reference Label',
    destinationPlaceholder: 'e.g. Personal ETH reference (no live transfer)',
    demoInstruction:
      'No smart contract or Ethereum deposit address is active. Real ETH transfers remain disabled pending custody and compliance sign-off.',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Are the investment plans and daily rates on GROEarnX live real-money returns?',
    answer:
      'No. All plans, daily rates (5%–15%), illustrative balances, payment requests, and withdrawal requests currently operate strictly in a simulation environment. The daily percentages are hypothetical projections provided for platform modeling and are not guaranteed, verified, or sustainable real-world returns.',
  },
  {
    question: 'Does GROEarnX accept real cryptocurrency, PayPal, or Mobile Money payments right now?',
    answer:
      'No. Real-money payment processing, cryptocurrency custody, and external transfers are intentionally disabled. Deposit and withdrawal interfaces simulate the payment request, reference tracking, and approval lifecycle until legal authorizations and verified payment providers are connected.',
  },
  {
    question: 'How does the illustrative balance and simulated investment workflow work?',
    answer:
      'After registering and verifying your email, you can submit a payment request in the dashboard. Once reviewed and approved by an administrator, your illustrative balance updates and you can create a simulated investment in any of the nine tiers or test balance-validated withdrawal requests.',
  },
  {
    question: 'How is my account and financial data protected?',
    answer:
      'Authentication is handled securely through Supabase Authentication with email verification enforcement, server-verified session tokens, rate-limited API endpoints with idempotency protection, PostgreSQL Row Level Security isolating user PII, and immutable audit logging.',
  },
  {
    question: 'Do referrals pay out cash bonuses?',
    answer:
      'No. The referral system currently tracks unique referral codes, shareable links, and registration status only. No monetary bonuses or commissions are credited unless a legally compliant reward program is explicitly configured in the future.',
  },
];
