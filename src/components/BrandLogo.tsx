import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
  onClick?: () => void;
}

export function BrandLogo({ compact = false, onClick }: BrandLogoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
      aria-label="GROEarnX Home"
    >
      <svg
        width={compact ? 30 : 34}
        height={compact ? 30 : 34}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="10"
          fill="#0B1B34"
          stroke="url(#grxBorder)"
          strokeWidth="1.5"
        />
        <rect x="8" y="24" width="5" height="9" rx="1.5" fill="#10B981" fillOpacity="0.6" />
        <rect x="15.5" y="19" width="5" height="14" rx="1.5" fill="#10B981" fillOpacity="0.85" />
        <rect x="23" y="13" width="5" height="20" rx="1.5" fill="#2CE574" />
        <path
          d="M8 21L17.5 14.5L22.5 17L31.5 8.5"
          stroke="#4ADE80"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26.5 8.5H31.5V13.5"
          stroke="#4ADE80"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="grxBorder" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2CE574" stopOpacity="0.55" />
            <stop offset="1" stopColor="#1E3A5F" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">
        GRO<span className="text-emerald-400">EarnX</span>
      </span>
    </button>
  );
}
