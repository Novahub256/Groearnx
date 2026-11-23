import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CANONICAL_PLANS, ILLUSTRATIVE_RATES_NOTICE } from '../constants/plans';
import {
  AuthSessionUser,
  changePasswordApi,
  completePasswordResetApi,
  fetchAuthSessionApi,
  fetchPublicBootstrap,
  getAuthToken,
  loginUserApi,
  logoutUserApi,
  registerUserApi,
  requestPasswordResetApi,
  resendVerificationApi,
  setAuthToken,
  verifyPasswordApi,
} from '../lib/apiClient';
import {
  InvestmentPlan,
  PlatformAnnouncement,
  PlatformSettings,
  UserProfile,
} from '../types/platform';

interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}

interface AuthContextValue {
  authUser: AuthSessionUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  emailVerified: boolean;
  supabaseConfigured: boolean;
  schemaReady: boolean;
  pendingVerificationEmail: string;
  dataVersion: number;
  plans: InvestmentPlan[];
  announcements: PlatformAnnouncement[];
  platformSettings: PlatformSettings;
  registerWithEmail: (input: RegisterInput) => Promise<{ needsEmailConfirmation: boolean }>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  completePasswordReset: (token: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  reauthenticateForSensitiveAction: (currentPassword?: string) => Promise<void>;
  refreshPublicData: () => Promise<void>;
  triggerDataRefresh: () => void;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [dataVersion, setDataVersion] = useState(0);

  const [plans, setPlans] = useState<InvestmentPlan[]>(CANONICAL_PLANS);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    id: 'global',
    demoModeOnly: true,
    depositsEnabled: true,
    withdrawalsEnabled: true,
    investmentsEnabled: true,
    illustrativeNotice: ILLUSTRATIVE_RATES_NOTICE,
  });

  const refreshPublicData = useCallback(async () => {
    try {
      const boot = await fetchPublicBootstrap();
      setSupabaseConfigured(boot.supabaseConfigured);
      setSchemaReady(boot.schemaReady ?? true);
      if (boot.plans?.length) setPlans(boot.plans);
      setAnnouncements(boot.announcements || []);
      if (boot.settings) setPlatformSettings(boot.settings);
    } catch {
      // Keep canonical defaults if public bootstrap fails transiently
    }
  }, []);

  const triggerDataRefresh = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function initSession() {
      await refreshPublicData();

      // Capture Supabase email confirmation / magic-link access_token from URL hash if present
      const hash = window.location.hash;
      const hashQueryIdx = hash.indexOf('access_token=');
      if (hashQueryIdx !== -1 && !hash.includes('type=recovery')) {
        const fragmentParams = new URLSearchParams(hash.slice(hashQueryIdx));
        const token = fragmentParams.get('access_token');
        if (token) {
          setAuthToken(token);
          try {
            const session = await fetchAuthSessionApi(token);
            if (active && session?.user) {
              setAuthUser(session.user);
              setProfile(session.profile ?? null);
              setIsAdmin(Boolean(session.isAdmin));
              setEmailVerified(Boolean(session.user.emailVerified));
            } else if (active) {
              setAuthToken(null);
            }
          } catch {
            setAuthToken(null);
          }
        }
      }

      if (active) setLoading(false);
    }

    void initSession();
    return () => {
      active = false;
    };
  }, [refreshPublicData]);

  const registerWithEmail = async (input: RegisterInput) => {
    const cleanEmail = input.email.trim().toLowerCase();
    const res = await registerUserApi({
      fullName: input.fullName.trim(),
      email: cleanEmail,
      phone: input.phone.trim(),
      password: input.password,
      referralCode: input.referralCode,
    });

    setPendingVerificationEmail(cleanEmail);
    if (res?.accessToken && res?.user) {
      setAuthToken(res.accessToken);
      setAuthUser(res.user);
      setProfile(res.profile ?? null);
      setIsAdmin(Boolean(res.isAdmin));
      setEmailVerified(Boolean(res.user.emailVerified));
      triggerDataRefresh();
    }
    return { needsEmailConfirmation: Boolean(res?.needsEmailConfirmation) };
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await loginUserApi(email.trim(), password);
    if (!res?.user || !res?.accessToken) {
      throw new Error('Authentication server returned an incomplete session response.');
    }
    setAuthToken(res.accessToken);
    setAuthUser(res.user);
    setProfile(res.profile ?? null);
    setIsAdmin(Boolean(res.isAdmin));
    setEmailVerified(Boolean(res.user.emailVerified));
    setPendingVerificationEmail(res.user.email || email.trim());
    triggerDataRefresh();
  };

  const logout = async () => {
    await logoutUserApi();
    setAuthToken(null);
    setAuthUser(null);
    setProfile(null);
    setIsAdmin(false);
    setEmailVerified(false);
    setPendingVerificationEmail('');
    triggerDataRefresh();
  };

  const requestPasswordReset = async (email: string) => {
    await requestPasswordResetApi(email.trim());
  };

  const completePasswordReset = async (tokenOrCode: string, newPassword: string) => {
    // Support either JWT accessToken from Supabase recovery redirect or token_hash
    if (tokenOrCode.split('.').length === 3) {
      await completePasswordResetApi({ accessToken: tokenOrCode, newPassword });
    } else {
      await completePasswordResetApi({ tokenHash: tokenOrCode, newPassword });
    }
  };

  const resendVerificationEmail = async () => {
    const targetEmail = authUser?.email || pendingVerificationEmail;
    if (!targetEmail) {
      throw new Error('Please sign in or enter your email address first.');
    }
    await resendVerificationApi(targetEmail);
  };

  const refreshAuthUser = async (): Promise<boolean> => {
    if (!getAuthToken()) return false;
    const session = await fetchAuthSessionApi();
    if (!session?.user) {
      return false;
    }
    setAuthUser(session.user);
    setProfile(session.profile ?? null);
    setIsAdmin(Boolean(session.isAdmin));
    setEmailVerified(Boolean(session.user.emailVerified));
    triggerDataRefresh();
    return Boolean(session.user.emailVerified);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await changePasswordApi(currentPassword, newPassword);
    triggerDataRefresh();
  };

  const reauthenticateForSensitiveAction = async (currentPassword?: string) => {
    if (!currentPassword) {
      throw new Error('Please enter your current password to confirm this action.');
    }
    await verifyPasswordApi(currentPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        profile,
        isAdmin,
        loading,
        emailVerified,
        supabaseConfigured,
        schemaReady,
        pendingVerificationEmail,
        dataVersion,
        plans,
        announcements,
        platformSettings,
        registerWithEmail,
        loginWithEmail,
        logout,
        requestPasswordReset,
        completePasswordReset,
        resendVerificationEmail,
        refreshAuthUser,
        changePassword,
        reauthenticateForSensitiveAction,
        refreshPublicData,
        triggerDataRefresh,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
