import { InvestmentPlan, PaymentMethod } from '../types/platform';

export const ILLUSTRATIVE_RATES_NOTICE =
  'Important Notice: All displayed daily rates are unverified, illustrative concept figures and are NOT guaranteed or sustainable returns. Real-money deposits, custody, and payouts are disabled in this DEMO environment pending independent verification, compliance controls, and legal approval.';

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
    description: 'Advanced simulated tier for testing larger demo portfolio allocations.',
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
    description: 'Maximum concept tier displaying upper-bound illustrative simulation figures.',
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
    currency: 'BTC (DEMO)',
    accentColor: '#F7931A',
    destinationLabel: 'Simulated BTC Destination Label / Test Reference',
    destinationPlaceholder: 'e.g. Demo BTC Vault Label (do not send real funds)',
    demoInstruction:
      'DEMO ONLY: No blockchain wallet address is generated. Real cryptocurrency transfers are disabled. Submit this simulated request to generate a test reference for administrator review.',
  },
  {
    id: 'USDT',
    label: 'USDT',
    shortCode: 'USDT',
    currency: 'USDT (DEMO)',
    accentColor: '#26A17B',
    destinationLabel: 'Simulated USDT Network / Label',
    destinationPlaceholder: 'e.g. Demo TRC20/ERC20 Label (simulation only)',
    demoInstruction:
      'DEMO ONLY: No live stablecoin deposit address is issued. Verified custody provider integration is pending legal authorization.',
  },
  {
    id: 'PayPal',
    label: 'PayPal',
    shortCode: 'PP',
    currency: 'USD (DEMO)',
    accentColor: '#0070BA',
    destinationLabel: 'Simulated PayPal Account Email',
    destinationPlaceholder: 'e.g. demo-account@example.com',
    demoInstruction:
      'DEMO ONLY: No external PayPal checkout link is generated and no funds are charged. Submitting records a simulated deposit request awaiting administrator approval.',
  },
  {
    id: 'Mobile Money',
    label: 'Mobile Money',
    shortCode: 'MOMO',
    currency: 'MoMo (DEMO)',
    accentColor: '#F59E0B',
    destinationLabel: 'Simulated Mobile Money Number / Provider',
    destinationPlaceholder: 'e.g. Demo Mobile Wallet +1 555-0100',
    demoInstruction:
      'DEMO ONLY: Mobile Money carrier settlement is inactive in simulation mode. Record your simulated amount to test request tracking.',
  },
  {
    id: 'Ethereum (ETH)',
    label: 'Ethereum (ETH)',
    shortCode: 'ETH',
    currency: 'ETH (DEMO)',
    accentColor: '#627EEA',
    destinationLabel: 'Simulated ETH Destination Label',
    destinationPlaceholder: 'e.g. Demo ETH Test Label (no real ETH)',
    demoInstruction:
      'DEMO ONLY: No smart contract or Ethereum deposit address is active. Real ETH deposits remain disabled pending custody and compliance sign-off.',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'Are the investment plans and daily rates on GROEarnX live real-money returns?',
    answer:
      'No. All plans, daily rates (5%–15%), balances, deposits, and withdrawals currently operate strictly in DEMO simulation mode. The daily percentages are unverified proposed figures provided for platform modeling and are not guaranteed, verified, or sustainable real-world returns.',
  },
  {
    question: 'Does GROEarnX accept real cryptocurrency, PayPal, or Mobile Money payments right now?',
    answer:
      'No. Real-money payment processing, cryptocurrency custody, and external transfers are intentionally disabled. Deposit and withdrawal interfaces simulate the request, reference tracking, and approval lifecycle until legal authorizations and verified payment providers are connected.',
  },
  {
    question: 'How does the simulated balance and investment workflow work?',
    answer:
      'After registering and verifying your email, you can submit a DEMO deposit request in the dashboard. Once reviewed and approved by an administrator in the Admin Console, your DEMO balance updates and you can allocate simulated funds into any of the nine illustrative tiers or test balance-validated DEMO withdrawals.',
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
