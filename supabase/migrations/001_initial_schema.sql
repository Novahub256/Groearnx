-- GROEarnX Complete Supabase PostgreSQL Schema & Row Level Security Migration
-- Run this migration in your Supabase SQL Editor before enabling live accounts.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '' CHECK (char_length(phone) <= 32),
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notify_deposits BOOLEAN NOT NULL DEFAULT TRUE,
  notify_withdrawals BOOLEAN NOT NULL DEFAULT TRUE,
  notify_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  simulated_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (simulated_balance >= 0),
  simulated_invested NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (simulated_invested >= 0),
  simulated_earnings NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (simulated_earnings >= 0),
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  granted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. Investment Plans
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id TEXT PRIMARY KEY,
  tier_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  illustrative_daily_rate NUMERIC(5, 2) NOT NULL CHECK (illustrative_daily_rate > 0),
  duration_days INTEGER NOT NULL DEFAULT 30,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Simulated Investments
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.investment_plans(id),
  plan_name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  illustrative_daily_rate NUMERIC(5, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Deposit Requests (DEMO)
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('Bitcoin (BTC)', 'USDT', 'PayPal', 'Mobile Money', 'Ethereum (ETH)')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 10),
  currency TEXT NOT NULL DEFAULT 'USD (DEMO)',
  reference_code TEXT NOT NULL UNIQUE,
  instructions_note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Withdrawal Requests (DEMO)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('Bitcoin (BTC)', 'USDT', 'PayPal', 'Mobile Money', 'Ethereum (ETH)')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 10),
  destination_details TEXT NOT NULL,
  reference_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Transactions Ledger
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'adjustment')),
  method TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  reference_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'active', 'completed')),
  description TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_display_name TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('system', 'deposit', 'withdrawal', 'investment', 'security', 'announcement')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'notice', 'warning')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Admin Settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  demo_mode_only BOOLEAN NOT NULL DEFAULT TRUE,
  deposits_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  withdrawals_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  investments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  illustrative_notice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Login Activity
CREATE TABLE IF NOT EXISTS public.login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_label TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'password_reset', 'profile_update')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Contact Messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 140),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON public.deposit_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON public.withdrawal_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_user_created ON public.login_activity(user_id, created_at DESC);

-- Helper for admin RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Enable Row Level Security across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Strict Row Level Security Policies (idempotent)
DROP POLICY IF EXISTS "Users read own profile or admin" ON public.profiles;
CREATE POLICY "Users read own profile or admin" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own non-balance profile" ON public.profiles;
CREATE POLICY "Users update own non-balance profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins read roles" ON public.user_roles;
CREATE POLICY "Admins read roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Public read visible plans" ON public.investment_plans;
CREATE POLICY "Public read visible plans" ON public.investment_plans FOR SELECT USING (is_visible = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage plans" ON public.investment_plans;
CREATE POLICY "Admins manage plans" ON public.investment_plans FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users read own investments" ON public.investments;
CREATE POLICY "Users read own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users read own deposits" ON public.deposit_requests;
CREATE POLICY "Users read own deposits" ON public.deposit_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create own demo deposits" ON public.deposit_requests;
CREATE POLICY "Users create own demo deposits" ON public.deposit_requests FOR INSERT WITH CHECK (auth.uid() = user_id AND is_demo = TRUE AND status = 'pending');

DROP POLICY IF EXISTS "Users read own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users read own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create own demo withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users create own demo withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id AND is_demo = TRUE AND status = 'pending');

DROP POLICY IF EXISTS "Users read own transactions" ON public.transactions;
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users read own referrals" ON public.referrals;
CREATE POLICY "Users read own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users mark own notifications read" ON public.notifications;
CREATE POLICY "Users mark own notifications read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read active announcements" ON public.announcements;
CREATE POLICY "Public read active announcements" ON public.announcements FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public read platform settings" ON public.admin_settings;
CREATE POLICY "Public read platform settings" ON public.admin_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage settings" ON public.admin_settings;
CREATE POLICY "Admins manage settings" ON public.admin_settings FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users read own login activity" ON public.login_activity;
CREATE POLICY "Users read own login activity" ON public.login_activity FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Public submit contact messages" ON public.contact_messages;
CREATE POLICY "Public submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins read contact messages" ON public.contact_messages;
CREATE POLICY "Admins read contact messages" ON public.contact_messages FOR SELECT USING (public.is_admin());

-- Seed Canonical 9 Proposed Plans & Default DEMO Settings
INSERT INTO public.investment_plans (id, tier_number, name, amount, illustrative_daily_rate, duration_days, is_visible, description)
VALUES
  ('plan_1', 1, 'Plan 1', 100.00, 5.00, 30, TRUE, 'Entry-level simulated tier for exploring basic portfolio allocation workflows.'),
  ('plan_2', 2, 'Plan 2', 200.00, 5.00, 30, TRUE, 'Introductory simulated tier with multi-day hypothetical projection modeling.'),
  ('plan_3', 3, 'Plan 3', 300.00, 7.00, 30, TRUE, 'Starter allocation tier illustrating medium-step rate scenarios.'),
  ('plan_4', 4, 'Plan 4', 500.00, 7.00, 30, TRUE, 'Core simulated portfolio tier for tracking allocation lifecycle states.'),
  ('plan_5', 5, 'Plan 5', 1000.00, 7.00, 30, TRUE, 'Balanced simulated tier designed for structured multi-position testing.'),
  ('plan_6', 6, 'Plan 6', 2000.00, 10.00, 30, TRUE, 'Expanded simulated tier illustrating elevated hypothetical rate scenarios.'),
  ('plan_7', 7, 'Plan 7', 3000.00, 10.00, 30, TRUE, 'Advanced simulated tier for testing larger demo portfolio allocations.'),
  ('plan_8', 8, 'Plan 8', 5000.00, 12.00, 30, TRUE, 'High-tier simulated model for reviewing ledger and approval workflows.'),
  ('plan_9', 9, 'Plan 9', 10000.00, 15.00, 30, TRUE, 'Maximum concept tier displaying upper-bound illustrative simulation figures.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_settings (id, demo_mode_only, deposits_enabled, withdrawals_enabled, investments_enabled, illustrative_notice)
VALUES (
  'global',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  'Important Notice: All displayed daily rates are unverified, illustrative concept figures and are NOT guaranteed or sustainable returns. Real-money deposits, custody, and payouts are disabled in this DEMO environment pending independent verification, compliance controls, and legal approval.'
)
ON CONFLICT (id) DO NOTHING;

-- Refresh PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
