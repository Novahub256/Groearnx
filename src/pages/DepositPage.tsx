import React, { useState } from 'react';
import { ArrowDownToLine, CheckCircle2, Info, XCircle } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants/plans';
import { useAuth } from '../context/AuthContext';
import { cancelPendingDepositApi, submitDemoDepositApi } from '../lib/apiClient';
import { formatTimestamp } from '../lib/supabaseService';
import { DepositRequest, PaymentMethod } from '../types/platform';
import { PaymentMethodIcon } from '../components/PaymentMethodIcon';
import { useToast } from '../components/Toast';

export function DepositPage({ deposits }: { deposits: DepositRequest[] }) {
  const { authUser, emailVerified, profile, platformSettings, triggerDataRefresh } = useAuth();
  const { showToast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Bitcoin (BTC)');
  const [amount, setAmount] = useState('250');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [latestSubmission, setLatestSubmission] = useState<{
    referenceCode: string;
    method: string;
    amount: number;
    currency: string;
    instructionsNote: string;
  } | null>(null);

  const activeMethodMeta = PAYMENT_METHODS.find((m) => m.id === selectedMethod) || PAYMENT_METHODS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLatestSubmission(null);

    if (!authUser) return;
    if (!emailVerified) {
      setError('Email verification is required before submitting payment requests.');
      return;
    }
    if (!platformSettings.depositsEnabled) {
      setError('Payment requests are currently paused by platform administration.');
      return;
    }
    if (profile?.status === 'suspended') {
      setError('Your account is suspended and cannot submit payment requests.');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 10 || numericAmount > 1_000_000) {
      setError('Please enter a payment request amount between $10 and $1,000,000.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitDemoDepositApi(selectedMethod, numericAmount);
      setLatestSubmission({
        referenceCode: res.referenceCode,
        method: res.method,
        amount: res.amount,
        currency: res.currency,
        instructionsNote: res.instructionsNote,
      });
      triggerDataRefresh();
      showToast(`Payment request ${res.referenceCode} submitted.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to submit payment request.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (depositId: string) => {
    if (!authUser) return;
    try {
      await cancelPendingDepositApi(depositId);
      triggerDataRefresh();
      showToast('Payment request cancelled.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to cancel request.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Payment Request</h1>
        <p className="text-sm text-slate-400">
          Submit a payment request across the five supported funding channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-5"
        >
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              1. Select Proposed Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map((pm) => {
                const active = pm.id === selectedMethod;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedMethod(pm.id)}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-[#071426] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <PaymentMethodIcon method={pm.id} className="w-6 h-6 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{pm.label}</p>
                      <p className="text-[11px] text-slate-400">{pm.currency}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="dep-amount" className="block text-xs font-semibold text-slate-300">
                2. Enter Amount (USD)
              </label>
              <input
                id="dep-amount"
                type="number"
                min={10}
                max={1000000}
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Channel Unit</label>
              <div className="rounded-lg border border-white/10 bg-[#071426] px-3.5 py-2.5 text-sm text-slate-200 font-mono">
                {activeMethodMeta.currency}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#071426] p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-1">
                Payment Request Details ({activeMethodMeta.label})
              </p>
              <p>{activeMethodMeta.demoInstruction}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          {latestSubmission && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2 text-xs text-emerald-100">
              <p className="font-semibold flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                Payment Request Recorded (Pending Review)
              </p>
              <p>
                Reference: <strong className="font-mono text-white">{latestSubmission.referenceCode}</strong> · Amount:{' '}
                <strong className="font-mono text-white">${latestSubmission.amount.toLocaleString()}</strong> ({latestSubmission.currency})
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            {submitting ? 'Generating Reference...' : 'Submit Payment Request'}
          </button>
        </form>

        {/* Payment Request History */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Your Payment Requests</h2>
          {deposits.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              No payment requests submitted yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {deposits.map((dep) => (
                <div
                  key={dep.id}
                  className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-white">
                      {dep.referenceCode}
                    </span>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        dep.status === 'approved'
                          ? 'text-emerald-400'
                          : dep.status === 'rejected'
                            ? 'text-rose-400'
                            : dep.status === 'cancelled'
                              ? 'text-slate-400'
                              : 'text-amber-300'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{dep.method} · Payment request</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      ${dep.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {dep.adminNote && (
                    <p className="text-[11px] text-slate-400">Admin Note: {dep.adminNote}</p>
                  )}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>{formatTimestamp(dep.createdAt)}</span>
                    {dep.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => void handleCancel(dep.id)}
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
    </div>
  );
}
