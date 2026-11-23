import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

dotenv.config();

const CANONICAL_PLANS = [
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

const DEFAULT_ILLUSTRATIVE_NOTICE =
  'Important Notice: All displayed daily rates are unverified, illustrative concept figures and are NOT guaranteed or sustainable returns. Real-money deposits, custody, and payouts are disabled in this DEMO environment pending independent verification, compliance controls, and legal approval.';

const ALLOWED_METHODS = new Set([
  'Bitcoin (BTC)',
  'USDT',
  'PayPal',
  'Mobile Money',
  'Ethereum (ETH)',
]);

const PRIMARY_ADMIN_EMAIL = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'pinkappug@gmail.com')
  .trim()
  .toLowerCase();

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, anonKey, serviceRoleKey };
}

function isSupabaseConfigured(): boolean {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && (anonKey || serviceRoleKey));
}

function getSupabaseAnon(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getSupabaseAdmin(): SupabaseClient | null {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatSupabaseDbError(message: string | undefined): string {
  const raw = message || 'Database operation failed.';
  if (
    raw.includes('schema cache') ||
    raw.includes('PGRST205') ||
    raw.includes('42P01') ||
    raw.includes('does not exist')
  ) {
    return "Supabase tables are not initialized yet ('public.profiles' not found in schema cache). Open Supabase Dashboard -> SQL Editor, run /supabase/migrations/001_initial_schema.sql, and retry.";
  }
  return raw;
}

async function isSupabaseSchemaReady(db: SupabaseClient | null): Promise<boolean> {
  if (!db) return false;
  const { error } = await db.from('profiles').select('id').limit(1);
  if (!error) return true;
  if (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    error.message.includes('schema cache') ||
    error.message.includes('does not exist')
  ) {
    return false;
  }
  return true;
}

function getSupabaseForUser(accessToken: string): SupabaseClient | null {
  const admin = getSupabaseAdmin();
  if (admin) return admin;
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

interface AuthRequest extends Request {
  user?: User;
  accessToken?: string;
}

// Sliding-window in-memory rate limiter
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait briefly before trying again.',
      });
    }
    bucket.count += 1;
    return next();
  };
}

// Idempotency key cache (15 min TTL)
const idempotencyCache = new Map<string, { status: number; body: unknown; expiresAt: number }>();
function idempotencyGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const key = req.header('Idempotency-Key');
  if (!key) {
    return res.status(400).json({ error: 'Missing Idempotency-Key header.' });
  }
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(key)) {
    return res.status(400).json({ error: 'Invalid Idempotency-Key format.' });
  }
  const scopedKey = `${req.user?.id || req.ip}:${req.path}:${key}`;
  const cached = idempotencyCache.get(scopedKey);
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return res.status(cached.status).json(cached.body);
  }
  const origJson = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode < 500) {
      idempotencyCache.set(scopedKey, {
        status: res.statusCode,
        body,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
    }
    return origJson(body);
  };
  return next();
}

function generateReference(prefix: string): string {
  const bytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `GRX-${prefix}-${bytes}`;
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(7);
  let code = 'GRX';
  for (let i = 0; i < bytes.length; i += 1) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function getDeviceLabel(req: Request): string {
  const ua = String(req.headers['user-agent'] || 'Web Browser');
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/')) browser = 'Safari';

  let os = 'Desktop';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return `${browser} on ${os}`.slice(0, 120);
}

// --- Row Mappers (PostgreSQL snake_case -> Frontend camelCase) ---
function mapProfile(row: Record<string, unknown>) {
  return {
    uid: String(row.id),
    fullName: String(row.full_name || 'GROEarnX Member'),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    referralCode: String(row.referral_code || ''),
    referredBy: String(row.referred_by || ''),
    status: (row.status === 'suspended' ? 'suspended' : 'active') as 'active' | 'suspended',
    twoFactorEnabled: Boolean(row.two_factor_enabled),
    notifyDeposits: row.notify_deposits !== false,
    notifyWithdrawals: row.notify_withdrawals !== false,
    notifyAnnouncements: row.notify_announcements !== false,
    simulatedBalance: Number(row.simulated_balance || 0),
    simulatedInvested: Number(row.simulated_invested || 0),
    simulatedEarnings: Number(row.simulated_earnings || 0),
    termsAccepted: Boolean(row.terms_accepted_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPlan(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tierNumber: Number(row.tier_number),
    name: String(row.name),
    amount: Number(row.amount),
    illustrativeDailyRate: Number(row.illustrative_daily_rate),
    durationDays: Number(row.duration_days || 30),
    isVisible: Boolean(row.is_visible),
    description: String(row.description || ''),
    updatedAt: row.updated_at,
  };
}

function mapInvestment(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planId: String(row.plan_id),
    planName: String(row.plan_name || row.plan_id),
    amount: Number(row.amount),
    illustrativeDailyRate: Number(row.illustrative_daily_rate),
    durationDays: Number(row.duration_days),
    status: String(row.status) as 'active' | 'completed' | 'cancelled',
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDeposit(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    method: String(row.method),
    amount: Number(row.amount),
    currency: String(row.currency),
    referenceCode: String(row.reference_code),
    instructionsNote: String(row.instructions_note),
    status: String(row.status),
    adminNote: String(row.admin_note || ''),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWithdrawal(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    method: String(row.method),
    amount: Number(row.amount),
    destinationDetails: String(row.destination_details),
    referenceCode: String(row.reference_code),
    status: String(row.status),
    adminNote: String(row.admin_note || ''),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: String(row.type),
    method: String(row.method),
    amount: Number(row.amount),
    referenceCode: String(row.reference_code),
    status: String(row.status),
    description: String(row.description),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReferral(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    referrerUid: String(row.referrer_id),
    referredUid: String(row.referred_id),
    referredDisplayName: String(row.referred_display_name || 'Member'),
    referralCode: String(row.referral_code),
    status: String(row.status),
    createdAt: row.created_at,
  };
}

function mapNotification(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    message: String(row.message),
    category: String(row.category),
    read: Boolean(row.read),
    createdAt: row.created_at,
  };
}

function mapAnnouncement(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    severity: String(row.severity || 'info'),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: Record<string, unknown>) {
  return {
    id: String(row.id || 'global'),
    demoModeOnly: row.demo_mode_only !== false,
    depositsEnabled: row.deposits_enabled !== false,
    withdrawalsEnabled: row.withdrawals_enabled !== false,
    investmentsEnabled: row.investments_enabled !== false,
    illustrativeNotice: String(row.illustrative_notice || DEFAULT_ILLUSTRATIVE_NOTICE),
    updatedAt: row.updated_at,
  };
}

function mapAuditLog(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    actorUid: String(row.actor_id || ''),
    actorEmail: String(row.actor_email || ''),
    action: String(row.action),
    targetType: String(row.target_type),
    targetId: String(row.target_id),
    details: String(row.details),
    createdAt: row.created_at,
  };
}

function mapLoginActivity(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    deviceLabel: String(row.device_label),
    eventType: String(row.event_type),
    createdAt: row.created_at,
  };
}

async function requireSupabaseReady(_req: Request, res: Response, next: NextFunction) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error:
        'Supabase is not configured yet. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Settings -> Secrets and run supabase/migrations/001_initial_schema.sql.',
    });
  }
  return next();
}

