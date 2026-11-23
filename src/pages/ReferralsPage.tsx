import React, { useState } from 'react';
import { Check, Copy, Info, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatTimestamp } from '../lib/supabaseService';
import { ReferralRecord } from '../types/platform';
import { useToast } from '../components/Toast';

export function ReferralsPage({ referrals }: { referrals: ReferralRecord[] }) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const code = profile?.referralCode || 'PENDING';
  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/#/register?ref=${code}`
      : `https://groearnx.app/#/register?ref=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast('Referral link copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy automatically. Please copy the link manually.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-sm text-slate-400">
          Share your unique code to track invited sign-ups in your network log.
        </p>
      </div>

      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 flex items-start gap-3 text-xs text-sky-100 leading-relaxed">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <span>
          <strong>Compliance Notice:</strong> Referral tracking currently records invited
          registrations only. No cash bonuses, commissions, or balance credits are issued unless a
          legally approved reward structure is configured.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-5 space-y-1">
          <span className="text-xs text-slate-400">Your Unique Referral Code</span>
          <p className="font-mono text-2xl font-bold text-emerald-400">{code}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-5 space-y-1">
          <span className="text-xs text-slate-400">Total Referrals</span>
          <p className="font-mono text-2xl font-bold text-white tabular-nums">
            {referrals.length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-5 space-y-1">
          <span className="text-xs text-slate-400">Verified Referrals</span>
          <p className="font-mono text-2xl font-bold text-white tabular-nums">
            {referrals.filter((r) => r.status === 'verified').length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 space-y-3">
        <label htmlFor="ref-link-box" className="block text-xs font-semibold text-slate-300">
          Shareable Referral Link
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="ref-link-box"
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded-lg border border-white/15 bg-[#071426] px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Referral Link'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B1B34] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h2 className="font-display text-base font-semibold text-white">Referral History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#071426] text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-medium">Invited Member</th>
                <th className="px-6 py-3 font-medium">Code Used</th>
                <th className="px-6 py-3 font-medium">Registered Date</th>
                <th className="px-6 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No referrals recorded yet. Share your link above to invite members.
                  </td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-3.5 font-medium text-white">
                      {r.referredDisplayName}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-300">{r.referralCode}</td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {formatTimestamp(r.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-right capitalize font-semibold text-emerald-400">
                      {r.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
