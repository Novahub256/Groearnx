import React, { useEffect, useState } from 'react';
import { Calculator, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateProjectionOnServer, createSimulatedInvestmentApi } from '../lib/apiClient';
import { InvestmentPlan } from '../types/platform';
import { useToast } from './Toast';

interface PlanCalculatorModalProps {
  plan: InvestmentPlan | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function PlanCalculatorModal({ plan, onClose, onNavigate }: PlanCalculatorModalProps) {
  const { authUser, profile, emailVerified, platformSettings, triggerDataRefresh } = useAuth();
  const { showToast } = useToast();
  const [days, setDays] = useState(30);
  const [projection, setProjection] = useState<{
    dailyIllustrativeAmount: number;
    totalIllustrativeProjection: number;
  } | null>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plan) return;
    setDays(plan.durationDays || 30);
    setError('');
  }, [plan]);

  useEffect(() => {
    if (!plan) return;
    let active = true;
    setLoadingCalc(true);
    calculateProjectionOnServer(plan.id, days)
      .then((res) => {
        if (active) {
          setProjection({
            dailyIllustrativeAmount: res.dailyIllustrativeAmount,
            totalIllustrativeProjection: res.totalIllustrativeProjection,
          });
        }
      })
      .catch(() => {
        if (active) {
          const daily = Number(((plan.amount * plan.illustrativeDailyRate) / 100).toFixed(2));
          setProjection({
            dailyIllustrativeAmount: daily,
            totalIllustrativeProjection: Number((daily * days).toFixed(2)),
          });
        }
      })
      .finally(() => {
        if (active) setLoadingCalc(false);
      });
    return () => {
      active = false;
    };
  }, [plan, days]);

  if (!plan) return null;

  const availableBalance = profile?.simulatedBalance ?? 0;
  const hasEnoughBalance = availableBalance >= plan.amount;

  const handleCreateSimulatedInvestment = async () => {
    setError('');
    if (!authUser) {
      onClose();
      onNavigate('/register');
      return;
    }
    if (!emailVerified) {
      setError('Please verify your email address before creating a simulated investment.');
      return;
    }
    if (!platformSettings.investmentsEnabled) {
      setError('Simulated investments are currently paused by platform administration.');
      return;
    }
    if (profile?.status === 'suspended') {
      setError('Your account is currently suspended and cannot create new simulated positions.');
      return;
    }
    if (!hasEnoughBalance) {
      setError(
        `Insufficient illustrative balance ($${availableBalance.toLocaleString()}). Please submit a payment request first.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSimulatedInvestmentApi(plan.id);
      triggerDataRefresh();
      showToast(
        `Simulated investment created in ${created.planName} ($${created.amount.toLocaleString()}).`,
        'success'
      );
      onClose();
      onNavigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create simulated investment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0B1B34] p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-400">
              Simulated Investment · Hypothetical Projection
            </p>
            <h2 id="plan-modal-title" className="font-display text-2xl font-bold text-white mt-1">
              {plan.name} — ${plan.amount.toLocaleString()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The {plan.illustrativeDailyRate}% proposed daily rate is a hypothetical projection for
          modeling only, not guaranteed or verified earnings. Confirming creates a simulated
          investment record.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-[#071426] p-4">
            <span className="text-xs text-slate-400">Simulated Allocation</span>
            <p className="font-mono text-xl font-bold text-white tabular-nums mt-1">
              ${plan.amount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#071426] p-4">
            <span className="text-xs text-slate-400">Illustrative Daily Rate</span>
            <p className="font-mono text-xl font-bold text-emerald-400 tabular-nums mt-1">
              {plan.illustrativeDailyRate}% / day
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Hypothetical Projection Horizon
            </span>
            <span className="font-mono text-xs text-slate-400 tabular-nums">{days} days</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[7, 15, 30, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  days === d
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'border border-white/10 bg-[#0B1B34] text-slate-300 hover:border-white/25'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Hypothetical Daily Output</span>
              <span className="font-mono font-semibold text-slate-100 tabular-nums">
                {loadingCalc
                  ? '...'
                  : `$${(projection?.dailyIllustrativeAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">
                Hypothetical {days}-Day Total (Non-Guaranteed)
              </span>
              <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                {loadingCalc
                  ? '...'
                  : `$${(projection?.totalIllustrativeProjection ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>
        </div>

        {authUser && (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#071426] px-4 py-3 text-sm">
            <span className="text-slate-300">Illustrative Balance</span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                hasEnoughBalance ? 'text-emerald-400' : 'text-slate-200'
              }`}
            >
              ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 flex items-start gap-2.5 text-xs text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-1">
          {authUser && !hasEnoughBalance && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('/dashboard/deposit');
              }}
              className="rounded-lg border border-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            >
              Submit Payment Request
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleCreateSimulatedInvestment()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {authUser
              ? submitting
                ? 'Creating Position...'
                : 'Create Simulated Investment'
              : 'Register to Simulate'}
          </button>
        </div>
      </div>
    </div>
  );
}
