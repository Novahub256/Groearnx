import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { formatTimestamp } from '../lib/supabaseService';
import { TransactionRecord } from '../types/platform';

function toDateMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'string' || typeof ts === 'number') {
    const ms = new Date(ts).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    return Number((ts as { seconds: number }).seconds) * 1000;
  }
  return 0;
}

export function TransactionsPage({ transactions }: { transactions: TransactionRecord[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : 0;
    const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;

    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      const ms = toDateMillis(tx.createdAt);
      if (ms && (ms < fromMs || ms > toMs)) return false;
      if (q) {
        const hay = `${tx.id} ${tx.referenceCode} ${tx.method} ${tx.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Transaction History (DEMO)</h1>
        <p className="text-sm text-slate-400">
          Search, filter, and inspect your simulated deposit, withdrawal, and investment ledger.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search reference, ID, method..."
            className="w-full rounded-lg border border-white/15 bg-[#071426] pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-white/15 bg-[#071426] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
          aria-label="Filter by transaction type"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposit (DEMO)</option>
          <option value="withdrawal">Withdrawal (DEMO)</option>
          <option value="investment">Investment (DEMO)</option>
          <option value="adjustment">Adjustment (DEMO)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-white/15 bg-[#071426] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
          aria-label="Filter by transaction status"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-white/15 bg-[#071426] px-2 py-2 text-[11px] text-white focus:border-emerald-400 focus:outline-none"
            aria-label="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-white/15 bg-[#071426] px-2 py-2 text-[11px] text-white focus:border-emerald-400 focus:outline-none"
            aria-label="To date"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1B34] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#071426] text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3 font-medium">Transaction ID</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Status</th>
                <th className="px-5 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No matching simulated transactions found.
                  </td>
                </tr>
              ) : (
                pageItems.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-mono text-white">{tx.referenceCode}</td>
                    <td className="px-5 py-3.5 capitalize text-slate-200">{tx.type} (DEMO)</td>
                    <td className="px-5 py-3.5 text-slate-300">{tx.method}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-white tabular-nums">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {formatTimestamp(tx.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right capitalize font-semibold">
                      <span
                        className={
                          tx.status === 'approved' || tx.status === 'active'
                            ? 'text-emerald-400'
                            : tx.status === 'rejected'
                              ? 'text-rose-400'
                              : tx.status === 'cancelled'
                                ? 'text-slate-400'
                                : 'text-amber-300'
                        }
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {pageItems.length} of {filtered.length} records
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 p-1.5 text-slate-200 disabled:opacity-40 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-white/10 p-1.5 text-slate-200 disabled:opacity-40 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0B1B34] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">
                Transaction Details (DEMO)
              </h2>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Record ID</span>
                <span className="font-mono text-slate-200">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Reference</span>
                <span className="font-mono text-white">{selectedTx.referenceCode}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Type</span>
                <span className="capitalize text-slate-200">{selectedTx.type} (DEMO)</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Method</span>
                <span className="text-slate-200">{selectedTx.method}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  ${selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Status</span>
                <span className="capitalize font-semibold text-white">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Timestamp</span>
                <span className="text-slate-300">{formatTimestamp(selectedTx.createdAt)}</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="text-slate-400 block mb-1">Description</span>
                <p className="text-slate-200 leading-relaxed">{selectedTx.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
