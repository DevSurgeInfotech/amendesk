import React from 'react';

export interface CardIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Total Collections & Inflows Icon
 * Multi-layer revenue vault with stacked Ghanaian currency and upward flow spark.
 */
export function TotalCollectionsIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <rect x="2" y="6" width="20" height="13" rx="2.5" />
      <path d="M2 10.5h20" />
      <circle cx="6.5" cy="15" r="1.25" fill="currentColor" />
      <path d="M11 15h7" />
      {/* Upward collection dynamic inflow spark */}
      <path d="M12 2l2 2-2 2" />
      <path d="M14 4H7a2 2 0 0 0-2 2" />
    </svg>
  );
}

/**
 * Drawer Cash Till Icon
 * Physical POS till register drawer with paper banknotes and coin tray dividers.
 */
export function DrawerCashTillIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      {/* POS register upper hood */}
      <rect x="3" y="3" width="18" height="9" rx="2" />
      <line x1="7" y1="7" x2="17" y2="7" />
      <circle cx="7.5" cy="9.5" r="0.75" fill="currentColor" />
      <circle cx="10.5" cy="9.5" r="0.75" fill="currentColor" />
      <circle cx="13.5" cy="9.5" r="0.75" fill="currentColor" />
      <circle cx="16.5" cy="9.5" r="0.75" fill="currentColor" />
      {/* Till Drawer box & compartments */}
      <path d="M2 13h20v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />
      <line x1="9" y1="13" x2="9" y2="17" />
      <line x1="15" y1="13" x2="15" y2="17" />
      <path d="M10.5 19h3" />
    </svg>
  );
}

/**
 * Mobile Money (MoMo) Icon
 * Ghanaian mobile smartphone with radiating telecommunications signals and instant wallet transfer.
 */
export function MoMoPhoneIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      {/* Smartphone frame */}
      <rect x="5" y="2" width="12" height="20" rx="2.5" />
      <line x1="9" y1="5" x2="13" y2="5" />
      <circle cx="11" cy="18.5" r="0.9" fill="currentColor" />
      {/* MoMo radiating payment signal arcs */}
      <path d="M19 8a4 4 0 0 1 0 6" />
      <path d="M21.5 5.5a7.5 7.5 0 0 1 0 11" />
      {/* Center transfer badge */}
      <path d="M9 10.5h4" />
      <path d="M11 8.5l2 2-2 2" />
    </svg>
  );
}

/**
 * Bank Wires & Escrow Drafts Icon
 * Classical financial institution columns with electronic wire routing lines.
 */
export function BankWiresIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      {/* Pediment roof */}
      <path d="M3 9L12 3l9 6" />
      <line x1="2" y1="9.5" x2="22" y2="9.5" />
      {/* Classical bank pillars */}
      <line x1="5.5" y1="12" x2="5.5" y2="17" />
      <line x1="9.5" y1="12" x2="9.5" y2="17" />
      <line x1="14.5" y1="12" x2="14.5" y2="17" />
      <line x1="18.5" y1="12" x2="18.5" y2="17" />
      {/* Foundation plinth */}
      <line x1="3" y1="17" x2="21" y2="17" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

/**
 * 14-Day Receivables Clock Icon
 * Countdown settlement timer clock with calendar dial ticks for hammer balance deadlines.
 */
export function ReceivablesClockIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6.5 12 12 15.5 14" />
      <line x1="12" y1="1.5" x2="12" y2="3" />
      <line x1="22.5" y1="12" x2="21" y2="12" />
      <line x1="12" y1="22.5" x2="12" y2="21" />
      <line x1="1.5" y1="12" x2="3" y2="12" />
    </svg>
  );
}

/**
 * Auction Gavel Hammer Icon
 * Dynamic auction hammer striking down on the sounding block for hammer sales.
 */
export function AuctionGavelIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      {/* Handle */}
      <line x1="14" y1="13.5" x2="6.5" y2="21" />
      <line x1="6.5" y1="21" x2="4.5" y2="19" />
      <line x1="4.5" y1="19" x2="12" y2="11.5" />
      {/* Gavel Head */}
      <rect x="13.5" y="3.5" width="7" height="4" rx="1" transform="rotate(45 17 5.5)" />
      {/* Striking block base */}
      <line x1="14" y1="20" x2="21" y2="20" />
      <path d="M16 17l1.5-1.5" />
      <path d="M19 18.5l1.5-1.5" />
    </svg>
  );
}

/**
 * Overdue Expirations Alert Icon
 * Warning triangle shield with exclamation point for critical settlement expirations.
 */
export function OverdueAlertIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.75" fill="currentColor" />
    </svg>
  );
}

/**
 * Paystack & Bank Card Icon
 * Smart payment card with EMV microchip and wireless payment indicator.
 */
export function PaystackCardIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <rect x="5" y="13.5" width="3.5" height="2.5" rx="0.5" />
      <path d="M16 15a1.5 1.5 0 0 0 0-3" />
      <path d="M18 16a3 3 0 0 0 0-5" />
    </svg>
  );
}

/**
 * Escrow Balance Scale Icon
 * Judicial justice balance scale for court registry and consignor escrow liabilities.
 */
export function EscrowScaleIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="5" y1="6" x2="19" y2="6" />
      {/* Left pan */}
      <path d="M5 6l-3 7h6l-3-7z" />
      <path d="M2 13a3 3 0 0 0 6 0" />
      {/* Right pan */}
      <path d="M19 6l-3 7h6l-3-7z" />
      <path d="M16 13a3 3 0 0 0 6 0" />
      {/* Base */}
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

/**
 * Margin & Net Operating Profit Icon
 * Growth trendline with upward spark indicator.
 */
export function MarginProfitIcon({ className = 'h-5 w-5', size, ...props }: CardIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
