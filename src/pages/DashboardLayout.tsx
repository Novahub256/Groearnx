import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  MailWarning,
  Menu,
  Shield,
  ShieldAlert,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { markNotificationReadApi } from '../lib/apiClient';
import { formatTimestamp } from '../lib/supabaseService';
import { UserNotification } from '../types/platform';
import { BrandLogo } from '../components/BrandLogo';
import { useToast } from '../components/Toast';

interface DashboardLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  notifications: UserNotification[];
  children: React.ReactNode;
}

export function DashboardLayout({
  currentPath,
  onNavigate,
  notifications,
  children,
}: DashboardLayoutProps) {
  const {
    authUser,
    profile,
    isAdmin,
    emailVerified,
    resendVerificationEmail,
    refreshAuthUser,
    triggerDataRefresh,
    logout,
  } = useAuth();
  const { showToast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Deposit (DEMO)', path: '/dashboard/deposit', icon: ArrowDownToLine },
    { label: 'Withdraw (DEMO)', path: '/dashboard/withdraw', icon: ArrowUpFromLine },
    { label: 'Simulated Plans', path: '/dashboard/plans', icon: BarChart3 },
    { label: 'Transactions', path: '/dashboard/transactions', icon: History },
    { label: 'Referrals', path: '/dashboard/referrals', icon: Users },
    { label: 'Profile & Security', path: '/dashboard/security', icon: UserCog },
  ];

  const handleNav = (path: string) => {
    setSidebarOpen(false);
    onNavigate(path);
  };

  const handleCheckVerification = async () => {
    setVerifying(true);
    try {
      const ok = await refreshAuthUser();
      if (ok) {
        showToast('Email verification confirmed!', 'success');
      } else {
        showToast('Email not yet verified. Please click the link in your inbox.', 'info');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to check verification.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061121] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/10 bg-[#050E1B]">
        <div className="h-16 px-5 flex items-center border-b border-white/10">
          <BrandLogo compact onClick={() => handleNav('/')} />
        </div>

        <div className="px-4 py-3 border-b border-white/10">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            <span className="font-semibold block">DEMO SIMULATION MODE</span>
            <span className="text-amber-100/80">No real-money transfers</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Dashboard menu">
          {navLinks.map((item) => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  currentPath.startsWith('/admin')
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/25'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Admin Console</span>
              </button>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">
              {profile?.fullName || authUser?.displayName || 'Member'}
            </p>
            <p className="text-slate-400 truncate">{authUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout().then(() => onNavigate('/'))}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-[#050E1B] border-r border-white/10 flex flex-col h-full z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
              <BrandLogo compact onClick={() => handleNav('/')} />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navLinks.map((item) => {
                const active = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer ${
                      active
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('/admin')}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-300 border border-emerald-500/30 mt-3 cursor-pointer"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Admin Console</span>
                </button>
              )}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => void logout().then(() => onNavigate('/'))}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Secure Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#061121]/92 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg border border-white/15 p-2 text-slate-200 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-slate-400 truncate">
              <span className="hidden sm:inline">GROEarnX Workspace · </span>
              <span className="font-semibold text-white">
                {navLinks.find((n) => n.path === currentPath)?.label ||
                  (currentPath.startsWith('/admin') ? 'Admin Console' : 'Dashboard')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative">
            <span className="hidden sm:inline font-mono text-xs text-amber-300 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-md">
              DEMO ONLY
            </span>

            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative rounded-lg border border-white/15 p-2 text-slate-200 hover:border-white/30 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 max-w-[90vw] rounded-xl border border-white/15 bg-[#0B1B34] shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/10">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400">No notifications yet.</p>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
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
                        className={`w-full text-left p-3.5 text-xs space-y-1 hover:bg-white/[0.03] cursor-pointer ${
                          n.read ? 'opacity-70' : 'bg-emerald-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white">{n.title}</span>
                          {!n.read && (
                            <span className="text-[10px] text-emerald-400 font-semibold">New</span>
                          )}
                        </div>
                        <p className="text-slate-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatTimestamp(n.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {!emailVerified && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 text-xs text-amber-100">
                <MailWarning className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Email Verification Required</p>
                  <p className="text-amber-100/80 mt-0.5">
                    Verify your email address ({authUser?.email}) to enable simulated
                    deposits, withdrawals, and investment allocations.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    void resendVerificationEmail()
                      .then(() => showToast('Verification email sent.', 'success'))
                      .catch((e) => showToast(e.message, 'error'))
                  }
                  className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 cursor-pointer"
                >
                  Resend Email
                </button>
                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => void handleCheckVerification()}
                  className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 cursor-pointer"
                >
                  {verifying ? 'Checking...' : 'Refresh Status'}
                </button>
              </div>
            </div>
          )}

          {profile?.status === 'suspended' && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3 text-xs text-rose-100">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Account Suspended</p>
                <p className="text-rose-100/80 mt-0.5">
                  Your account has been suspended by an administrator. New simulated investments,
                  deposits, and withdrawals are disabled.
                </p>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
