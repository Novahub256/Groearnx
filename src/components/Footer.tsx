import React from 'react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#050E1B] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <BrandLogo compact onClick={() => onNavigate('/')} />
            <p className="text-sm text-slate-300 font-medium">
              Grow Smarter. Manage Your Investments.
            </p>
            <p className="text-xs leading-relaxed text-slate-400 max-w-md">
              GROEarnX operates as a portfolio simulation environment. Displayed daily rates are
              hypothetical projections subject to independent verification and legal review. No
              real-money deposits, custody, or payouts are enabled.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/about')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/plans')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Investment Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Legal & Transparency</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/legal/terms')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/legal/privacy')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/legal/risk')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Risk Disclosure
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/legal/disclaimer')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Investment Disclaimer
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GROEarnX. All rights reserved.</p>
          <p>
            Portfolio Simulation Environment · Not licensed, regulated, insured, or audited · No real-money transactions
          </p>
        </div>
      </div>
    </footer>
  );
}
