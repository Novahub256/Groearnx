import {
  AuditLog,
  DepositRequest,
  InvestmentPlan,
  LoginActivity,
  PaymentMethod,
  PlatformAnnouncement,
  PlatformSettings,
  ReferralRecord,
  SimulatedInvestment,
  TransactionRecord,
  UserNotification,
  UserProfile,
  UserStatus,
  WithdrawalRequest,
} from '../types/platform';

// Access token held strictly in memory (never localStorage/sessionStorage)
let inMemoryAccessToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryAccessToken;
}

function makeIdempotencyKey(): string {
  const random = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(random, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getHeaders(includeIdempotency = false, tokenOverride?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = tokenOverride || inMemoryAccessToken;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (includeIdempotency) {
    headers['Idempotency-Key'] = makeIdempotencyKey();
  }
  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text().catch(() => '');
  let data: Record<string, unknown> | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const message =
      data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  if (!data || (!contentType.includes('application/json') && typeof data !== 'object')) {
    throw new Error('Unexpected response from API server. Please try again.');
  }
  return data as T;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}

// --- Public Endpoints ---
export async function fetchPublicBootstrap() {
  const res = await fetch('/api/public/bootstrap');
  return parseResponse<{
    supabaseConfigured: boolean;
    schemaReady: boolean;
    plans: InvestmentPlan[];
    announcements: PlatformAnnouncement[];
    settings: PlatformSettings;
  }>(res);
}

export async function calculateProjectionOnServer(planId: string, days: number) {
  const res = await fetch('/api/plans/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, days }),
  });
  return parseResponse<{
    isHypothetical: boolean;
    disclaimer: string;
    planId: string;
    planName: string;
    principal: number;
    illustrativeDailyRate: number;
    horizonDays: number;
    dailyIllustrativeAmount: number;
    totalIllustrativeProjection: number;
  }>(res);
}

export async function submitContactMessageApi(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ valid: boolean; id: string }>(res);
}

// --- Auth Endpoints ---
export async function registerUserApi(payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse<{
    user: AuthSessionUser;
    profile: UserProfile | null;
    isAdmin: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    needsEmailConfirmation: boolean;
  }>(res);
}

export async function loginUserApi(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<{
    user: AuthSessionUser;
    profile: UserProfile;
    isAdmin: boolean;
    accessToken: string;
    refreshToken: string;
  }>(res);
}

export async function fetchAuthSessionApi(tokenOverride?: string) {
  const res = await fetch('/api/auth/session', {
    method: 'GET',
    headers: getHeaders(false, tokenOverride),
  });
  return parseResponse<{
    user: AuthSessionUser;
    profile: UserProfile;
    isAdmin: boolean;
  }>(res);
}

export async function logoutUserApi() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: getHeaders(false),
  }).catch(() => {});
}

export async function requestPasswordResetApi(email: string) {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function completePasswordResetApi(payload: {
  accessToken?: string;
  tokenHash?: string;
  newPassword: string;
}) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function resendVerificationApi(email: string) {
  const res = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function changePasswordApi(currentPassword: string, newPassword: string) {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function verifyPasswordApi(password: string) {
  const res = await fetch('/api/auth/verify-password', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ password }),
  });
  return parseResponse<{ verified: boolean }>(res);
}

// --- User Dashboard & Simulations ---
export async function fetchDashboardDataApi() {
  const res = await fetch('/api/dashboard/data', {
    method: 'GET',
    headers: getHeaders(false),
  });
  return parseResponse<{
    profile: UserProfile;
    investments: SimulatedInvestment[];
    deposits: DepositRequest[];
    withdrawals: WithdrawalRequest[];
    transactions: TransactionRecord[];
    referrals: ReferralRecord[];
    notifications: UserNotification[];
    loginActivity: LoginActivity[];
  }>(res);
}

export async function updateProfilePreferencesApi(updates: {
  fullName: string;
  phone: string;
  twoFactorEnabled: boolean;
  notifyDeposits: boolean;
  notifyWithdrawals: boolean;
  notifyAnnouncements: boolean;
}) {
  const res = await fetch('/api/profile/preferences', {
    method: 'PATCH',
    headers: getHeaders(false),
    body: JSON.stringify(updates),
  });
  return parseResponse<{ profile: UserProfile }>(res);
}

export async function markNotificationReadApi(notificationId: string) {
  const res = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
    headers: getHeaders(false),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function submitDemoDepositApi(method: PaymentMethod, amount: number) {
  const res = await fetch('/api/sim/deposit', {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ method, amount }),
  });
  return parseResponse<{
    isDemo: boolean;
    referenceCode: string;
    method: string;
    amount: number;
    currency: string;
    instructionsNote: string;
    deposit: DepositRequest;
  }>(res);
}

