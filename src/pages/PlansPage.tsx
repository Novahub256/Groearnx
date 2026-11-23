import React, { useState } from 'react';
import { AlertTriangle, BarChart3, Calculator } from 'lucide-react';
import { ILLUSTRATIVE_RATES_NOTICE } from '../constants/plans';
import { useAuth } from '../context/AuthContext';
import { InvestmentPlan } from '../types/platform';
import { PlanCalculatorModal } from '../components/PlanCalculatorModal';

export function PlansPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { plans } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-medium text-emerald-400">DEMO SIMULATION CATALOG</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Proposed Investment Plans
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Compare all nine illustrative tiers below. Select any plan to inspect hypothetical
            projections or create a simulated DEMO investment in your dashboard.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 max-w-md flex items-start gap-3 text-xs text-amber-100 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{ILLUSTRATIVE_RATES_NOTICE}</span>
        </div>
      </div>

      {/* 9-Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const hypotheticalDaily = Number(
            ((plan.amount * plan.illustrativeDailyRate) / 100).toFixed(2)
          );
          return (
            <div
              key={plan.id}
              className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 flex flex-col justify-between gap-5 hover:border-emerald-400/50 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-400">{plan.name}</span>
                  <span className="text-xs text-slate-400">Illustrative DEMO</span>
                </div>
                <div>
                  <p className="font-mono text-3xl font-bold text-white tabular-nums">
                    ${plan.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Simulated Principal Tier</p>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{plan.description}</p>

                <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Proposed Daily Rate</span>
                    <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                      {plan.illustrativeDailyRate}% (Illustrative)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Hypothetical Daily Figure</span>
                    <span className="font-mono font-medium text-slate-200 tabular-nums">
                      ${hypotheticalDaily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Default Modeling Horizon</span>
                    <span className="font-mono font-medium text-slate-200 tabular-nums">
                      {plan.durationDays} days
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Project &amp; Simulate Plan
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1B34] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Tier Comparison Table (Hypothetical DEMO Figures)
          </h2>
          <span className="text-xs text-amber-300">Non-guaranteed concept rates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#071426] text-xs text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium text-right">Simulated Amount</th>
                <th className="px-6 py-3 font-medium text-right">Proposed Daily Rate</th>
                <th className="px-6 py-3 font-medium text-right">Hypothetical 1-Day</th>
                <th className="px-6 py-3 font-medium text-right">Hypothetical 30-Day</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {plans.map((p) => {
                const oneDay = (p.amount * p.illustrativeDailyRate) / 100;
                const thirtyDays = oneDay * 30;
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5 font-medium text-white">{p.name}</td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-slate-200">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-emerald-400">
                      {p.illustrativeDailyRate}%
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-slate-300">
                      ${oneDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-slate-300">
                      ${thirtyDays.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPlan(p)}
                        className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                      >
                        Simulate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PlanCalculatorModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
