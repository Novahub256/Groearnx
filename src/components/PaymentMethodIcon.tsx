import React from 'react';
import { PaymentMethod } from '../types/platform';

export function PaymentMethodIcon({ method, className = 'w-6 h-6' }: { method: PaymentMethod; className?: string }) {
  switch (method) {
    case 'Bitcoin (BTC)':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#F7931A" />
          <path
            d="M20.6 14.3c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.6-.4-.7 2.7c-.4-.1-.7-.2-1-.3l-2.3-.6-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 .1.1.1.2.1h-.2l-1.1 4.4c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.7 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.7c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2-3.9.9-5 .7l.9-3.6c1.1.3 4.6.8 4.1 2.9zm.5-5.3c-.5 1.8-3.3.9-4.2.7l.8-3.3c.9.2 3.9.7 3.4 2.6z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case 'USDT':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#26A17B" />
          <path
            d="M17.9 17.3v-.1c-.1 0-.7.1-1.9.1-1 0-1.7-.1-1.9-.1v.1c-3.8-.2-6.6-.9-6.6-1.7 0-.8 2.8-1.5 6.6-1.7v2.7c.2 0 .9.1 1.9.1 1.2 0 1.8-.1 1.9-.1v-2.7c3.8.2 6.6.9 6.6 1.7 0 .8-2.8 1.5-6.6 1.7zm0-3.7v-2.4h5.3V7.9H8.8v3.3h5.3v2.4c-4.3.2-7.5 1.1-7.5 2.1s3.2 1.9 7.5 2.1v7.5h3.8v-7.5c4.3-.2 7.5-1.1 7.5-2.1s-3.2-1.9-7.5-2.1z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case 'PayPal':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <rect x="1" y="1" width="30" height="30" rx="8" fill="#003087" />
          <path
            d="M21.8 10.6c.5 2.7-.8 5.2-3.9 5.9-.6.1-1.4.2-2.2.2h-1.6l-.9 5.5H9.9L12.3 8h5.9c2.2 0 3.3 1 3.6 2.6z"
            fill="#009CDE"
          />
          <path
            d="M19.7 12.6c.4 2.2-.7 4.2-3.3 4.8-.6.1-1.2.2-1.9.2h-1.3l-.9 5.4H9.4l2.2-13.2h5.2c1.8 0 2.7.9 2.9 2.8z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case 'Mobile Money':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <rect x="1" y="1" width="30" height="30" rx="8" fill="#F59E0B" />
          <rect x="10" y="6" width="12" height="20" rx="2.5" fill="#0B1B34" />
          <rect x="12" y="9" width="8" height="11" rx="1" fill="#FDE68A" />
          <circle cx="16" cy="23" r="1.2" fill="#F59E0B" />
        </svg>
      );
    case 'Ethereum (ETH)':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#627EEA" />
          <path d="M16 5.5L9.5 16.2L16 20l6.5-3.8L16 5.5z" fill="#FFFFFF" fillOpacity="0.92" />
          <path d="M16 21.3L9.5 17.5L16 26.5l6.5-9L16 21.3z" fill="#C7D2FE" />
        </svg>
      );
  }
}
