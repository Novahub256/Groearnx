import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Clock,
  History,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { markNotificationReadApi } from '../lib/apiClient';
import { formatTimestamp } from '../lib/supabaseService';
import {
  DepositRequest,
  LoginActivity,
  SimulatedInvestment,
  TransactionRecord,
  UserNotification,
  WithdrawalRequest,
} from '../types/platform';

interface DashboardOverviewProps {
  investments: SimulatedInvestment[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  transactions: TransactionRecord[];
  notifications: UserNotification[];
  loginActivity: LoginActivity[];
  onNavigate: (path: string) => void;
}

export function DashboardOverview({
  investments,
  deposits,
  withdrawals,
  transactions,
  notifications,
  loginActivity,
  onNavigate,
}: DashboardOverviewProps) {
  const { profile, triggerDataRefresh } = useAuth();

  const activeInvestments = investments.filter((i) => i.status === 'active');
  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  const simulatedBalance = profile?.simulatedBalance ?? 0;
  const simulatedInvested = useMemo(
    () => activeInvestments.reduce((sum, i) => sum + i.amount, 0),
    [activeInvestments]
  );
  const simulatedEarnings = profile?.simulatedEarnings ?? 0;

  // Build transparent hypothetical chart series from real active positions (not credited as earnings)
  const chartData = useMemo(() => {
    const basePrincipal = simulatedInvested || 0;
    const weightedDaily = activeInvestments.reduce(
      (sum, inv) => sum + (inv.amount * inv.illustrativeDailyRate) / 100,
      0
    );
    return [0, 5, 10, 15, 20, 25, 30].map((day) => ({
      day: `Day ${day}`,
      allocatedPrincipal: Number(basePrincipal.toFixed(2)),
      hypotheticalModel: Number((basePrincipal + weightedDaily * day).toFixed(2)),
    }));
  }, [activeInvestments, simulatedInvested]);

  const summaryCards = [
    {
      label: 'Total Simulated Balance',
      value: `$${simulatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tag: 'DEMO BALANCE',
      icon: Wallet,
      accent: 'text-emerald-400',
    },
    {
      label: 'Simulated Invested Amount',
      value: `$${simulatedInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tag: 'DEMO ALLOCATED',
      icon: BarChart3,
      accent: 'text-sky-400',
    },
    {
      label: 'Simulated Earnings',
      value: `$${simulatedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tag: 'DEMO · NOT CREDITED',
      icon: TrendingUp,
      accent: 'text-slate-300',
    },
    {
      label: 'Active Demo Investments',
      value: String(activeInvestments.length),
      tag: 'DEMO POSITIONS',
      icon: BarChart3,
      accent: 'text-emerald-400',
    },
    {
      label: 'Pending Demo Deposits',
      value: String(pendingDeposits.length),
      tag: `$${pendingDeposits.reduce((s, d) => s + d.amount, 0).toLocaleString()} QUEUED`,
      icon: Clock,
      accent: 'text-amber-400',
    },
    {
      label: 'Pending Demo Withdrawals',
      value: String(pendingWithdrawals.length),
      tag: `$${pendingWithdrawals.reduce((s, w) => s + w.amount, 0).toLocaleString()} QUEUED`,
      icon: ArrowUpFromLine,
      accent: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Illustrative Notice */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3 text-xs text-amber-100">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>DEMO Dashboard:</strong> All balances, positions, and charts below reflect
          database-persisted simulation records only. Hypothetical daily rates are illustrative and
          not credited as real earnings.
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/dashboard/deposit')}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Deposit (DEMO)
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/dashboard/withdraw')}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0B1B34] px-4 py-2.5 text-sm font-semibold text-white hover:border-white/30 transition-colors cursor-pointer"
        >
          <ArrowUpFromLine className="w-4 h-4 text-emerald-400" />
          Withdraw (DEMO)
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/dashboard/plans')}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0B1B34] px-4 py-2.5 text-sm font-semibold text-white hover:border-white/30 transition-colors cursor-pointer"
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Explore Plans
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/dashboard/transactions')}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0B1B34] px-4 py-2.5 text-sm font-semibold text-white hover:border-white/30 transition-colors cursor-pointer"
        >
          <History className="w-4 h-4 text-emerald-400" />
          Transaction History
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-[#0B1B34] p-5 flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-400">{card.label}</p>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">{card.value}</p>
              <p className="text-[11px] font-medium text-amber-300/90 tabular-nums">{card.tag}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#071426] p-2.5">
              <card.icon className={`w-5 h-5 ${card.accent}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Chart + Active Investments */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">
                Illustrative Portfolio Curve (DEMO)
              </h2>
              <p className="text-xs text-slate-400">
                Allocated DEMO principal vs. hypothetical non-guaranteed 30-day model
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-300">HYPOTHETICAL MODEL</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hypoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" strokeOpacity={0.4} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#071426',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="allocatedPrincipal"
                  name="DEMO Principal ($)"
                  stroke="#38BDF8"
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="hypotheticalModel"
                  name="Hypothetical Illustrative ($)"
                  stroke="#22C55E"
                  fill="url(#hypoFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Simulated Investments */}
        <div className="xl:col-span-5 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">
              Active Demo Investments
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard/plans')}
              className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
            >
              + New Simulation
            </button>
          </div>

          {activeInvestments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-[#071426] p-6 text-center space-y-3">
              <p className="text-sm text-slate-300">No active simulated investments yet.</p>
              <p className="text-xs text-slate-400">
                Request a DEMO deposit, wait for admin approval, then allocate into one of the nine
                proposed tiers.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/dashboard/plans')}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 cursor-pointer"
              >
                Browse Plans
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {activeInvestments.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl border border-white/10 bg-[#071426] p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {inv.planName} · <span className="text-amber-300">DEMO</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Illustrative {inv.illustrativeDailyRate}%/day · {formatTimestamp(inv.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                      ${inv.amount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 capitalize">{inv.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions + Notifications + Account Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Recent Transactions</h2>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard/transactions')}
              className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No simulated transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 pr-3 font-medium">Reference</th>
                    <th className="py-2.5 pr-3 font-medium">Type</th>
                    <th className="py-2.5 pr-3 font-medium">Method</th>
                    <th className="py-2.5 pr-3 font-medium text-right">Amount</th>
                    <th className="py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {transactions.slice(0, 6).map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 pr-3 font-mono text-slate-200">{tx.referenceCode}</td>
                      <td className="py-3 pr-3 capitalize text-slate-300">{tx.type} (DEMO)</td>
                      <td className="py-3 pr-3 text-slate-300">{tx.method}</td>
                      <td className="py-3 pr-3 text-right font-mono font-semibold text-white tabular-nums">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right capitalize font-medium text-emerald-300">
                        {tx.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-white">Notifications</h2>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400">No notifications.</p>
            ) : (
              <div className="space-y-2.5 max-h-44 overflow-y-auto">
                {notifications.slice(0, 4).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (!n.read) {
                        void markNotificationReadApi(n.id)
                          .then(() => triggerDataRefresh())
                          .catch(() => {});
                      }
                    }}
                    className="w-full text-left rounded-xl border border-white/10 bg-[#071426] p-3 text-xs space-y-1 hover:border-white/25 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{n.title}</span>
                      {!n.read && <span className="text-emerald-400 font-semibold">Unread</span>}
                    </div>
                    <p className="text-slate-400">{n.message}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-white">Account Activity</h2>
            {loginActivity.length === 0 ? (
              <p className="text-xs text-slate-400">No recent session activity.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {loginActivity.slice(0, 4).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-slate-200 capitalize">
                        {act.eventType.replace('_', ' ')}
                      </p>
                      <p className="text-slate-400">{act.deviceLabel}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 text-right">
                      {formatTimestamp(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
