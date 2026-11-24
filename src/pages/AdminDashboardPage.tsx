import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Ban,
  BellPlus,
  CheckCircle2,
  Eye,
  Megaphone,
  Search,
  Settings,
  Shield,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  adminCreateAnnouncementApi,
  adminReviewDepositApi,
  adminReviewWithdrawalApi,
  adminSendNotificationApi,
  adminSetUserStatusApi,
  adminToggleAnnouncementApi,
  adminTogglePlanVisibilityApi,
  adminUpdateSettingsApi,
  fetchAdminOverviewApi,
  fetchAdminPolicyStatus,
} from '../lib/apiClient';
import { formatTimestamp } from '../lib/supabaseService';
import {
  AuditLog,
  DepositRequest,
  InvestmentPlan,
  PlatformAnnouncement,
  PlatformSettings,
  SimulatedInvestment,
  UserProfile,
  WithdrawalRequest,
} from '../types/platform';
import { useToast } from '../components/Toast';

type AdminTab = 'overview' | 'users' | 'requests' | 'investments' | 'content' | 'audit';

export function AdminDashboardPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const {
    authUser,
    isAdmin,
    plans,
    announcements,
    platformSettings,
    refreshPublicData,
    triggerDataRefresh,
  } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [investments, setInvestments] = useState<SimulatedInvestment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminAnnouncements, setAdminAnnouncements] = useState<PlatformAnnouncement[]>(announcements);
  const [policyStatus, setPolicyStatus] = useState<{
    authorizedAdmin: string;
    realMoneyOperations: string;
    rateLimitActiveBuckets: number;
    idempotencyActiveKeys: number;
  } | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Announcements & Notifications
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annSeverity, setAnnSeverity] = useState<'info' | 'notice' | 'warning'>('info');
  const [notifTargetUid, setNotifTargetUid] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  // Editable settings
  const [settingsDraft, setSettingsDraft] = useState<PlatformSettings>(platformSettings);

  useEffect(() => {
    setSettingsDraft(platformSettings);
  }, [platformSettings]);

  const loadAdminOverview = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [overview, policy] = await Promise.all([
        fetchAdminOverviewApi(),
        fetchAdminPolicyStatus().catch(() => null),
      ]);
      setUsers(overview.users);
      setDeposits(overview.deposits);
      setWithdrawals(overview.withdrawals);
      setInvestments(overview.investments);
      setAuditLogs(overview.auditLogs);
      setAdminAnnouncements(overview.announcements);
      if (overview.settings) setSettingsDraft(overview.settings);
      setPolicyStatus(policy);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load admin overview.', 'error');
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    void loadAdminOverview();
  }, [loadAdminOverview]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.fullName} ${u.email} ${u.uid} ${u.referralCode}`.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-8 text-center space-y-4">
        <Shield className="w-8 h-8 text-rose-400 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-white">Administrator Access Required</h1>
        <p className="text-sm text-rose-100 max-w-md mx-auto">
          Access to this console is enforced on both the backend API and Supabase Row Level Security.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/dashboard')}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 cursor-pointer"
        >
          Return to User Dashboard
        </button>
      </div>
    );
  }

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const totalSimulatedInvestments = investments.reduce((s, i) => s + i.amount, 0);
  const totalSimulatedDeposits = deposits
    .filter((d) => d.status === 'approved')
    .reduce((s, d) => s + d.amount, 0);
  const totalSimulatedWithdrawals = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((s, w) => s + w.amount, 0);

  const handleReviewDeposit = async (depositId: string, decision: 'approved' | 'rejected') => {
    if (!authUser) return;
    setProcessingId(depositId);
    try {
      await adminReviewDepositApi(depositId, decision, adminNotes[depositId] || '');
      await loadAdminOverview();
      triggerDataRefresh();
      showToast(`Payment request ${decision}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to process deposit.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewWithdrawal = async (
    withdrawalId: string,
    decision: 'approved' | 'rejected'
  ) => {
    if (!authUser) return;
    setProcessingId(withdrawalId);
    try {
      await adminReviewWithdrawalApi(withdrawalId, decision, adminNotes[withdrawalId] || '');
      await loadAdminOverview();
      triggerDataRefresh();
      showToast(`Withdrawal request ${decision}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to process withdrawal.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    if (!authUser) return;
    if (user.uid === authUser.id) {
      showToast('You cannot suspend your own administrator account.', 'error');
      return;
    }
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await adminSetUserStatusApi(user.uid, nextStatus);
      await loadAdminOverview();
      showToast(`User account ${nextStatus}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const handleTogglePlanVisibility = async (plan: InvestmentPlan) => {
    if (!authUser) return;
    try {
      await adminTogglePlanVisibilityApi(plan.id, !plan.isVisible);
      await Promise.all([loadAdminOverview(), refreshPublicData()]);
      showToast(`${plan.name} visibility updated.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update plan.', 'error');
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    try {
      await adminCreateAnnouncementApi({
        title: annTitle,
        body: annBody,
        severity: annSeverity,
      });
      setAnnTitle('');
      setAnnBody('');
      await Promise.all([loadAdminOverview(), refreshPublicData()]);
      showToast('Platform announcement published.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to publish.', 'error');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !notifTargetUid) return;
    try {
      await adminSendNotificationApi({
        targetUid: notifTargetUid,
        title: notifTitle,
        message: notifBody,
      });
      setNotifTitle('');
      setNotifBody('');
      await loadAdminOverview();
      triggerDataRefresh();
      showToast('Notification dispatched to user.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send notification.', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    try {
      await adminUpdateSettingsApi(settingsDraft);
      await Promise.all([loadAdminOverview(), refreshPublicData()]);
      showToast('Platform settings saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings.', 'error');
    }
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'requests',
      label: `Requests (${pendingDeposits.length + pendingWithdrawals.length})`,
    },
    { id: 'users', label: `Users (${users.length})` },
    { id: 'investments', label: `Sim Investments (${investments.length})` },
    { id: 'content', label: 'Plans & Notices' },
    { id: 'audit', label: 'Audit & Settings' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-400">PROTECTED ADMIN CONSOLE</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            GROEarnX Administration
          </h1>
        </div>
        {policyStatus && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
            Backend Verified: <strong>{policyStatus.authorizedAdmin}</strong> · Real Money:{' '}
            <strong>{policyStatus.realMoneyOperations}</strong>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === t.id
                ? 'bg-emerald-500 text-slate-950'
                : 'border border-white/10 bg-[#0B1B34] text-slate-300 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Registered Users', val: String(users.length), sub: `${activeUsersCount} active` },
              { label: 'Pending Requests', val: String(pendingDeposits.length + pendingWithdrawals.length), sub: `${pendingDeposits.length} payment · ${pendingWithdrawals.length} withdrawal` },
              { label: 'Simulated Investments', val: `$${totalSimulatedInvestments.toLocaleString()}`, sub: `${investments.length} total positions` },
              { label: 'Approved Payment Requests', val: `$${totalSimulatedDeposits.toLocaleString()}`, sub: 'Illustrative credit ledger' },
              { label: 'Approved Withdrawal Requests', val: `$${totalSimulatedWithdrawals.toLocaleString()}`, sub: 'Simulated payout ledger' },
              { label: 'Recorded Audit Events', val: String(auditLogs.length), sub: 'Immutable admin & user trail' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-white/10 bg-[#0B1B34] p-5 space-y-1"
              >
                <p className="text-xs text-slate-400">{kpi.label}</p>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">{kpi.val}</p>
                <p className="text-[11px] text-emerald-400">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Platform Activity
            </h2>
            <div className="space-y-2.5 text-xs">
              {auditLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-2.5 last:border-0"
                >
                  <div>
                    <span className="font-mono text-emerald-400 mr-2">{log.action}</span>
                    <span className="text-slate-200">{log.details}</span>
                  </div>
                  <span className="text-slate-400 shrink-0">
                    {log.actorEmail} · {formatTimestamp(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT & WITHDRAWAL REQUESTS */}
      {tab === 'requests' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Payment Requests ({deposits.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {deposits.length === 0 ? (
                <p className="text-xs text-slate-400">No payment requests recorded.</p>
              ) : (
                deposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{dep.referenceCode}</span>
                      <span
                        className={`capitalize font-semibold ${
                          dep.status === 'pending'
                            ? 'text-amber-300'
                            : dep.status === 'approved'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>{dep.method} · User: {dep.userId.slice(0, 10)}...</span>
                      <span className="font-mono text-base font-bold text-white tabular-nums">
                        ${dep.amount.toLocaleString()}
                      </span>
                    </div>
                    {dep.status === 'pending' ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="Optional admin note..."
                          value={adminNotes[dep.id] || ''}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [dep.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#0B1B34] px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={processingId === dep.id}
                            onClick={() => void handleReviewDeposit(dep.id, 'approved')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={processingId === dep.id}
                            onClick={() => void handleReviewDeposit(dep.id, 'rejected')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-1.5 font-semibold text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      dep.adminNote && (
                        <p className="text-slate-400">Note: {dep.adminNote}</p>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Withdrawal Requests ({withdrawals.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {withdrawals.length === 0 ? (
                <p className="text-xs text-slate-400">No withdrawal requests recorded.</p>
              ) : (
                withdrawals.map((wdr) => (
                  <div
                    key={wdr.id}
                    className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{wdr.referenceCode}</span>
                      <span
                        className={`capitalize font-semibold ${
                          wdr.status === 'pending'
                            ? 'text-amber-300'
                            : wdr.status === 'approved'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                        }`}
                      >
                        {wdr.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>{wdr.method} · Dest: {wdr.destinationDetails}</span>
                      <span className="font-mono text-base font-bold text-white tabular-nums">
                        ${wdr.amount.toLocaleString()}
                      </span>
                    </div>
                    {wdr.status === 'pending' ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="Optional admin note..."
                          value={adminNotes[wdr.id] || ''}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [wdr.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#0B1B34] px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={processingId === wdr.id}
                            onClick={() => void handleReviewWithdrawal(wdr.id, 'approved')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={processingId === wdr.id}
                            onClick={() => void handleReviewWithdrawal(wdr.id, 'rejected')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-1.5 font-semibold text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      wdr.adminNote && (
                        <p className="text-slate-400">Note: {wdr.adminNote}</p>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name, email, UID, or referral code..."
              className="w-full rounded-lg border border-white/15 bg-[#0B1B34] pl-9 pr-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#071426] text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3 font-medium">Member</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium text-right">Illustrative Balance</th>
                    <th className="px-5 py-3 font-medium text-right">Simulated Invested</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-medium text-white">{u.fullName}</td>
                      <td className="px-5 py-3.5 text-slate-300">{u.email}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-emerald-400 tabular-nums">
                        ${u.simulatedBalance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-200 tabular-nums">
                        ${u.simulatedInvested.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 capitalize">
                        <span
                          className={
                            u.status === 'active' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectedUser(u)}
                          className="inline-flex items-center gap-1 text-sky-300 hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleUserStatus(u)}
                          className={`inline-flex items-center gap-1 hover:underline cursor-pointer ${
                            u.status === 'active' ? 'text-rose-300' : 'text-emerald-300'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATED INVESTMENTS */}
      {tab === 'investments' && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1B34] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#071426] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3 font-medium">Investment ID</th>
                  <th className="px-5 py-3 font-medium">User UID</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Illustrative Rate</th>
                  <th className="px-5 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {investments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No simulated investments yet.
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-5 py-3 font-mono text-white">{inv.id}</td>
                      <td className="px-5 py-3 font-mono text-slate-300">{inv.userId}</td>
                      <td className="px-5 py-3 text-slate-200">{inv.planName}</td>
                      <td className="px-5 py-3 text-right font-mono text-emerald-400 tabular-nums">
                        ${inv.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-300 tabular-nums">
                        {inv.illustrativeDailyRate}% / day
                      </td>
                      <td className="px-5 py-3 text-right capitalize text-emerald-300">
                        {inv.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLANS, ANNOUNCEMENTS & NOTIFICATIONS */}
      {tab === 'content' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Investment Plan Display Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-[#071426] p-4 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {p.name} (${p.amount.toLocaleString()})
                    </p>
                    <p className="text-slate-400">Illustrative {p.illustrativeDailyRate}%/day</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleTogglePlanVisibility(p)}
                    className={`rounded-lg px-3 py-1.5 font-semibold cursor-pointer ${
                      p.isVisible
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {p.isVisible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={(e) => void handlePublishAnnouncement(e)}
              className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" />
                Publish Website Announcement
              </h2>
              <input
                type="text"
                required
                maxLength={120}
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Announcement headline"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:outline-none"
              />
              <textarea
                required
                rows={3}
                maxLength={600}
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="Announcement message..."
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:outline-none"
              />
              <select
                value={annSeverity}
                onChange={(e) => setAnnSeverity(e.target.value as 'info' | 'notice' | 'warning')}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-xs text-white"
              >
                <option value="info">Info</option>
                <option value="notice">Notice</option>
                <option value="warning">Warning</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                Publish Announcement
              </button>

              {adminAnnouncements.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                  {adminAnnouncements.map((a: PlatformAnnouncement) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-[#071426] px-3 py-2"
                    >
                      <span className="truncate text-slate-200">{a.title}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!authUser) return;
                          void adminToggleAnnouncementApi(a.id, !a.isActive)
                            .then(() => Promise.all([loadAdminOverview(), refreshPublicData()]))
                            .catch((err) =>
                              showToast(
                                err instanceof Error ? err.message : 'Unable to toggle notice.',
                                'error'
                              )
                            );
                        }}
                        className="text-amber-300 hover:underline shrink-0 cursor-pointer"
                      >
                        {a.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <form
              onSubmit={(e) => void handleSendNotification(e)}
              className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <BellPlus className="w-5 h-5 text-emerald-400" />
                Send User Notification
              </h2>
              <select
                required
                value={notifTargetUid}
                onChange={(e) => setNotifTargetUid(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-xs text-white"
              >
                <option value="">Select target user...</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                maxLength={120}
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:outline-none"
              />
              <textarea
                required
                rows={3}
                maxLength={500}
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Notification message..."
                className="w-full rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2 text-sm text-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                Send Notification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT & PLATFORM SETTINGS */}
      {tab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => void handleSaveSettings(e)}
            className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Platform Configuration
            </h2>
            <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
              <span>Enable Payment Requests</span>
              <input
                type="checkbox"
                checked={settingsDraft.depositsEnabled}
                onChange={(e) =>
                  setSettingsDraft((s) => ({ ...s, depositsEnabled: e.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
              <span>Enable Withdrawal Requests</span>
              <input
                type="checkbox"
                checked={settingsDraft.withdrawalsEnabled}
                onChange={(e) =>
                  setSettingsDraft((s) => ({ ...s, withdrawalsEnabled: e.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
              <span>Enable Simulated Plan Allocations</span>
              <input
                type="checkbox"
                checked={settingsDraft.investmentsEnabled}
                onChange={(e) =>
                  setSettingsDraft((s) => ({ ...s, investmentsEnabled: e.target.checked }))
                }
              />
            </label>
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-300">Illustrative Disclosure Copy</label>
              <textarea
                rows={4}
                maxLength={400}
                value={settingsDraft.illustrativeNotice}
                onChange={(e) =>
                  setSettingsDraft((s) => ({ ...s, illustrativeNotice: e.target.value }))
                }
                className="w-full rounded-lg border border-white/15 bg-[#071426] p-3 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              Save Platform Settings
            </button>
          </form>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-white">Immutable Audit Logs</h2>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-white/10 bg-[#071426] p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-emerald-400">{log.action}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-200">{log.details}</p>
                  <p className="text-[11px] text-slate-500">
                    Actor: {log.actorEmail} · Target: {log.targetType}/{log.targetId}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Inspection Modal */}
      {inspectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0B1B34] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Member Profile
              </h2>
              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Full Name</span>
                <span className="text-white font-semibold">{inspectedUser.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-200">{inspectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone</span>
                <span className="text-slate-200">{inspectedUser.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Referral Code</span>
                <span className="font-mono text-emerald-400">{inspectedUser.referralCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Illustrative Balance</span>
                <span className="font-mono text-white">
                  ${inspectedUser.simulatedBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Simulated Invested</span>
                <span className="font-mono text-white">
                  ${inspectedUser.simulatedInvested.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Status</span>
                <span className="capitalize font-semibold text-white">{inspectedUser.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
