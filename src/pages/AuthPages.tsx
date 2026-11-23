import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, KeyRound, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify';

interface AuthPagesProps {
  mode: AuthMode;
  oobCode?: string;
  initialReferralCode?: string;
  onNavigate: (path: string) => void;
}

export function AuthPages({
  mode,
  oobCode = '',
  initialReferralCode = '',
  onNavigate,
}: AuthPagesProps) {
  const {
    authUser,
    emailVerified,
    supabaseConfigured,
    schemaReady,
    pendingVerificationEmail,
    registerWithEmail,
    loginWithEmail,
    requestPasswordReset,
    completePasswordReset,
    resendVerificationEmail,
    refreshAuthUser,
    refreshPublicData,
  } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [resetCode, setResetCode] = useState(oobCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [migrationSql, setMigrationSql] = useState('');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [checkingSchema, setCheckingSchema] = useState(false);

  const loadMigrationSql = async (): Promise<string> => {
    if (migrationSql) return migrationSql;
    const res = await fetch('/api/public/migration-sql');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || typeof data?.sql !== 'string') {
      throw new Error('Could not load migration SQL.');
    }
    setMigrationSql(data.sql);
    return data.sql;
  };

  const handleCopySql = async () => {
    try {
      const sql = await loadMigrationSql();
      await navigator.clipboard.writeText(sql);
      showToast('SQL migration copied! Paste and run it in Supabase SQL Editor.', 'success');
    } catch {
      try {
        await loadMigrationSql();
        setShowSqlModal(true);
        showToast('Clipboard blocked in iframe — select and copy the SQL below.', 'info');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Unable to load SQL.', 'error');
      }
    }
  };

  const handleRecheckSchema = async () => {
    setCheckingSchema(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json().catch(() => ({}));
      await refreshPublicData();
      if (data?.schemaReady) {
        setError('');
        showToast('Supabase database schema detected! You can sign in or register now.', 'success');
      } else {
        showToast('Tables still not detected. Run the SQL script in Supabase SQL Editor first.', 'info');
      }
    } catch {
      showToast('Unable to check schema status right now.', 'error');
    } finally {
      setCheckingSchema(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 5) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedTerms) {
      setError('You must agree to the Terms & Conditions and Risk Disclosure.');
      return;
    }

    setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await registerWithEmail({
        fullName,
        email,
        phone,
        password,
        referralCode,
      });
      if (needsEmailConfirmation) {
        showToast('Account created! Please check your email for a verification link.', 'success');
        onNavigate('/verify-email');
      } else {
        showToast('Account created and signed in.', 'success');
        onNavigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      showToast('Signed in successfully.', 'success');
      onNavigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setInfoMsg(
        'If an account exists for that email address, a password reset link has been sent.'
      );
      showToast('Password reset email dispatched.', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetCode.trim()) {
      setError('Recovery token or verification code from your reset email is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await completePasswordReset(resetCode.trim(), newPassword);
      showToast('Password updated. You can now sign in.', 'success');
      onNavigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshVerification = async () => {
    setError('');
    setSubmitting(true);
    try {
      const verified = await refreshAuthUser();
      if (verified) {
        showToast('Email verified! Full DEMO dashboard unlocked.', 'success');
        onNavigate('/dashboard');
      } else if (!authUser) {
        setInfoMsg(
          'After clicking the confirmation link in your email inbox, please sign in with your email and password.'
        );
      } else {
        setInfoMsg('Email is not verified yet. Please click the link sent to your inbox first.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 sm:p-8 shadow-2xl space-y-6">
        {!supabaseConfigured && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-100 leading-relaxed">
            <strong className="text-amber-300 block mb-0.5">Supabase Setup Pending</strong>
            Add <code className="font-mono">SUPABASE_URL</code>,{' '}
            <code className="font-mono">SUPABASE_ANON_KEY</code>, and{' '}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in AI Studio Secrets and
            execute the SQL migration to activate sign-in and persistence.
          </div>
        )}

        {supabaseConfigured && !schemaReady && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-100 leading-relaxed space-y-3">
            <div>
              <strong className="text-amber-300 block mb-0.5">Database Migration Required</strong>
              Supabase is connected, but the schema tables (<code className="font-mono">public.profiles</code>, etc.) have not been created yet. Paste and run the SQL migration in your Supabase Dashboard → SQL Editor.
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopySql()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-amber-300 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy SQL Migration
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!showSqlModal) {
                    void loadMigrationSql()
                      .then(() => setShowSqlModal(true))
                      .catch(() => {});
                  } else {
                    setShowSqlModal(false);
                  }
                }}
                className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20 cursor-pointer"
              >
                {showSqlModal ? 'Hide SQL' : 'View SQL'}
              </button>
              <button
                type="button"
                disabled={checkingSchema}
                onClick={() => void handleRecheckSchema()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/10 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingSchema ? 'animate-spin' : ''}`} />
                {checkingSchema ? 'Checking...' : 'Recheck Schema'}
              </button>
            </div>
            {showSqlModal && migrationSql && (
              <textarea
                readOnly
                rows={8}
                value={migrationSql}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-lg border border-white/15 bg-[#061121] p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none"
              />
            )}
          </div>
        )}

        {mode === 'verify' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <MailCheck className="w-7 h-7 text-emerald-400" />
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Verify Your Email</h1>
                <p className="text-xs text-slate-400">
                  Required before creating simulated investments or deposit/withdrawal requests
                </p>
              </div>
            </div>

            {emailVerified ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100 space-y-3">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Your email address is verified.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard')}
                  className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  Continue to Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  We sent a verification link to{' '}
                  <strong className="text-white">
                    {authUser?.email || pendingVerificationEmail || 'your email'}
                  </strong>
                  . Click the link in your inbox to confirm your account.
                </p>
                {infoMsg && (
                  <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-xs text-sky-200">
                    {infoMsg}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                    {error}
                  </div>
                )}
                {authUser ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleRefreshVerification()}
                    className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Checking...' : "I've Verified My Email"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                )}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    void resendVerificationEmail()
                      .then(() => showToast('Verification email resent.', 'success'))
                      .catch((err) => setError(err.message))
                  }
                  className="w-full rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
                >
                  Resend Verification Email
                </button>
                {authUser && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/dashboard')}
                    className="w-full text-center text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Preview Dashboard (Read-Only Until Verified)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'forgot' && (
          <form onSubmit={(e) => void handleForgot(e)} className="space-y-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold text-white">Forgot Password</h1>
              <p className="text-xs text-slate-400">
                Enter your email to receive a secure password reset link.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {infoMsg && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                {infoMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="hover:text-emerald-400 cursor-pointer"
              >
                Back to Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/reset-password')}
                className="hover:text-emerald-400 cursor-pointer"
              >
                Have a reset token?
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={(e) => void handleResetConfirm(e)} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <h1 className="font-display text-2xl font-bold text-white">Reset Password</h1>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reset-code" className="block text-xs font-medium text-slate-300">
                Recovery Token (from reset email link)
              </label>
              <input
                id="reset-code"
                type="text"
                required
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Paste recovery token"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reset-pass" className="block text-xs font-medium text-slate-300">
                New Password
              </label>
              <input
                id="reset-pass"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reset-confirm" className="block text-xs font-medium text-slate-300">
                Confirm New Password
              </label>
              <input
                id="reset-confirm"
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating...' : 'Confirm Password Reset'}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold text-white">Sign In to GROEarnX</h1>
              <p className="text-xs text-slate-400">
                Access your simulated investment portfolio and request ledger.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-200 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-pass" className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Signing In...' : 'Login'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold text-white">Create GROEarnX Account</h1>
              <p className="text-xs text-slate-400">
                Start exploring DEMO portfolio management and simulated investment plans.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2 text-xs text-rose-200 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleRegister(e)} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="reg-name" className="block text-xs font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-phone" className="block text-xs font-medium text-slate-300">
                  Phone Number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  maxLength={32}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 234 5678"
                  className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="reg-pass" className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="reg-confirm" className="block text-xs font-medium text-slate-300">
                    Confirm Password
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="reg-ref" className="block text-xs font-medium text-slate-300">
                  Referral Code (optional)
                </label>
                <input
                  id="reg-ref"
                  type="text"
                  maxLength={24}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="GRX..."
                  className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-[#071426] text-emerald-500 focus:ring-emerald-400"
                />
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/legal/terms')}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>{' '}
                  and understand GROEarnX operates in DEMO simulation mode with illustrative rates.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
