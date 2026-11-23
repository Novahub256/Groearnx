import React from 'react';
import { AlertTriangle, Layers, Lock, Scale, ShieldCheck } from 'lucide-react';
import { ILLUSTRATIVE_RATES_NOTICE } from '../constants/plans';

export function AboutPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <div className="space-y-4">
        <p className="text-xs font-medium text-emerald-400">About GROEarnX</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
          Transparent Portfolio Simulation &amp; Financial Workflow Architecture
        </h1>
        <p className="text-base text-slate-300 leading-relaxed max-w-3xl">
          GROEarnX is designed to help users explore structured investment tier models, track
          simulated allocations, and manage request-based funding workflows in a clean, mobile-first
          interface built with strict transparency safeguards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            icon: Layers,
            title: 'Structured Operating Model',
            desc: 'The platform separates user portfolio modeling, simulated deposit/withdrawal request workflows, and administrative compliance controls into distinct audited layers.',
          },
          {
            icon: ShieldCheck,
            title: 'Security-First Architecture',
            desc: 'Every user account is protected by email-verified authentication, strict per-user data isolation, server-side rate limiting, idempotency keys, and immutable audit logs.',
          },
          {
            icon: Scale,
            title: 'Honest & Verifiable Disclosures',
            desc: 'GROEarnX makes zero fabricated performance claims, customer counts, or simulated testimonials. Every projected return is explicitly labelled illustrative and hypothetical.',
          },
          {
            icon: Lock,
            title: 'Custody & Compliance Readiness',
            desc: 'Real-money deposits, pooled investment custody, and live payouts remain disabled in this initial DEMO phase pending formal legal and payment-provider authorizations.',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-3"
          >
            <card.icon className="w-6 h-6 text-emerald-400" />
            <h2 className="font-display text-lg font-semibold text-white">{card.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm text-amber-100">
          <p className="font-semibold">Operating Status Disclosure</p>
          <p className="leading-relaxed">{ILLUSTRATIVE_RATES_NOTICE}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/plans')}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
        >
          Explore Proposed Plans
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/contact')}
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          Contact Team
        </button>
      </div>
    </div>
  );
}