export async function cancelPendingDepositApi(depositId: string) {
  const res = await fetch(`/api/sim/deposit/${encodeURIComponent(depositId)}/cancel`, {
    method: 'POST',
    headers: getHeaders(false),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function submitDemoWithdrawalApi(
  method: PaymentMethod,
  amount: number,
  destinationDetails: string
) {
  const res = await fetch('/api/sim/withdrawal', {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ method, amount, destinationDetails }),
  });
  return parseResponse<{
    isDemo: boolean;
    referenceCode: string;
    method: string;
    amount: number;
    destinationDetails: string;
    withdrawal: WithdrawalRequest;
  }>(res);
}

export async function cancelPendingWithdrawalApi(withdrawalId: string) {
  const res = await fetch(`/api/sim/withdrawal/${encodeURIComponent(withdrawalId)}/cancel`, {
    method: 'POST',
    headers: getHeaders(false),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function createSimulatedInvestmentApi(planId: string) {
  const res = await fetch('/api/sim/invest', {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ planId }),
  });
  return parseResponse<{
    isDemo: boolean;
    referenceCode: string;
    planId: string;
    planName: string;
    amount: number;
    illustrativeDailyRate: number;
    durationDays: number;
    investment: SimulatedInvestment;
    profile: UserProfile;
  }>(res);
}

// --- Admin API ---
export async function fetchAdminPolicyStatus() {
  const res = await fetch('/api/admin/policy-status', {
    method: 'GET',
    headers: getHeaders(false),
  });
  return parseResponse<{
    authorizedAdmin: string;
    demoModeOnly: boolean;
    realMoneyOperations: string;
    rateLimitActiveBuckets: number;
    idempotencyActiveKeys: number;
    serverTimestamp: string;
  }>(res);
}

export async function fetchAdminOverviewApi() {
  const res = await fetch('/api/admin/overview', {
    method: 'GET',
    headers: getHeaders(false),
  });
  return parseResponse<{
    users: UserProfile[];
    deposits: DepositRequest[];
    withdrawals: WithdrawalRequest[];
    investments: SimulatedInvestment[];
    auditLogs: AuditLog[];
    plans: InvestmentPlan[];
    announcements: PlatformAnnouncement[];
    settings: PlatformSettings | null;
  }>(res);
}

export async function adminReviewDepositApi(
  depositId: string,
  decision: 'approved' | 'rejected',
  adminNote: string
) {
  const res = await fetch(`/api/admin/deposits/${encodeURIComponent(depositId)}/review`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ decision, adminNote }),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function adminReviewWithdrawalApi(
  withdrawalId: string,
  decision: 'approved' | 'rejected',
  adminNote: string
) {
  const res = await fetch(`/api/admin/withdrawals/${encodeURIComponent(withdrawalId)}/review`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ decision, adminNote }),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function adminSetUserStatusApi(targetUid: string, status: UserStatus) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUid)}/status`, {
    method: 'PATCH',
    headers: getHeaders(false),
    body: JSON.stringify({ status }),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function adminTogglePlanVisibilityApi(planId: string, isVisible: boolean) {
  const res = await fetch(`/api/admin/plans/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    headers: getHeaders(false),
    body: JSON.stringify({ isVisible }),
  });
  return parseResponse<{ plan: InvestmentPlan }>(res);
}

export async function adminCreateAnnouncementApi(payload: {
  title: string;
  body: string;
  severity: 'info' | 'notice' | 'warning';
}) {
  const res = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(payload),
  });
  return parseResponse<{ announcement: PlatformAnnouncement }>(res);
}

export async function adminToggleAnnouncementApi(id: string, isActive: boolean) {
  const res = await fetch(`/api/admin/announcements/${encodeURIComponent(id)}/toggle`, {
    method: 'PATCH',
    headers: getHeaders(false),
    body: JSON.stringify({ isActive }),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function adminSendNotificationApi(payload: {
  targetUid: string;
  title: string;
  message: string;
}) {
  const res = await fetch('/api/admin/notifications', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(payload),
  });
  return parseResponse<{ ok: boolean }>(res);
}

export async function adminUpdateSettingsApi(settings: PlatformSettings) {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: getHeaders(false),
    body: JSON.stringify(settings),
  });
  return parseResponse<{ settings: PlatformSettings }>(res);
}
