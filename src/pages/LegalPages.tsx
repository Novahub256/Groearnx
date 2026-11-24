import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ILLUSTRATIVE_RATES_NOTICE } from '../constants/plans';

export type LegalDocType = 'terms' | 'privacy' | 'risk' | 'disclaimer';

export function LegalPage({
  docType,
  onNavigate,
}: {
  docType: LegalDocType;
  onNavigate: (path: string) => void;
}) {
  const tabs: { id: LegalDocType; label: string; path: string }[] = [
    { id: 'terms', label: 'Terms & Conditions', path: '/legal/terms' },
    { id: 'privacy', label: 'Privacy Policy', path: '/legal/privacy' },
    { id: 'risk', label: 'Risk Disclosure', path: '/legal/risk' },
    { id: 'disclaimer', label: 'Investment Disclaimer', path: '/legal/disclaimer' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onNavigate(t.path)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              docType === t.id
                ? 'bg-emerald-500 text-slate-950'
                : 'border border-white/10 bg-[#0B1B34] text-slate-300 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0B1B34] p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>{ILLUSTRATIVE_RATES_NOTICE}</span>
      </div>

      {docType === 'terms' && (
        <article className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 sm:p-8 space-y-5 text-sm text-slate-300 leading-relaxed">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Terms and Conditions
          </h1>
          <p>
            By creating an account or accessing GROEarnX, you acknowledge that the platform
            currently operates exclusively as a portfolio simulation environment. No real-money
            investment contracts, custody services, live payment settlements, or regulated
            financial advice are provided.
          </p>
          <h2 className="font-display text-lg font-semibold text-white">
            1. Simulation Architecture &amp; Record Definitions
          </h2>
          <p>
            All portfolio figures and ledger entries inside GROEarnX represent simulated test
            records designed to model financial workflows:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>
              <strong className="text-white">Illustrative balance:</strong> Account balances reflect
              database-persisted simulation credits and do not represent cash, cryptocurrency, or
              custodial funds held on your behalf.
            </li>
            <li>
              <strong className="text-white">Simulated investment:</strong> Plan allocations model
              capital deployment across nine illustrative tiers without purchasing underlying
              securities or generating live investment yields.
            </li>
            <li>
              <strong className="text-white">Payment request:</strong> Deposit submissions generate
              internal reference codes for administrative workflow testing. No blockchain wallet
              addresses, external checkout links, or real-money charges occur.
            </li>
            <li>
              <strong className="text-white">Withdrawal request:</strong> Withdrawal submissions
              validate against your illustrative balance and require administrative review without
              initiating external bank, PayPal, mobile money, or blockchain transfers.
            </li>
            <li>
              <strong className="text-white">Hypothetical projection:</strong> Plan calculators and
              trajectory curves reflect mathematical models using proposed daily rates and do not
              guarantee actual earnings or future returns.
            </li>
          </ul>
          <h2 className="font-display text-lg font-semibold text-white">
            2. Account Security &amp; Acceptable Use
          </h2>
          <p>
            Users must provide accurate registration details, verify their email address, and
            refrain from attempting unauthorized access, automated abuse, or tampering with
            simulated ledger balances.
          </p>
          <h2 className="font-display text-lg font-semibold text-white">
            3. Custody &amp; Separation of Future Services
          </h2>
          <p>
            Real customer deposits, pooled investment management, and real payouts remain disabled
            until legal authorizations, independent custody arrangements, and payment-provider
            approvals are formally established. Should software subscription tiers be introduced in
            the future, subscription fees will remain strictly separated from any client
            investment capital.
          </p>
        </article>
      )}

      {docType === 'privacy' && (
        <article className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 sm:p-8 space-y-5 text-sm text-slate-300 leading-relaxed">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Privacy Policy</h1>
          <p>
            GROEarnX collects only the information necessary to authenticate your account, isolate
            your personal portfolio simulation data, and maintain security audit logs.
          </p>
          <h2 className="font-display text-lg font-semibold text-white">1. Data Collected</h2>
          <p>
            Registration stores your full name, email address, phone number, referral code
            association, login activity metadata, and simulated portfolio records. Passwords are
            never stored in plaintext.
          </p>
          <h2 className="font-display text-lg font-semibold text-white">2. Access Controls</h2>
          <p>
            Strict per-user database security rules isolate personal identifiable information (PII)
            so other users cannot read or modify your profile, transactions, or requests.
          </p>
        </article>
      )}

      {docType === 'risk' && (
        <article className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 sm:p-8 space-y-5 text-sm text-slate-300 leading-relaxed">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Risk Disclosure
          </h1>
          <p>
            Financial investments carry significant risk of capital loss, volatility, liquidity
            constraints, and regulatory uncertainty. Past or hypothetical returns do not guarantee
            future performance.
          </p>
          <h2 className="font-display text-lg font-semibold text-white">
            1. Hypothetical Projections &amp; Unverified Rates
          </h2>
          <p>
            The daily percentage figures displayed across the nine plan tiers (5% to 15% daily)
            are hypothetical projection inputs supplied for platform modeling. They are unverified,
            not guaranteed, and should not be interpreted as sustainable real-world yields or
            verified investment returns.
          </p>
          <h2 className="font-display text-lg font-semibold text-white">
            2. Simulation Status &amp; Payment Request Safeguards
          </h2>
          <p>
            GROEarnX does not currently custody funds, execute live market trades, generate live
            deposit wallet addresses, or process external payouts. Illustrative balances, simulated
            investments, payment requests, and withdrawal requests exist exclusively inside the
            platform ledger to demonstrate tracking, approval queues, and balance validation logic.
          </p>
          <h2 className="font-display text-lg font-semibold text-white">
            3. Regulatory Status
          </h2>
          <p>
            GROEarnX does not claim to be licensed, regulated, insured, or audited. Real-money
            functionality will not be activated without independent legal authorization, verified
            custody partners, and regulatory compliance controls.
          </p>
        </article>
      )}

      {docType === 'disclaimer' && (
        <article className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 sm:p-8 space-y-5 text-sm text-slate-300 leading-relaxed">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Investment Disclaimer
          </h1>
          <p>
            GROEarnX is not a licensed broker-dealer, registered investment adviser, bank, or
            regulated custodian. GROEarnX does not claim to be licensed, regulated, insured, or
            audited.
          </p>
          <p>
            Nothing on this website constitutes investment, tax, or legal advice. All calculators,
            charts, illustrative balances, and dashboards present portfolio simulations and
            hypothetical projections only.
          </p>
        </article>
      )}
    </div>
  );
}
