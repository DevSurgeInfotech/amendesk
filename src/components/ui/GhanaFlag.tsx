import clsx from 'clsx';

/**
 * Pixel-accurate, high-contrast SVG representation of the National Flag of Ghana:
 * Red, Gold/Yellow, and Green horizontal stripes with the central Black Star.
 */
export function GhanaFlag({ className = 'h-3.5 w-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={clsx('inline-block shrink-0 rounded-[2px] shadow-2xs overflow-hidden ring-1 ring-slate-900/10', className)}
      aria-label="Flag of Ghana"
      role="img"
    >
      {/* Red Stripe (Top) */}
      <rect width="24" height="5.333" fill="#CE1126" />
      {/* Gold/Yellow Stripe (Middle) */}
      <rect y="5.333" width="24" height="5.334" fill="#FCD116" />
      {/* Green Stripe (Bottom) */}
      <rect y="10.667" width="24" height="5.333" fill="#006B3F" />
      {/* Central Black Star */}
      <polygon
        points="12,5.6 12.56,7.22 14.28,7.26 12.91,8.30 13.41,9.94 12,8.96 10.59,9.94 11.09,8.30 9.72,7.26 11.44,7.22"
        fill="#000000"
      />
    </svg>
  );
}

export default GhanaFlag;
