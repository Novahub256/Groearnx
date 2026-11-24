import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { PlansPage } from './pages/PlansPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPages';
import { AuthPages } from './pages/AuthPages';
import { DashboardLayout } from './pages/DashboardLayout';
import { DashboardOverview } from './pages/DashboardOverview';
import { DepositPage } from './pages/DepositPage';
import { WithdrawalPage } from './pages/WithdrawalPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { ProfileSecurityPage } from './pages/ProfileSecurityPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { fetchDashboardDataApi } from './lib/apiClient';
import {
  DepositRequest,
  LoginActivity,
  ReferralRecord,
  SimulatedInvestment,
  TransactionRecord,
  UserNotification,
  WithdrawalRequest,
} from './types/platform';

function parseHashRoute(): { path: string; params: URLSearchParams } {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return { path, params: new URLSearchParams(queryPart || '') };
}

function AppRouter() {
  const { authUser, loading, dataVersion, setProfile } = useAuth();
  const [route, setRoute] = useState<{ path: string; params: URLSearchParams }>(() =>
    parseHashRoute()
  );

  const [investments, setInvestments] = useState<SimulatedInvestment[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);

  useEffect(() => {
    const onHash = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    // Handle Supabase recovery or email verification callback query/hash params
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type');
    const tokenHash = searchParams.get('token_hash') || searchParams.get('code');
    if (type === 'recovery' && tokenHash) {
      window.location.hash = `#/reset-password?oobCode=${encodeURIComponent(tokenHash)}`;
    } else if (window.location.hash.includes('type=recovery') && window.location.hash.includes('access_token=')) {
      const fragment = window.location.hash.slice(window.location.hash.indexOf('access_token='));
      const fragParams = new URLSearchParams(fragment);
      const token = fragParams.get('access_token');
      if (token) {
        window.location.hash = `#/reset-password?oobCode=${encodeURIComponent(token)}`;
      }
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      setInvestments([]);
      setDeposits([]);
      setWithdrawals([]);
      setTransactions([]);
      setReferrals([]);
      setNotifications([]);
      setLoginActivity([]);
      return;
    }

    let active = true;
    fetchDashboardDataApi()
      .then((data) => {
        if (!active) return;
        setProfile(data.profile);
        setInvestments(data.investments);
        setDeposits(data.deposits);
        setWithdrawals(data.withdrawals);
        setTransactions(data.transactions);
        setReferrals(data.referrals);
        setNotifications(data.notifications);
        setLoginActivity(data.loginActivity);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data from Supabase:', err);
      });

    return () => {
      active = false;
    };
  }, [authUser, dataVersion, setProfile]);

  const navigate = (path: string) => {
    window.location.hash = `#${path}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPath = route.path;
  const isWorkspaceRoute = currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin');

  if (loading && isWorkspaceRoute) {
    return (
      <div className="min-h-screen bg-[#061121] flex items-center justify-center p-6">
        <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-8 max-w-sm w-full space-y-4 animate-pulse">
          <div className="h-5 w-36 bg-white/10 rounded" />
          <div className="h-8 w-full bg-white/10 rounded" />
          <div className="h-24 w-full bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (isWorkspaceRoute) {
    if (!authUser) {
      return (
        <div className="min-h-screen bg-[#061121] flex flex-col">
          <Navbar currentPath={currentPath} onNavigate={navigate} />
          <main className="flex-1">
            <AuthPages mode="login" onNavigate={navigate} />
          </main>
          <Footer onNavigate={navigate} />
        </div>
      );
    }

    return (
      <DashboardLayout
        currentPath={currentPath}
        onNavigate={navigate}
        notifications={notifications}
      >
        {currentPath === '/dashboard' && (
          <DashboardOverview
            investments={investments}
            deposits={deposits}
            withdrawals={withdrawals}
            transactions={transactions}
            notifications={notifications}
            loginActivity={loginActivity}
            onNavigate={navigate}
          />
        )}
        {currentPath === '/dashboard/deposit' && <DepositPage deposits={deposits} />}
        {currentPath === '/dashboard/withdraw' && <WithdrawalPage withdrawals={withdrawals} />}
        {currentPath === '/dashboard/plans' && <PlansPage onNavigate={navigate} />}
        {currentPath === '/dashboard/transactions' && (
          <TransactionsPage transactions={transactions} onNavigate={navigate} />
        )}
        {currentPath === '/dashboard/referrals' && <ReferralsPage referrals={referrals} />}
        {currentPath === '/dashboard/security' && (
          <ProfileSecurityPage loginActivity={loginActivity} />
        )}
        {currentPath.startsWith('/admin') && <AdminDashboardPage onNavigate={navigate} />}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#061121] flex flex-col">
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1">
        {currentPath === '/' && <HomePage onNavigate={navigate} />}
        {currentPath === '/about' && <AboutPage onNavigate={navigate} />}
        {currentPath === '/plans' && <PlansPage onNavigate={navigate} />}
        {currentPath === '/faq' && <FaqPage onNavigate={navigate} />}
        {currentPath === '/contact' && <ContactPage />}
        {currentPath === '/legal/terms' && <LegalPage docType="terms" onNavigate={navigate} />}
        {currentPath === '/legal/privacy' && <LegalPage docType="privacy" onNavigate={navigate} />}
        {currentPath === '/legal/risk' && <LegalPage docType="risk" onNavigate={navigate} />}
        {currentPath === '/legal/disclaimer' && (
          <LegalPage docType="disclaimer" onNavigate={navigate} />
        )}
        {currentPath === '/login' && <AuthPages mode="login" onNavigate={navigate} />}
        {currentPath === '/register' && (
          <AuthPages
            mode="register"
            initialReferralCode={route.params.get('ref') || ''}
            onNavigate={navigate}
          />
        )}
        {currentPath === '/forgot-password' && <AuthPages mode="forgot" onNavigate={navigate} />}
        {currentPath === '/reset-password' && (
          <AuthPages
            mode="reset"
            oobCode={route.params.get('oobCode') || ''}
            onNavigate={navigate}
          />
        )}
        {currentPath === '/verify-email' && <AuthPages mode="verify" onNavigate={navigate} />}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
