import React, { useEffect, useState } from 'react';
import { KeyRound, Laptop, Lock, ShieldCheck, Smartphone, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfilePreferencesApi } from '../lib/apiClient';
import { formatTimestamp, getDeviceLabel } from '../lib/supabaseService';
import { LoginActivity } from '../types/platform';
import { useToast } from '../components/Toast';

export function ProfileSecurityPage({ loginActivity }: { loginActivity: LoginActivity[] }) {
  const {
    authUser,
    profile,
    emailVerified,
    changePassword,
    reauthenticateForSensitiveAction,
    triggerDataRefresh,
    setProfile,
    logout,
  } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(profile?.twoFactorEnabled));
  const [notifyDeposits, setNotifyDeposits] = useState(profile?.notifyDeposits ?? true);
  const [notifyWithdrawals, setNotifyWithdrawals] = useState(profile?.notifyWithdrawals ?? true);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(
    profile?.notifyAnnouncements ?? true
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [securityVerifyPass, setSecurityVerifyPass] = useState('');

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setTwoFactorEnabled(profile.twoFactorEnabled);
    setNotifyDeposits(profile.notifyDeposits);
    setNotifyWithdrawals(profile.notifyWithdrawals);
    setNotifyAnnouncements(profile.notifyAnnouncements);
  }, [profile]);

  const isPasswordUser = true;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    if (!emailVerified) {
      showToast('Please verify your email address before modifying security settings.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      // Sensitive security change: require re-verification if toggling 2FA or changing phone
      const sensitiveChanged =
        twoFactorEnabled !== Boolean(profile?.twoFactorEnabled) ||
        phone.trim() !== (profile?.phone || '');
      if (sensitiveChanged && isPasswordUser) {
        await reauthenticateForSensitiveAction(securityVerifyPass);
      }

      const res = await updateProfilePreferencesApi({
        fullName,
        phone,
        twoFactorEnabled,
        notifyDeposits,
        notifyWithdrawals,
        notifyAnnouncements,
      });
      setProfile(res.profile);
      triggerDataRefresh();
      setSecurityVerifyPass('');
      showToast('Profile and preferences saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save preferences.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    setSavingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password updated successfully.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not change password.', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profile &amp; Security</h1>
        <p className="text-sm text-slate-400">
          Manage your personal details, password, two-factor architecture, and session activity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Information & Preferences */}
        <form
          onSubmit={(e) => void handleSaveProfile(e)}
          className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display text-lg font-semibold text-white">
              Personal Information &amp; Notifications
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prof-name" className="block text-xs font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prof-phone" className="block text-xs font-medium text-slate-300">
                Phone Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                maxLength={32}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 234 5678"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#071426] p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Registered Email Address</span>
              <span className="font-medium text-white">{authUser?.email}</span>
            </div>
            <span
              className={`font-semibold ${emailVerified ? 'text-emerald-400' : 'text-amber-300'}`}
            >
              {emailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>

          {/* 2FA Architecture Section */}
          <div className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Two-Factor Authentication (2FA) Architecture
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Flag your account preference for multi-factor TOTP/SMS verification during
                  sensitive actions and withdrawals.
                </p>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                aria-label="Enable two-factor authentication preference"
                className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0B1B34] text-emerald-500"
              />
            </div>
            {twoFactorEnabled && (
              <p className="text-[11px] text-emerald-300 border-t border-white/10 pt-2">
                2FA preference enabled. Multi-factor enrollment pairs with Supabase Auth MFA when
                SMS/TOTP enforcement is activated on your identity provider.
              </p>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300">Notification Preferences</h3>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Payment request status updates</span>
              <input
                type="checkbox"
                checked={notifyDeposits}
                onChange={(e) => setNotifyDeposits(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Withdrawal request status updates</span>
              <input
                type="checkbox"
                checked={notifyWithdrawals}
                onChange={(e) => setNotifyWithdrawals(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Platform announcements &amp; compliance notices</span>
              <input
                type="checkbox"
                checked={notifyAnnouncements}
                onChange={(e) => setNotifyAnnouncements(e.target.checked)}
              />
            </label>
          </div>

          {isPasswordUser && (
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label htmlFor="sec-reauth" className="block text-xs font-medium text-slate-300">
                Current Password (required when changing phone or 2FA settings)
              </label>
              <input
                id="sec-reauth"
                type="password"
                value={securityVerifyPass}
                onChange={(e) => setSecurityVerifyPass(e.target.value)}
                placeholder="Required for phone or 2FA changes"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile || !emailVerified}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
          >
            {savingProfile ? 'Saving...' : 'Save Profile & Security Preferences'}
          </button>
        </form>

        {/* Password Change + Sessions */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={(e) => void handlePasswordChange(e)}
            className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display text-lg font-semibold text-white">Change Password</h2>
            </div>

            {!isPasswordUser ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                You are signed in via Google Sign-In. Password changes are managed through your
                Google account security settings.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="cur-pass" className="block text-xs font-medium text-slate-300">
                    Current Password
                  </label>
                  <input
                    id="cur-pass"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="new-pass" className="block text-xs font-medium text-slate-300">
                    New Password
                  </label>
                  <input
                    id="new-pass"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="conf-pass" className="block text-xs font-medium text-slate-300">
                    Confirm New Password
                  </label>
                  <input
                    id="conf-pass"
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPass}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {savingPass ? 'Updating...' : 'Update Password'}
                </button>
              </>
            )}
          </form>

          {/* Device / Session Management */}
          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-400" />
                Active Session &amp; Activity
              </h2>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-xs font-semibold text-rose-300 hover:underline cursor-pointer"
              >
                Sign Out Session
              </button>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{getDeviceLabel()}</p>
                <p className="text-emerald-300">Current Authenticated Session</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
              {loginActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-slate-200 capitalize">
                      {act.eventType.replace('_', ' ')}
                    </p>
                    <p className="text-slate-400">{act.deviceLabel}</p>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {formatTimestamp(act.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