async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error:
        'Supabase is not configured yet. Add SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in Settings -> Secrets.',
    });
  }
  const token = header.slice('Bearer '.length).trim();
  const client = getSupabaseAdmin() || getSupabaseAnon();
  if (!client) {
    return res.status(503).json({ error: 'Supabase client unavailable.' });
  }
  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session.' });
    }
    req.user = data.user;
    req.accessToken = token;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication session.' });
  }
}

function requireVerifiedEmail(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.email_confirmed_at) {
    return res.status(403).json({
      error: 'Email verification is required before performing simulated financial operations.',
    });
  }
  return next();
}

async function checkAdminAccess(db: SupabaseClient, user: User): Promise<boolean> {
  const email = user.email?.toLowerCase() || '';
  const verified = Boolean(user.email_confirmed_at);
  if (verified && email && email === PRIMARY_ADMIN_EMAIL) {
    return true;
  }
  const { data } = await db
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return Boolean(data && verified);
}

async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !req.accessToken) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const db = getSupabaseForUser(req.accessToken);
  if (!db) {
    return res.status(503).json({ error: 'Supabase database unavailable.' });
  }
  const allowed = await checkAdminAccess(db, req.user);
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden: Administrator authorization required.' });
  }
  return next();
}

async function ensureUserProfileInSupabase(
  db: SupabaseClient,
  user: User,
  overrides?: { fullName?: string; phone?: string; referralCode?: string; deviceLabel?: string }
) {
  const { data: existing, error: selectErr } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (selectErr) {
    throw new Error(formatSupabaseDbError(selectErr.message));
  }

  if (existing) {
    return mapProfile(existing as Record<string, unknown>);
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const fullName = sanitizeText(
    overrides?.fullName || meta.full_name || user.email?.split('@')[0] || 'GROEarnX Member',
    100
  );
  const phone = sanitizeText(overrides?.phone || meta.phone || '', 32);
  const cleanReferredBy = String(overrides?.referralCode || meta.referred_by || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24);

  let validReferrerId = '';
  if (cleanReferredBy.length >= 4) {
    const { data: refOwner } = await db
      .from('profiles')
      .select('id')
      .eq('referral_code', cleanReferredBy)
      .maybeSingle();
    if (refOwner && refOwner.id !== user.id) {
      validReferrerId = String(refOwner.id);
    }
  }

  const ownReferralCode = generateReferralCode();
  const { data: inserted, error: insertErr } = await db
    .from('profiles')
    .insert({
      id: user.id,
      full_name: fullName.length >= 2 ? fullName : 'GROEarnX Member',
      email: (user.email || '').toLowerCase(),
      phone,
      referral_code: ownReferralCode,
      referred_by: validReferrerId ? cleanReferredBy : '',
      status: 'active',
      terms_accepted_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertErr) {
    // Handle concurrent profile initialization race gracefully
    const { data: retry } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (retry) return mapProfile(retry as Record<string, unknown>);
    throw new Error(formatSupabaseDbError(insertErr.message));
  }

  if (validReferrerId && cleanReferredBy) {
    await db.from('referrals').insert({
      referrer_id: validReferrerId,
      referred_id: user.id,
      referred_display_name: fullName.slice(0, 80) || 'GROEarnX Member',
      referral_code: cleanReferredBy,
      status: user.email_confirmed_at ? 'verified' : 'registered',
    });
  }

  // Bootstrap admin role if email matches configured admin bootstrap email
  if (user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
    await db.from('user_roles').upsert(
      { user_id: user.id, role: 'admin', granted_by: user.id },
      { onConflict: 'user_id,role' }
    );
  } else {
    await db.from('user_roles').upsert(
      { user_id: user.id, role: 'user' },
      { onConflict: 'user_id,role' }
    );
  }

  await db.from('notifications').insert({
    user_id: user.id,
    title: 'Welcome to GROEarnX Demo Environment',
    message:
      'Your account is active in DEMO mode. Submit a simulated deposit request to explore illustrative investment tiers.',
    category: 'system',
    read: false,
  });

  if (overrides?.deviceLabel) {
    await db.from('login_activity').insert({
      user_id: user.id,
      device_label: overrides.deviceLabel,
      event_type: 'login',
    });
  }

  return mapProfile(inserted as Record<string, unknown>);
}

async function seedDefaultPlansAndSettingsIfEmpty(db: SupabaseClient) {
  const { data: existingPlans } = await db.from('investment_plans').select('id').limit(1);
  if (!existingPlans || existingPlans.length === 0) {
    await db.from('investment_plans').upsert(
      CANONICAL_PLANS.map((p) => ({
        id: p.id,
        tier_number: p.tierNumber,
        name: p.name,
        amount: p.amount,
        illustrative_daily_rate: p.illustrativeDailyRate,
        duration_days: p.durationDays,
        is_visible: p.isVisible,
        description: p.description,
      })),
      { onConflict: 'id' }
    );
  }
  const { data: existingSettings } = await db
    .from('admin_settings')
    .select('id')
    .eq('id', 'global')
    .maybeSingle();
  if (!existingSettings) {
    await db.from('admin_settings').upsert({
      id: 'global',
      demo_mode_only: true,
      deposits_enabled: true,
      withdrawals_enabled: true,
      investments_enabled: true,
      illustrative_notice: DEFAULT_ILLUSTRATIVE_NOTICE,
    });
  }
}

export function createApiApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Health & Configuration Check
  app.get('/api/health', async (_req, res) => {
    const db = getSupabaseAdmin() || getSupabaseAnon();
    const configured = isSupabaseConfigured();
    const schemaReady = configured ? await isSupabaseSchemaReady(db) : false;
    res.json({
      status: 'ok',
      platform: 'GROEarnX',
      database: 'supabase',
      supabaseConfigured: configured,
      schemaReady,
      mode: 'DEMO_SIMULATION_ONLY',
      realMoneyEnabled: false,
      timestamp: new Date().toISOString(),
    });
  });

  // Public bootstrap (plans, active announcements, global settings)
  app.get('/api/public/bootstrap', rateLimit(120, 60_000), async (_req, res) => {
    const db = getSupabaseAdmin() || getSupabaseAnon();
    if (!db) {
      return res.json({
        supabaseConfigured: false,
        schemaReady: false,
        plans: CANONICAL_PLANS,
        announcements: [],
        settings: {
          id: 'global',
          demoModeOnly: true,
          depositsEnabled: true,
          withdrawalsEnabled: true,
          investmentsEnabled: true,
          illustrativeNotice: DEFAULT_ILLUSTRATIVE_NOTICE,
        },
      });
    }

    try {
      const schemaReady = await isSupabaseSchemaReady(db);
      if (!schemaReady) {
        return res.json({
          supabaseConfigured: true,
          schemaReady: false,
          plans: CANONICAL_PLANS,
          announcements: [],
          settings: {
            id: 'global',
            demoModeOnly: true,
            depositsEnabled: true,
            withdrawalsEnabled: true,
            investmentsEnabled: true,
            illustrativeNotice: DEFAULT_ILLUSTRATIVE_NOTICE,
          },
        });
      }

      const [{ data: planRows }, { data: annRows }, { data: settingRow }] = await Promise.all([
        db
          .from('investment_plans')
          .select('*')
          .eq('is_visible', true)
          .order('tier_number', { ascending: true }),
        db
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
        db.from('admin_settings').select('*').eq('id', 'global').maybeSingle(),
      ]);

      return res.json({
        supabaseConfigured: true,
        schemaReady: true,
        plans:
          planRows && planRows.length > 0
            ? planRows.map((r) => mapPlan(r as Record<string, unknown>))
            : CANONICAL_PLANS,
        announcements: (annRows || []).map((r) => mapAnnouncement(r as Record<string, unknown>)),
        settings: settingRow
          ? mapSettings(settingRow as Record<string, unknown>)
          : {
              id: 'global',
              demoModeOnly: true,
              depositsEnabled: true,
              withdrawalsEnabled: true,
              investmentsEnabled: true,
              illustrativeNotice: DEFAULT_ILLUSTRATIVE_NOTICE,
            },
      });
    } catch {
      return res.json({
        supabaseConfigured: true,
        schemaReady: false,
        plans: CANONICAL_PLANS,
        announcements: [],
        settings: {
          id: 'global',
          demoModeOnly: true,
          depositsEnabled: true,
          withdrawalsEnabled: true,
          investmentsEnabled: true,
          illustrativeNotice: DEFAULT_ILLUSTRATIVE_NOTICE,
        },
      });
    }
  });

  app.get('/api/public/migration-sql', rateLimit(30, 60_000), (_req, res) => {
    try {
      const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      return res.json({ sql });
    } catch {
      return res.status(404).json({ error: 'Migration SQL file not found.' });
    }
  });

  // Canonical investment plans
  app.get('/api/plans', rateLimit(120, 60_000), (_req, res) => {
    res.json({
      demoOnly: true,
      notice:
        'Displayed daily rates are illustrative concept figures only and are not guaranteed or verified returns.',
      plans: CANONICAL_PLANS,
    });
  });

  // Server-side hypothetical projection calculator
  app.post('/api/plans/calculate', rateLimit(60, 60_000), (req, res) => {
    const { planId, days } = req.body ?? {};
    const plan = CANONICAL_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: 'Selected investment plan was not found.' });
    }
    const horizonDays = Number(days ?? plan.durationDays);
    if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 365) {
      return res.status(400).json({ error: 'Projection horizon must be between 1 and 365 days.' });
    }
    const dailyIllustrativeAmount = Number(
      ((plan.amount * plan.illustrativeDailyRate) / 100).toFixed(2)
    );
    const totalIllustrativeProjection = Number((dailyIllustrativeAmount * horizonDays).toFixed(2));

    return res.json({
      isHypothetical: true,
      disclaimer:
        'Hypothetical calculation only. Does not represent verified, guaranteed, or actual investment earnings.',
      planId: plan.id,
      planName: plan.name,
      principal: plan.amount,
      illustrativeDailyRate: plan.illustrativeDailyRate,
      horizonDays,
      dailyIllustrativeAmount,
      totalIllustrativeProjection,
    });
  });

  // --- Supabase Authentication Routes ---
  app.post('/api/auth/register', rateLimit(12, 60_000), requireSupabaseReady, async (req, res) => {
    try {
      const anon = getSupabaseAnon();
      if (!anon) {
        return res.status(503).json({
          error: 'SUPABASE_ANON_KEY is required for registration.',
        });
      }

      const fullName = sanitizeText(req.body?.fullName, 100);
      const email = sanitizeText(req.body?.email, 254).toLowerCase();
      const phone = sanitizeText(req.body?.phone, 32);
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const referralCode = sanitizeText(req.body?.referralCode, 24).toUpperCase();

      if (fullName.length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (phone.length < 4) {
        return res.status(400).json({ error: 'Please enter a valid phone number.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      const redirectBase =
        process.env.APP_URL || process.env.AUTH_REDIRECT_URL || `${req.protocol}://${req.get('host')}`;

      const { data, error } = await anon.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectBase.replace(/\/$/, '')}/#/verify-email`,
          data: {
            full_name: fullName,
            phone,
            referred_by: referralCode,
          },
        },
      });

      if (error || !data?.user) {
        return res.status(400).json({
          error: error?.message || 'Registration could not be completed.',
        });
      }

      const db = getSupabaseAdmin() || (data.session?.access_token ? getSupabaseForUser(data.session.access_token) : null);
      let profile = null;
      let isAdmin = false;

      if (db) {
        try {
          profile = await ensureUserProfileInSupabase(db, data.user, {
            fullName,
            phone,
            referralCode,
            deviceLabel: getDeviceLabel(req),
          });
          isAdmin = await checkAdminAccess(db, data.user);
        } catch (err) {
          console.warn('Deferred profile sync on signup:', err);
        }
      }

      return res.status(201).json({
        user: {
          id: data.user.id,
          email: data.user.email || email,
          emailVerified: Boolean(data.user.email_confirmed_at),
          displayName: fullName,
        },
        profile,
        isAdmin,
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        needsEmailConfirmation: !data.session,
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Unexpected registration error.',
      });
    }
  });

  app.post('/api/auth/login', rateLimit(20, 60_000), requireSupabaseReady, async (req, res) => {
    try {
      const anon = getSupabaseAnon();
      if (!anon) {
        return res.status(503).json({
          error: 'SUPABASE_ANON_KEY is required for authentication.',
        });
      }

      const email = sanitizeText(req.body?.email, 254).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const { data, error } = await anon.auth.signInWithPassword({ email, password });
      if (error || !data?.user || !data?.session) {
        return res.status(401).json({
          error: error?.message || 'Invalid email address or password.',
        });
      }

      const db = getSupabaseAdmin() || getSupabaseForUser(data.session.access_token);
      if (!db) {
        return res.status(503).json({ error: 'Supabase client unavailable.' });
      }

      const profile = await ensureUserProfileInSupabase(db, data.user, {
        deviceLabel: getDeviceLabel(req),
      });
      const isAdmin = await checkAdminAccess(db, data.user);
      if (isAdmin) {
        void seedDefaultPlansAndSettingsIfEmpty(db);
      }

      await db.from('login_activity').insert({
        user_id: data.user.id,
        device_label: getDeviceLabel(req),
        event_type: 'login',
      });

      return res.json({
        user: {
          id: data.user.id,
          email: data.user.email || email,
          emailVerified: Boolean(data.user.email_confirmed_at),
          displayName: profile.fullName,
        },
        profile,
        isAdmin,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    } catch (err) {
      return res.status(500).json({
        error:
          err instanceof Error
            ? formatSupabaseDbError(err.message)
            : 'Unable to complete login. Verify Supabase schema migration has been run.',
      });
    }
  });

  app.get('/api/auth/session', requireAuth, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) {
      return res.status(503).json({ error: 'Supabase database unavailable.' });
    }
    try {
      const profile = await ensureUserProfileInSupabase(db, req.user);
      const isAdmin = await checkAdminAccess(db, req.user);
      if (isAdmin) {
        void seedDefaultPlansAndSettingsIfEmpty(db);
      }
      return res.json({
        user: {
          id: req.user.id,
          email: req.user.email || '',
          emailVerified: Boolean(req.user.email_confirmed_at),
          displayName: profile.fullName,
        },
        profile,
        isAdmin,
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? formatSupabaseDbError(err.message) : 'Unable to load session profile.',
      });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length).trim();
      const db = getSupabaseForUser(token);
      if (db) {
        const { data } = await db.auth.getUser(token);
        if (data?.user) {
          await db.from('login_activity').insert({
            user_id: data.user.id,
            device_label: getDeviceLabel(req),
            event_type: 'logout',
          });
        }
      }
    }
    return res.json({ ok: true });
  });

  app.post('/api/auth/forgot-password', rateLimit(10, 60_000), requireSupabaseReady, async (req, res) => {
    const anon = getSupabaseAnon();
    if (!anon) {
      return res.status(503).json({ error: 'SUPABASE_ANON_KEY is required.' });
    }
    const email = sanitizeText(req.body?.email, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const redirectBase =
      process.env.APP_URL || process.env.AUTH_REDIRECT_URL || `${req.protocol}://${req.get('host')}`;
    const { error } = await anon.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase.replace(/\/$/, '')}/#/reset-password`,
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.json({ ok: true });
  });

  app.post('/api/auth/reset-password', rateLimit(10, 60_000), requireSupabaseReady, async (req, res) => {
    const accessToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken.trim() : '';
    const tokenHash = typeof req.body?.tokenHash === 'string' ? req.body.tokenHash.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const anon = getSupabaseAnon();
    const admin = getSupabaseAdmin();
    if (!anon) {
      return res.status(503).json({ error: 'SUPABASE_ANON_KEY is required.' });
    }

    let targetUserId = '';
    if (accessToken) {
      const { data, error } = await anon.auth.getUser(accessToken);
      if (error || !data?.user) {
        return res.status(400).json({ error: 'Invalid or expired recovery token.' });
      }
      targetUserId = data.user.id;
    } else if (tokenHash) {
      const { data, error } = await anon.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });
      if (error || !data?.user) {
        return res.status(400).json({ error: error?.message || 'Invalid or expired reset code.' });
      }
      targetUserId = data.user.id;
    } else {
      return res.status(400).json({ error: 'Recovery token or reset code is required.' });
    }

    if (admin) {
      const { error } = await admin.auth.admin.updateUserById(targetUserId, { password: newPassword });
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ ok: true });
    }

    return res.status(503).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY is required to complete password reset on the server.',
    });
  });

  app.post('/api/auth/resend-verification', rateLimit(5, 60_000), requireSupabaseReady, async (req, res) => {
    const anon = getSupabaseAnon();
    if (!anon) return res.status(503).json({ error: 'SUPABASE_ANON_KEY is required.' });
    const email = sanitizeText(req.body?.email, 254).toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    const { error } = await anon.auth.resend({ type: 'signup', email });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  });

  app.post('/api/auth/change-password', rateLimit(10, 60_000), requireAuth, async (req: AuthRequest, res) => {
    const anon = getSupabaseAnon();
    const admin = getSupabaseAdmin();
    if (!anon || !admin || !req.user?.email) {
      return res.status(503).json({ error: 'Supabase admin password service unavailable.' });
    }
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!currentPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Current password and new password (min 8 chars) are required.' });
    }

    const { error: verifyErr } = await anon.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });
    if (verifyErr) {
      return res.status(401).json({ error: 'Current password verification failed.' });
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(req.user.id, {
      password: newPassword,
    });
    if (updateErr) {
      return res.status(400).json({ error: updateErr.message });
    }

    await admin.from('login_activity').insert({
      user_id: req.user.id,
      device_label: getDeviceLabel(req),
      event_type: 'password_reset',
    });

    return res.json({ ok: true });
  });

  app.post('/api/auth/verify-password', rateLimit(15, 60_000), requireAuth, async (req: AuthRequest, res) => {
    const anon = getSupabaseAnon();
    if (!anon || !req.user?.email) {
      return res.status(503).json({ error: 'Supabase verification service unavailable.' });
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password) {
      return res.status(400).json({ error: 'Current password is required to verify this action.' });
    }
    const { error } = await anon.auth.signInWithPassword({
      email: req.user.email,
      password,
    });
    if (error) {
      return res.status(401).json({ error: 'Password verification failed.' });
    }
    return res.json({ verified: true });
  });

  // --- Protected User Dashboard Data & Operations ---
  app.get('/api/dashboard/data', requireAuth, async (req: AuthRequest, res) => {
    const db = getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    try {
      const uid = req.user.id;
      const profile = await ensureUserProfileInSupabase(db, req.user);

      const [
        { data: invRows },
        { data: depRows },
        { data: wdrRows },
        { data: txRows },
        { data: refRows },
        { data: notifRows },
        { data: actRows },
      ] = await Promise.all([
        db.from('investments').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(150),
        db.from('deposit_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(150),
        db.from('withdrawal_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(150),
        db.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(150),
        db.from('referrals').select('*').eq('referrer_id', uid).order('created_at', { ascending: false }).limit(150),
        db.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(150),
        db.from('login_activity').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
      ]);

      return res.json({
        profile,
        investments: (invRows || []).map((r) => mapInvestment(r as Record<string, unknown>)),
        deposits: (depRows || []).map((r) => mapDeposit(r as Record<string, unknown>)),
        withdrawals: (wdrRows || []).map((r) => mapWithdrawal(r as Record<string, unknown>)),
        transactions: (txRows || []).map((r) => mapTransaction(r as Record<string, unknown>)),
        referrals: (refRows || []).map((r) => mapReferral(r as Record<string, unknown>)),
        notifications: (notifRows || []).map((r) => mapNotification(r as Record<string, unknown>)),
        loginActivity: (actRows || []).map((r) => mapLoginActivity(r as Record<string, unknown>)),
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch dashboard data.',
      });
    }
  });

  app.patch('/api/profile/preferences', requireAuth, requireVerifiedEmail, async (req: AuthRequest, res) => {
    const db = getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const fullName = sanitizeText(req.body?.fullName, 100);
    const phone = sanitizeText(req.body?.phone, 32);
    if (fullName.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }

    const { data, error } = await db
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        two_factor_enabled: Boolean(req.body?.twoFactorEnabled),
        notify_deposits: Boolean(req.body?.notifyDeposits),
        notify_withdrawals: Boolean(req.body?.notifyWithdrawals),
        notify_announcements: Boolean(req.body?.notifyAnnouncements),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error || !data) {
      return res.status(400).json({ error: error?.message || 'Unable to update preferences.' });
    }

    await db.from('login_activity').insert({
      user_id: req.user.id,
      device_label: getDeviceLabel(req),
      event_type: 'profile_update',
    });

    return res.json({ profile: mapProfile(data as Record<string, unknown>) });
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    const db = getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const { error } = await db
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  });

  // --- Simulated Deposit / Withdrawal / Investment Mutations ---
  app.post(
    '/api/sim/deposit',
    rateLimit(20, 60_000),
    requireAuth,
    requireVerifiedEmail,
    idempotencyGuard,
    async (req: AuthRequest, res) => {
      const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
      if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

      const { method, amount } = req.body ?? {};
      if (typeof method !== 'string' || !ALLOWED_METHODS.has(method)) {
        return res.status(400).json({ error: 'Unsupported payment method selected.' });
      }
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 10 || parsedAmount > 1_000_000) {
        return res.status(400).json({
          error: 'Simulated deposit amount must be between $10 and $1,000,000.',
        });
      }

      const { data: settingsRow } = await db
        .from('admin_settings')
        .select('deposits_enabled')
        .eq('id', 'global')
        .maybeSingle();
      if (settingsRow && settingsRow.deposits_enabled === false) {
        return res.status(403).json({ error: 'Simulated deposits are currently paused by administration.' });
      }

      const { data: profileRow } = await db
        .from('profiles')
        .select('status')
        .eq('id', req.user.id)
        .maybeSingle();
      if (profileRow?.status === 'suspended') {
        return res.status(403).json({ error: 'Your account is currently suspended.' });
      }

      const roundedAmount = Number(parsedAmount.toFixed(2));
      const referenceCode = generateReference('DEP');
      const currencyMap: Record<string, string> = {
        'Bitcoin (BTC)': 'BTC (DEMO)',
        USDT: 'USDT (DEMO)',
        PayPal: 'USD (DEMO)',
        'Mobile Money': 'MoMo (DEMO)',
        'Ethereum (ETH)': 'ETH (DEMO)',
      };
      const currency = currencyMap[method] || 'USD (DEMO)';
      const instructionsNote =
        'DEMO SIMULATION: No real payment link or blockchain address is issued. Pending admin review.';

      const { data: depRow, error: depErr } = await db
        .from('deposit_requests')
        .insert({
          user_id: req.user.id,
          method,
          amount: roundedAmount,
          currency,
          reference_code: referenceCode,
          instructions_note: instructionsNote,
          status: 'pending',
          admin_note: '',
          is_demo: true,
        })
        .select('*')
        .single();

      if (depErr || !depRow) {
        return res.status(400).json({ error: depErr?.message || 'Unable to create deposit request.' });
      }

      await Promise.all([
        db.from('transactions').insert({
          user_id: req.user.id,
          type: 'deposit',
          method,
          amount: roundedAmount,
          reference_code: referenceCode,
          status: 'pending',
          description: `DEMO deposit request via ${method} (Pending Admin Review)`,
          is_demo: true,
        }),
        db.from('notifications').insert({
          user_id: req.user.id,
          title: 'DEMO Deposit Request Submitted',
          message: `Your simulated ${method} deposit request for $${roundedAmount.toLocaleString()} (${referenceCode}) is pending review.`,
          category: 'deposit',
          read: false,
        }),
        db.from('audit_logs').insert({
          actor_id: req.user.id,
          actor_email: req.user.email || '',
          action: 'DEMO_DEPOSIT_SUBMITTED',
          target_type: 'deposit_request',
          target_id: String(depRow.id),
          details: `Submitted DEMO deposit $${roundedAmount} via ${method} (${referenceCode})`,
        }),
      ]);

      return res.status(201).json({
        isDemo: true,
        referenceCode,
        method,
        amount: roundedAmount,
        currency,
        instructionsNote,
        deposit: mapDeposit(depRow as Record<string, unknown>),
      });
    }
  );

  app.post('/api/sim/deposit/:id/cancel', requireAuth, requireVerifiedEmail, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const { data: updated, error } = await db
      .from('deposit_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'pending')
      .select('reference_code')
      .maybeSingle();

    if (error || !updated) {
      return res.status(400).json({ error: 'Only your own pending deposit requests can be cancelled.' });
    }

    await db
      .from('transactions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .eq('reference_code', updated.reference_code);

    return res.json({ ok: true });
  });

  app.post(
    '/api/sim/withdrawal',
    rateLimit(20, 60_000),
    requireAuth,
    requireVerifiedEmail,
    idempotencyGuard,
    async (req: AuthRequest, res) => {
      const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
      if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

      const { method, amount, destinationDetails } = req.body ?? {};
      if (typeof method !== 'string' || !ALLOWED_METHODS.has(method)) {
        return res.status(400).json({ error: 'Unsupported withdrawal method selected.' });
      }
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 10 || parsedAmount > 1_000_000) {
        return res.status(400).json({
          error: 'Simulated withdrawal amount must be between $10 and $1,000,000.',
        });
      }
      const cleanDest = sanitizeText(destinationDetails, 200);
      if (cleanDest.length < 4) {
        return res.status(400).json({
          error: 'Please enter valid simulated destination details (at least 4 characters).',
        });
      }

      const { data: settingsRow } = await db
        .from('admin_settings')
        .select('withdrawals_enabled')
        .eq('id', 'global')
        .maybeSingle();
      if (settingsRow && settingsRow.withdrawals_enabled === false) {
        return res.status(403).json({ error: 'Simulated withdrawals are currently paused by administration.' });
      }

      const { data: profileRow } = await db
        .from('profiles')
        .select('status, simulated_balance')
        .eq('id', req.user.id)
        .single();
      if (!profileRow || profileRow.status === 'suspended') {
        return res.status(403).json({ error: 'Your account is currently suspended.' });
      }

      const { data: pendingRows } = await db
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', req.user.id)
        .eq('status', 'pending');

      const pendingSum = (pendingRows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      const effectiveAvailable = Number(profileRow.simulated_balance || 0) - pendingSum;
      const roundedAmount = Number(parsedAmount.toFixed(2));
      if (roundedAmount > effectiveAvailable) {
        return res.status(400).json({
          error: `Insufficient simulated DEMO balance ($${effectiveAvailable.toLocaleString()} available after pending requests).`,
        });
      }

      const referenceCode = generateReference('WDR');
      const { data: wdrRow, error: wdrErr } = await db
        .from('withdrawal_requests')
        .insert({
          user_id: req.user.id,
          method,
          amount: roundedAmount,
          destination_details: cleanDest,
          reference_code: referenceCode,
          status: 'pending',
          admin_note: '',
          is_demo: true,
        })
        .select('*')
        .single();

      if (wdrErr || !wdrRow) {
        return res.status(400).json({ error: wdrErr?.message || 'Unable to submit withdrawal request.' });
      }

      await Promise.all([
        db.from('transactions').insert({
          user_id: req.user.id,
          type: 'withdrawal',
          method,
          amount: roundedAmount,
          reference_code: referenceCode,
          status: 'pending',
          description: `DEMO withdrawal request via ${method} (Pending Admin Review)`,
          is_demo: true,
        }),
        db.from('notifications').insert({
          user_id: req.user.id,
          title: 'DEMO Withdrawal Request Submitted',
          message: `Your simulated ${method} withdrawal of $${roundedAmount.toLocaleString()} (${referenceCode}) is queued for review.`,
          category: 'withdrawal',
          read: false,
        }),
        db.from('audit_logs').insert({
          actor_id: req.user.id,
          actor_email: req.user.email || '',
          action: 'DEMO_WITHDRAWAL_SUBMITTED',
          target_type: 'withdrawal_request',
          target_id: String(wdrRow.id),
          details: `Submitted DEMO withdrawal $${roundedAmount} via ${method} (${referenceCode})`,
        }),
      ]);

      return res.status(201).json({
        isDemo: true,
        referenceCode,
        method,
        amount: roundedAmount,
        destinationDetails: cleanDest,
        withdrawal: mapWithdrawal(wdrRow as Record<string, unknown>),
      });
    }
  );

  app.post('/api/sim/withdrawal/:id/cancel', requireAuth, requireVerifiedEmail, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const { data: updated, error } = await db
      .from('withdrawal_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('status', 'pending')
      .select('reference_code')
      .maybeSingle();

    if (error || !updated) {
      return res.status(400).json({ error: 'Only your own pending withdrawal requests can be cancelled.' });
    }

    await db
      .from('transactions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .eq('reference_code', updated.reference_code);

    return res.json({ ok: true });
  });

  app.post(
    '/api/sim/invest',
    rateLimit(25, 60_000),
    requireAuth,
    requireVerifiedEmail,
    idempotencyGuard,
    async (req: AuthRequest, res) => {
      const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
      if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

      const { planId } = req.body ?? {};
      const canonicalPlan = CANONICAL_PLANS.find((p) => p.id === planId);
      if (!canonicalPlan) {
        return res.status(400).json({ error: 'Invalid investment plan selected.' });
      }

      const { data: dbPlan } = await db
        .from('investment_plans')
        .select('*')
        .eq('id', canonicalPlan.id)
        .maybeSingle();

      if (dbPlan && dbPlan.is_visible === false) {
        return res.status(400).json({ error: 'This investment plan is currently hidden.' });
      }

      const plan = dbPlan ? mapPlan(dbPlan as Record<string, unknown>) : canonicalPlan;

      const { data: settingsRow } = await db
        .from('admin_settings')
        .select('investments_enabled')
        .eq('id', 'global')
        .maybeSingle();
      if (settingsRow && settingsRow.investments_enabled === false) {
        return res.status(403).json({ error: 'Simulated investments are currently paused by administration.' });
      }

      const { data: userRow } = await db
        .from('profiles')
        .select('status, simulated_balance, simulated_invested')
        .eq('id', req.user.id)
        .single();

      if (!userRow || userRow.status === 'suspended') {
        return res.status(403).json({ error: 'Your account is currently suspended.' });
      }

      const currentBalance = Number(userRow.simulated_balance || 0);
      const currentInvested = Number(userRow.simulated_invested || 0);
      if (currentBalance < plan.amount) {
        return res.status(400).json({
          error: `Insufficient DEMO balance. Need $${plan.amount.toLocaleString()}, available $${currentBalance.toLocaleString()}.`,
        });
      }

      const newBalance = Number((currentBalance - plan.amount).toFixed(2));
      const newInvested = Number((currentInvested + plan.amount).toFixed(2));

      // Conditional optimistic balance check prevents double-spending on concurrent requests
      const { data: updatedUser, error: balErr } = await db
        .from('profiles')
        .update({
          simulated_balance: newBalance,
          simulated_invested: newInvested,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.user.id)
        .eq('simulated_balance', currentBalance)
        .select('*')
        .maybeSingle();

      if (balErr || !updatedUser) {
        return res.status(409).json({
          error: 'Balance changed concurrently. Please refresh and try again.',
        });
      }

      const referenceCode = generateReference('INV');
      const { data: invRow, error: invErr } = await db
        .from('investments')
        .insert({
          user_id: req.user.id,
          plan_id: plan.id,
          plan_name: plan.name,
          amount: plan.amount,
          illustrative_daily_rate: plan.illustrativeDailyRate,
          duration_days: plan.durationDays,
          status: 'active',
          is_demo: true,
        })
        .select('*')
        .single();

      if (invErr || !invRow) {
        // Rollback optimistic balance update
        await db
          .from('profiles')
          .update({
            simulated_balance: currentBalance,
            simulated_invested: currentInvested,
            updated_at: new Date().toISOString(),
          })
          .eq('id', req.user.id);
        return res.status(400).json({ error: invErr?.message || 'Unable to record simulated investment.' });
      }

      await Promise.all([
        db.from('transactions').insert({
          user_id: req.user.id,
          type: 'investment',
          method: 'Simulated Balance',
          amount: plan.amount,
          reference_code: referenceCode,
          status: 'active',
          description: `DEMO investment allocated to ${plan.name} (${plan.illustrativeDailyRate}% illustrative daily figure)`,
          is_demo: true,
        }),
        db.from('notifications').insert({
          user_id: req.user.id,
          title: `DEMO ${plan.name} Created`,
          message: `Allocated $${plan.amount.toLocaleString()} in DEMO simulation mode (${plan.illustrativeDailyRate}% illustrative figure).`,
          category: 'investment',
          read: false,
        }),
        db.from('audit_logs').insert({
          actor_id: req.user.id,
          actor_email: req.user.email || '',
          action: 'DEMO_INVESTMENT_CREATED',
          target_type: 'investment',
          target_id: String(invRow.id),
          details: `Created DEMO investment ${plan.name} ($${plan.amount})`,
        }),
      ]);

      return res.status(201).json({
        isDemo: true,
        referenceCode,
        planId: plan.id,
        planName: plan.name,
        amount: plan.amount,
        illustrativeDailyRate: plan.illustrativeDailyRate,
        durationDays: plan.durationDays,
        investment: mapInvestment(invRow as Record<string, unknown>),
        profile: mapProfile(updatedUser as Record<string, unknown>),
      });
    }
  );

  // Contact form server validation + Supabase persistence
  app.post('/api/contact', rateLimit(10, 60_000), async (req, res) => {
    const name = sanitizeText(req.body?.name, 100);
    const email = sanitizeText(req.body?.email, 254);
    const subject = sanitizeText(req.body?.subject, 140);
    const message = sanitizeText(req.body?.message, 2000);

    if (name.length < 2) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (subject.length < 3) {
      return res.status(400).json({ error: 'Please provide a concise subject.' });
    }
    if (message.length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters long.' });
    }

    const db = getSupabaseAdmin() || getSupabaseAnon();
    if (!db) {
      return res.status(503).json({
        error: 'Supabase is not configured yet. Configure SUPABASE_URL and SUPABASE_ANON_KEY to store contact messages.',
      });
    }

    const { data, error } = await db
      .from('contact_messages')
      .insert({ name, email, subject, message })
      .select('id')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json({ valid: true, id: data?.id });
  });

  // --- Protected Admin Endpoints ---
  app.get('/api/admin/policy-status', rateLimit(30, 60_000), requireAuth, requireAdmin, (req: AuthRequest, res) => {
    res.json({
      authorizedAdmin: req.user?.email,
      demoModeOnly: true,
      realMoneyOperations: 'DISABLED',
      rateLimitActiveBuckets: rateBuckets.size,
      idempotencyActiveKeys: idempotencyCache.size,
      serverTimestamp: new Date().toISOString(),
    });
  });

  app.get('/api/admin/overview', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseForUser(req.accessToken!);
    if (!db) return res.status(503).json({ error: 'Supabase unavailable.' });

    const [
      { data: users },
      { data: deposits },
      { data: withdrawals },
      { data: investments },
      { data: auditLogs },
      { data: plans },
      { data: announcements },
      { data: settings },
    ] = await Promise.all([
      db.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('deposit_requests').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('withdrawal_requests').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('investments').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      db.from('investment_plans').select('*').order('tier_number', { ascending: true }),
      db.from('announcements').select('*').order('created_at', { ascending: false }).limit(50),
      db.from('admin_settings').select('*').eq('id', 'global').maybeSingle(),
    ]);

    return res.json({
      users: (users || []).map((r) => mapProfile(r as Record<string, unknown>)),
      deposits: (deposits || []).map((r) => mapDeposit(r as Record<string, unknown>)),
      withdrawals: (withdrawals || []).map((r) => mapWithdrawal(r as Record<string, unknown>)),
      investments: (investments || []).map((r) => mapInvestment(r as Record<string, unknown>)),
      auditLogs: (auditLogs || []).map((r) => mapAuditLog(r as Record<string, unknown>)),
      plans:
        plans && plans.length > 0
          ? plans.map((r) => mapPlan(r as Record<string, unknown>))
          : CANONICAL_PLANS,
      announcements: (announcements || []).map((r) => mapAnnouncement(r as Record<string, unknown>)),
      settings: settings ? mapSettings(settings as Record<string, unknown>) : null,
    });
  });

  app.post('/api/admin/deposits/:id/review', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const decision = req.body?.decision;
    const adminNote = sanitizeText(req.body?.adminNote, 300);
    if (decision !== 'approved' && decision !== 'rejected') {
      return res.status(400).json({ error: 'Invalid review decision.' });
    }

    const { data: depRow, error: updateErr } = await db
      .from('deposit_requests')
      .update({ status: decision, admin_note: adminNote, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();

    if (updateErr || !depRow) {
      return res.status(409).json({ error: 'This deposit request was not found or was already processed.' });
    }

    const amount = Number(depRow.amount);
    if (decision === 'approved') {
      const { data: userProfile } = await db
        .from('profiles')
        .select('simulated_balance')
        .eq('id', depRow.user_id)
        .single();
      const nextBalance = Number((Number(userProfile?.simulated_balance || 0) + amount).toFixed(2));
      await db
        .from('profiles')
        .update({ simulated_balance: nextBalance, updated_at: new Date().toISOString() })
        .eq('id', depRow.user_id);
    }

    await Promise.all([
      db
        .from('transactions')
        .update({
          status: decision,
          description:
            decision === 'approved'
              ? `DEMO deposit approved via ${depRow.method}`
              : `DEMO deposit rejected (${adminNote.slice(0, 120) || 'Admin review'})`,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', depRow.user_id)
        .eq('reference_code', depRow.reference_code),
      db.from('notifications').insert({
        user_id: depRow.user_id,
        title: decision === 'approved' ? 'DEMO Deposit Approved' : 'DEMO Deposit Rejected',
        message:
          decision === 'approved'
            ? `Your simulated deposit ${depRow.reference_code} ($${amount.toLocaleString()}) was approved. Your DEMO balance has been updated.`
            : `Your simulated deposit ${depRow.reference_code} ($${amount.toLocaleString()}) was rejected. ${adminNote}`,
        category: 'deposit',
        read: false,
      }),
      db.from('audit_logs').insert({
        actor_id: req.user.id,
        actor_email: req.user.email || '',
        action: decision === 'approved' ? 'ADMIN_DEPOSIT_APPROVED' : 'ADMIN_DEPOSIT_REJECTED',
        target_type: 'deposit_request',
        target_id: String(depRow.id),
        details: `${decision.toUpperCase()} DEMO deposit $${amount} for user ${depRow.user_id}. Note: ${adminNote || 'None'}`,
      }),
    ]);

    return res.json({ ok: true });
  });

  app.post('/api/admin/withdrawals/:id/review', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const decision = req.body?.decision;
    const adminNote = sanitizeText(req.body?.adminNote, 300);
    if (decision !== 'approved' && decision !== 'rejected') {
      return res.status(400).json({ error: 'Invalid review decision.' });
    }

    const { data: wdrCheck } = await db
      .from('withdrawal_requests')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!wdrCheck || wdrCheck.status !== 'pending') {
      return res.status(409).json({ error: 'This withdrawal request was not found or was already processed.' });
    }

    const amount = Number(wdrCheck.amount);
    if (decision === 'approved') {
      const { data: userProfile } = await db
        .from('profiles')
        .select('simulated_balance')
        .eq('id', wdrCheck.user_id)
        .single();
      const currentBalance = Number(userProfile?.simulated_balance || 0);
      if (currentBalance < amount) {
        return res.status(400).json({
          error: `Cannot approve: user DEMO balance ($${currentBalance}) is less than $${amount}.`,
        });
      }
      const nextBalance = Number((currentBalance - amount).toFixed(2));
      const { data: balOk } = await db
        .from('profiles')
        .update({ simulated_balance: nextBalance, updated_at: new Date().toISOString() })
        .eq('id', wdrCheck.user_id)
        .eq('simulated_balance', currentBalance)
        .select('id')
        .maybeSingle();

      if (!balOk) {
        return res.status(409).json({ error: 'User balance changed concurrently. Retry approval.' });
      }
    }

    const { data: wdrRow } = await db
      .from('withdrawal_requests')
      .update({ status: decision, admin_note: adminNote, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();

    if (!wdrRow) {
      return res.status(409).json({ error: 'Withdrawal request already processed.' });
    }

    await Promise.all([
      db
        .from('transactions')
        .update({
          status: decision,
          description:
            decision === 'approved'
              ? `DEMO withdrawal approved via ${wdrRow.method}`
              : `DEMO withdrawal rejected (${adminNote.slice(0, 120) || 'Admin review'})`,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', wdrRow.user_id)
        .eq('reference_code', wdrRow.reference_code),
      db.from('notifications').insert({
        user_id: wdrRow.user_id,
        title: decision === 'approved' ? 'DEMO Withdrawal Approved' : 'DEMO Withdrawal Rejected',
        message:
          decision === 'approved'
            ? `Your simulated withdrawal ${wdrRow.reference_code} ($${amount.toLocaleString()}) was approved in DEMO mode.`
            : `Your simulated withdrawal ${wdrRow.reference_code} ($${amount.toLocaleString()}) was rejected. ${adminNote}`,
        category: 'withdrawal',
        read: false,
      }),
      db.from('audit_logs').insert({
        actor_id: req.user.id,
        actor_email: req.user.email || '',
        action: decision === 'approved' ? 'ADMIN_WITHDRAWAL_APPROVED' : 'ADMIN_WITHDRAWAL_REJECTED',
        target_type: 'withdrawal_request',
        target_id: String(wdrRow.id),
        details: `${decision.toUpperCase()} DEMO withdrawal $${amount} for user ${wdrRow.user_id}. Note: ${adminNote || 'None'}`,
      }),
    ]);

    return res.json({ ok: true });
  });

  app.patch('/api/admin/users/:uid/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const targetUid = req.params.uid;
    if (targetUid === req.user.id) {
      return res.status(400).json({ error: 'You cannot suspend your own administrator account.' });
    }
    const status = req.body?.status;
    if (status !== 'active' && status !== 'suspended') {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const { error } = await db
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', targetUid);

    if (error) return res.status(400).json({ error: error.message });

    await db.from('audit_logs').insert({
      actor_id: req.user.id,
      actor_email: req.user.email || '',
      action: status === 'suspended' ? 'ADMIN_USER_SUSPENDED' : 'ADMIN_USER_REACTIVATED',
      target_type: 'profile',
      target_id: targetUid,
      details: `Updated account status to ${status}`,
    });

    return res.json({ ok: true });
  });

  app.patch('/api/admin/plans/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    await seedDefaultPlansAndSettingsIfEmpty(db);
    const isVisible = Boolean(req.body?.isVisible);
    const { data, error } = await db
      .from('investment_plans')
      .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error || !data) return res.status(400).json({ error: error?.message || 'Plan update failed.' });

    await db.from('audit_logs').insert({
      actor_id: req.user.id,
      actor_email: req.user.email || '',
      action: 'ADMIN_PLAN_UPDATED',
      target_type: 'investment_plan',
      target_id: String(data.id),
      details: `Updated ${data.name} visibility=${isVisible}`,
    });

    return res.json({ plan: mapPlan(data as Record<string, unknown>) });
  });

  app.post('/api/admin/announcements', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const title = sanitizeText(req.body?.title, 120);
    const body = sanitizeText(req.body?.body, 600);
    const severity = ['info', 'notice', 'warning'].includes(req.body?.severity)
      ? req.body.severity
      : 'info';

    if (title.length < 2 || body.length < 4) {
      return res.status(400).json({ error: 'Announcement title and body are required.' });
    }

    const { data, error } = await db
      .from('announcements')
      .insert({ title, body, severity, is_active: true })
      .select('*')
      .single();

    if (error || !data) return res.status(400).json({ error: error?.message || 'Unable to publish.' });

    await db.from('audit_logs').insert({
      actor_id: req.user.id,
      actor_email: req.user.email || '',
      action: 'ADMIN_ANNOUNCEMENT_CREATED',
      target_type: 'announcement',
      target_id: String(data.id),
      details: `Published announcement: ${title.slice(0, 80)}`,
    });

    return res.status(201).json({ announcement: mapAnnouncement(data as Record<string, unknown>) });
  });

  app.patch('/api/admin/announcements/:id/toggle', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db) return res.status(503).json({ error: 'Supabase unavailable.' });

    const isActive = Boolean(req.body?.isActive);
    const { error } = await db
      .from('announcements')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  });

  app.post('/api/admin/notifications', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const targetUid = sanitizeText(req.body?.targetUid, 64);
    const title = sanitizeText(req.body?.title, 120);
    const message = sanitizeText(req.body?.message, 500);
    if (!targetUid || title.length < 2 || message.length < 2) {
      return res.status(400).json({ error: 'Target user, title, and message are required.' });
    }

    const { data, error } = await db
      .from('notifications')
      .insert({
        user_id: targetUid,
        title,
        message,
        category: 'announcement',
        read: false,
      })
      .select('id')
      .single();

    if (error || !data) return res.status(400).json({ error: error?.message || 'Failed to send.' });

    await db.from('audit_logs').insert({
      actor_id: req.user.id,
      actor_email: req.user.email || '',
      action: 'ADMIN_NOTIFICATION_SENT',
      target_type: 'notification',
      target_id: String(data.id),
      details: `Sent notification "${title.slice(0, 60)}" to ${targetUid}`,
    });

    return res.status(201).json({ ok: true });
  });

  app.put('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    const db = getSupabaseAdmin() || getSupabaseForUser(req.accessToken!);
    if (!db || !req.user) return res.status(503).json({ error: 'Supabase unavailable.' });

    const depositsEnabled = Boolean(req.body?.depositsEnabled);
    const withdrawalsEnabled = Boolean(req.body?.withdrawalsEnabled);
    const investmentsEnabled = Boolean(req.body?.investmentsEnabled);
    const illustrativeNotice =
      sanitizeText(req.body?.illustrativeNotice, 400) || DEFAULT_ILLUSTRATIVE_NOTICE;

    const { data, error } = await db
      .from('admin_settings')
      .upsert({
        id: 'global',
        demo_mode_only: true,
        deposits_enabled: depositsEnabled,
        withdrawals_enabled: withdrawalsEnabled,
        investments_enabled: investmentsEnabled,
        illustrative_notice: illustrativeNotice,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) return res.status(400).json({ error: error?.message || 'Failed to save.' });

    await db.from('audit_logs').insert({
      actor_id: req.user.id,
      actor_email: req.user.email || '',
      action: 'ADMIN_SETTINGS_UPDATED',
      target_type: 'admin_settings',
      target_id: 'global',
      details: `Updated platform settings (deposits=${depositsEnabled}, withdrawals=${withdrawalsEnabled}, investments=${investmentsEnabled})`,
    });

    return res.json({ settings: mapSettings(data as Record<string, unknown>) });
  });

  // Catch unhandled /api/* routes cleanly
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return app;
}

async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GROEarnX Supabase server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start GROEarnX server:', err);
    process.exit(1);
  });
}
