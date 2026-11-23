import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Lock,
  ShieldCheck,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { FAQ_ITEMS, ILLUSTRATIVE_RATES_NOTICE, PAYMENT_METHODS } from '../constants/plans';
import { useAuth } from '../context/AuthContext';
import { InvestmentPlan } from '../types/platform';
import { PaymentMethodIcon } from '../components/PaymentMethodIcon';
import { PlanCalculatorModal } from '../components/PlanCalculatorModal';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { plans, announcements, authUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#061121] text-slate-100">
      {/* Active Admin Announcements */}
      {announcements.length > 0 && (
        <div className="border-b border-emerald-500/20 bg-[#0A1F38]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-emerald-300 font-semibold">
              Platform Announcement · {announcements[0].title}
            </span>
            <span className="text-slate-300">{announcements[0].body}</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 75% 30%, rgba(16, 185, 129, 0.16), transparent 52%), radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.08), transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Secure Architecture</span>
                <span aria-hidden="true">·</span>
                <span>Transparent Disclosures</span>
                <span aria-hidden="true">·</span>
                <span>DEMO Simulation Mode</span>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight text-white leading-[1.08]"
                style={{
                  fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)',
                  textWrap: 'balance',
                }}
              >
                Grow Your Financial Future With{' '}
                <span className="text-emerald-400">GROEarnX</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Grow Smarter. Manage Your Investments. Explore structured portfolio tiers, model
                hypothetical daily scenarios, and manage simulated deposits, withdrawals, and
                transaction history in one transparent fintech workspace.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('/plans')}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Explore Plans
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(authUser ? '/dashboard' : '/register')}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  {authUser ? 'Open Dashboard' : 'Create Account'}
                </button>
              </div>
            </div>

            {/* Bespoke SVG Fintech Hero Artwork */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-[#0A1A32]/90 p-6 shadow-2xl">
                <svg
                  viewBox="0 0 460 300"
                  className="w-full h-auto"
                  role="img"
                  aria-label="GROEarnX upward financial growth chart illustration"
                >
                  <defs>
                    <linearGradient id="heroBg" x1="0" y1="0" x2="460" y2="300" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0D2240" />
                      <stop offset="1" stopColor="#071325" />
                    </linearGradient>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#4ADE80" />
                      <stop offset="1" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="coinGold" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#FDE68A" />
                      <stop offset="0.5" stopColor="#F59E0B" />
                      <stop offset="1" stopColor="#B45309" />
                    </linearGradient>
                  </defs>
                  <rect width="460" height="300" rx="16" fill="url(#heroBg)" />
                  {/* Grid lines */}
                  <g stroke="#1E3A5F" strokeOpacity="0.45" strokeWidth="1">
                    <line x1="30" y1="60" x2="430" y2="60" />
                    <line x1="30" y1="120" x2="430" y2="120" />
                    <line x1="30" y1="180" x2="430" y2="180" />
                    <line x1="30" y1="240" x2="430" y2="240" />
                  </g>
                  {/* Rising emerald bars */}
                  <rect x="210" y="195" width="24" height="45" rx="4" fill="#10B981" fillOpacity="0.45" />
                  <rect x="248" y="170" width="24" height="70" rx="4" fill="#10B981" fillOpacity="0.62" />
                  <rect x="286" y="142" width="24" height="98" rx="4" fill="#10B981" fillOpacity="0.78" />
                  <rect x="324" y="112" width="24" height="128" rx="4" fill="url(#barGrad)" />
                  <rect x="362" y="78" width="24" height="162" rx="4" fill="url(#barGrad)" />

                  {/* Rising trajectory arrow */}
                  <path
                    d="M196 196 C250 185, 315 130, 396 58"
                    fill="none"
                    stroke="#4ADE80"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M376 58 L400 54 L394 78"
                    fill="none"
                    stroke="#4ADE80"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Stylized stacked coins & emblem */}
                  <g transform="translate(54, 118)">
                    <ellipse cx="64" cy="116" rx="48" ry="12" fill="#064E3B" fillOpacity="0.55" />
                    <path d="M16 96 v16 a48 12 0 0 0 96 0 v-16" fill="#B45309" />
                    <ellipse cx="64" cy="96" rx="48" ry="12" fill="#F59E0B" />
                    <path d="M16 74 v16 a48 12 0 0 0 96 0 v-16" fill="#D97706" />
                    <ellipse cx="64" cy="74" rx="48" ry="12" fill="#FBBF24" />
                    <path d="M16 52 v16 a48 12 0 0 0 96 0 v-16" fill="#B45309" />
                    <ellipse cx="64" cy="52" rx="48" ry="12" fill="#FDE68A" />
                    <circle cx="72" cy="30" r="36" fill="url(#coinGold)" stroke="#FEF3C7" strokeWidth="2" />
                    <text
                      x="72"
                      y="39"
                      textAnchor="middle"
                      fill="#78350F"
                      fontSize="26"
                      fontWeight="800"
                      fontFamily="Manrope, sans-serif"
                    >
                      $
                    </text>
                  </g>
                </svg>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Simulation Workspace</span>
                  <span className="font-mono text-emerald-400">DEMO MODE ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Plans Preview (All 9 Plans) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-emerald-400 shrink-0" />
              Our Proposed Investment Plans
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select any tier to view hypothetical projections or run a DEMO portfolio simulation.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3.5 py-2 text-xs font-medium text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Daily rates are illustrative and subject to verification.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-white/10 bg-[#0B1B34] p-4 flex flex-col justify-between gap-4 hover:border-emerald-400/50 transition-colors"
            >
              <div className="space-y-1.5 text-center">
                <p className="text-xs font-medium text-slate-300">{plan.name}</p>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">
                  ${plan.amount.toLocaleString()}
                </p>
                <p className="text-xs text-slate-300 tabular-nums">
                  Daily:{' '}
                  <span className="font-semibold text-emerald-400">
                    {plan.illustrativeDailyRate}%
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">Illustrative DEMO</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap cursor-pointer"
              >
                Simulate Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Deposit & Withdrawal Options */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
        <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="shrink-0">
            <h2 className="font-display text-base font-semibold text-white">
              Proposed Deposit &amp; Withdrawal Options
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated request architecture · External providers disabled in DEMO
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
            {PAYMENT_METHODS.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#071426] px-3.5 py-2.5"
              >
                <PaymentMethodIcon method={pm.id} className="w-6 h-6 shrink-0" />
                <span className="text-sm font-medium text-slate-100 whitespace-nowrap truncate">
                  {pm.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works + Why GROEarnX */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">How It Works</h2>
              <p className="text-sm text-slate-400 mt-1">
                Explore the end-to-end portfolio simulation workflow in four transparent steps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  step: '01',
                  title: 'Create Account',
                  desc: 'Register with verified email authentication and security preferences.',
                  icon: UserPlus,
                },
                {
                  step: '02',
                  title: 'Request Demo Funds',
                  desc: 'Submit a simulated deposit request across five proposed payment channels.',
                  icon: Wallet,
                },
                {
                  step: '03',
                  title: 'Select a Tier',
                  desc: 'Allocate your DEMO balance into any of the nine illustrative tiers.',
                  icon: BarChart3,
                },
                {
                  step: '04',
                  title: 'Track Ledger',
                  desc: 'Review history, test balance-checked withdrawals, and inspect audit logs.',
                  icon: Lock,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-white/10 bg-[#071426] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      Step {item.step}
                    </span>
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0B1B34] p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-white">Platform Safeguards</h2>
              <ul className="space-y-3 text-sm text-slate-300">
                {[
                  'Server-validated simulation calculations',
                  'Five proposed payment method workflows',
                  'Strict PII isolation & email verification',
                  'Balance-checked DEMO withdrawal requests',
                  'Full audit logging & admin review queue',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(authUser ? '/dashboard' : '/register')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Get Started Today
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">
            Clear answers on DEMO simulation status, security architecture, and payment readiness.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-white/10 bg-[#0B1B34] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm sm:text-base font-semibold text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Risk Disclosure Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-2">
          <h2 className="font-display text-base font-bold text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            Risk Disclosure &amp; Regulatory Status
          </h2>
          <p className="text-sm text-amber-100/90 leading-relaxed">
            {ILLUSTRATIVE_RATES_NOTICE} GROEarnX does not claim to be licensed, regulated, insured,
            or audited. Real customer deposits, pooled capital custody, and live payouts remain
            disabled until independent legal authorizations, custody arrangements, compliance
            controls, and payment-provider approvals are formally established.
          </p>
        </div>
      </section>

      <PlanCalculatorModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
