export type PaymentMethod =
  | 'Bitcoin (BTC)'
  | 'USDT'
  | 'PayPal'
  | 'Mobile Money'
  | 'Ethereum (ETH)';

export type UserStatus = 'active' | 'suspended';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type InvestmentStatus = 'active' | 'completed' | 'cancelled';
export type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'adjustment';
export type TransactionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'active'
  | 'completed';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy: string;
  status: UserStatus;
  twoFactorEnabled: boolean;
  notifyDeposits: boolean;
  notifyWithdrawals: boolean;
  notifyAnnouncements: boolean;
  simulatedBalance: number;
  simulatedInvested: number;
  simulatedEarnings: number;
  termsAccepted: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface InvestmentPlan {
  id: string;
  tierNumber: number;
  name: string;
  amount: number;
  illustrativeDailyRate: number;
  durationDays: number;
  isVisible: boolean;
  description: string;
  updatedAt?: unknown;
}

export interface SimulatedInvestment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  illustrativeDailyRate: number;
  durationDays: number;
  status: InvestmentStatus;
  isDemo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DepositRequest {
  id: string;
  userId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  referenceCode: string;
  instructionsNote: string;
  status: RequestStatus;
  adminNote: string;
  isDemo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  method: PaymentMethod;
  amount: number;
  destinationDetails: string;
  referenceCode: string;
  status: RequestStatus;
  adminNote: string;
  isDemo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: TransactionType;
  method: string;
  amount: number;
  referenceCode: string;
  status: TransactionStatus;
  description: string;
  isDemo: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ReferralRecord {
  id: string;
  referrerUid: string;
  referredUid: string;
  referredDisplayName: string;
  referralCode: string;
  status: 'registered' | 'verified';
  createdAt?: unknown;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'system' | 'deposit' | 'withdrawal' | 'investment' | 'security' | 'announcement';
  read: boolean;
  createdAt?: unknown;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'notice' | 'warning';
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PlatformSettings {
  id: string;
  demoModeOnly: boolean;
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  investmentsEnabled: boolean;
  illustrativeNotice: string;
  updatedAt?: unknown;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt?: unknown;
}

export interface LoginActivity {
  id: string;
  userId: string;
  deviceLabel: string;
  eventType: 'login' | 'logout' | 'password_reset' | 'profile_update';
  createdAt?: unknown;
}
