import React, { useMemo, useState } from 'react';
import { ArrowUpFromLine, Lock, ShieldCheck, XCircle } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants/plans';
import { useAuth } from '../context/AuthContext';
import { cancelPendingWithdrawalApi, submitDemoWithdrawalApi } from '../lib/apiClient';
import { formatTimestamp } from '../lib/supabaseService';
import { PaymentMethod, WithdrawalRequest } from '../types/platform';
import { PaymentMethodIcon } from '../components/PaymentMethodIcon';
import { useToast } from '../components/Toast';

export function WithdrawalPage({ withdrawals }: { withdrawals: WithdrawalRequest[] }) {
  const {
    authUser,
    emailVerified,
    profile,
    platformSettings,
    reauthenticateForSensitiveAction,
    triggerDataRefresh,
  } = useAuth();
  const { showToast } = useToast();

  const [method, setMethod] = useState<PaymentMethod>('Bitcoin (BTC)');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isPasswordAccount = true;

  const methodMeta = PAYMENT_METHODS.find((m) => m.id === method) || PAYMENT_METHODS[0];
  const simulatedBalance = profile?.simulatedBalance ?? 0;
  const pendingReserved = useMemo(
    () =>
      withdrawals
        .filter((w) => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0),
    [withdrawals]
  );
  const effectiveAvailable = Math.max(0, Number((simulatedBalance - pendingReserved).toFixed(2)));

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailVerified) {
      setError('Email verification is required before submitting withdrawal requests.');
      return;
    }
    if (!platformSettings.withdrawalsEnabled) {
      setError('Simulated withdrawals are currently paused by platform administration.');
      return;
    }
    if (profile?.status === 'suspended') {
      setError('Your account is suspended.');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 10) {
      setError('Minimum withdrawal request amount is $10.');
      return;
    }
    if (numericAmount > effectiveAvailable) {
      setError(
        `Requested amount ($${numericAmount.toLocaleString()}) exceeds your illustrative balance ($${effectiveAvailable.toLocaleString()} after pending requests).`
      );
      return;
    }
    if (destination.trim().length < 4) {
      setError('Please enter valid destination reference details (minimum 4 characters).');
      return;
    }
    setReviewing(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (!authUser) return;
    setError('');
    setSubmitting(true);
    try {
      await reauthenticateForSensitiveAction(confirmPassword);

      const res = await submitDemoWithdrawalApi(method, Number(amount), destination.trim());
      triggerDataRefresh();
      showToast(`Withdrawal request ${res.referenceCode} submitted.`, 'success');
      setAmount('');
      setDestination('');
      setConfirmPassword('');
      setReviewing(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to submit withdrawal request.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (withdrawalId: string) => {
    if (!authUser) return;
    try {
      await cancelPendingWithdrawalApi(withdrawalId);
      triggerDataRefresh();
      showToast('Withdrawal request cancelled.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to cancel request.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Withdrawal Request</h1>
          <p className="text-sm text-slate-400">
            Balance-validated withdrawal request workflow across five supported channels.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0B1B34] px-4 py-2 text-right">
          <span className="text-[11px] text-slate-400 block">Illustrative Balance</span>
          <span className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
            ${effectiveAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleOpenReview}
          className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-5"
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              1. Select Withdrawal Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map((pm) => {
                const active = pm.id === method;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setMethod(pm.id)}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-[#071426] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <PaymentMethodIcon method={pm.id} className="w-6 h-6 shrink-0" />
                    <span className="text-sm font-semibold truncate">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="wdr-amount" className="block text-xs font-semibold text-slate-300">
                2. Enter Amount (USD)
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(effectiveAvailable))}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Use Available (${effectiveAvailable.toLocaleString()})
              </button>
            </div>
            <input
              id="wdr-amount"
              type="number"
              min={10}
              max={effectiveAvailable || 1000000}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wdr-dest" className="block text-xs font-semibold text-slate-300">
              3. {methodMeta.destinationLabel}
            </label>
            <input
              id="wdr-dest"
              type="text"
              required
              minLength={4}
              maxLength={200}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={methodMeta.destinationPlaceholder}
              className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Review Withdrawal Request
          </button>
        </form>

        {/* History */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Your Withdrawal Requests</h2>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              No withdrawal requests submitted yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {withdrawals.map((wdr) => (
                <div
                  key={wdr.id}
                  className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-white">
                      {wdr.referenceCode}
                    </span>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        wdr.status === 'approved'
                          ? 'text-emerald-400'
                          : wdr.status === 'rejected'
                            ? 'text-rose-400'
                            : wdr.status === 'cancelled'
                              ? 'text-slate-400'
                              : 'text-amber-300'
                      }`}
                    >
                      {wdr.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{wdr.method} · Withdrawal request</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      ${wdr.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Destination: {wdr.destinationDetails}
                  </p>
                  {wdr.adminNote && (
                    <p className="text-[11px] text-slate-400">Admin Note: {wdr.adminNote}</p>
                  )}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>{formatTimestamp(wdr.createdAt)}</span>
                    {wdr.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => void handleCancel(wdr.id)}
                        className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review & Additional Verification Modal */}
      {reviewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0B1B34] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold text-white">
                Review &amp; Verify Withdrawal
              </h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Type</span>
                <span className="font-semibold text-white">Withdrawal request</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method</span>
                <span className="font-semibold text-white">{method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 shrink-0">Destination</span>
                <span className="text-slate-200 truncate">{destination}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Withdrawal requests validate against your illustrative balance and require review. No
              live external or blockchain transfer is initiated.
            </p>

            {isPasswordAccount && (
              <div className="space-y-1.5">
                <label
                  htmlFor="wdr-reauth"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-300"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Confirm Account Password (Security Verification)
                </label>
                <input
                  id="wdr-reauth"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewing(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmWithdrawal()}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Confirm Withdrawal Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
