import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '../constants/plans';

export function FaqPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-medium text-emerald-400">Knowledge Base</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          Review how GROEarnX DEMO simulation, account security, and payment architecture work.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.question}
              className="rounded-xl border border-white/10 bg-[#0B1B34] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-white hover:bg-white/[0.03] cursor-pointer"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pt-3 border-t border-white/5 text-sm text-slate-300 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B1B34] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Still have questions?</h2>
          <p className="text-sm text-slate-400">Send an inquiry directly to the GROEarnX team.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/contact')}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}
