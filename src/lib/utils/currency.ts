/**
 * Formats a numerical value as Ghana Cedis (GH₵)
 */
export function formatGHS(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'GH₵ 0.00';
  }
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('GHS', 'GH₵');
}

/**
 * Calculates standard Amen Mart auction fee (7% default)
 */
export function calculateAuctionFee(
  hammerPrice: number,
  marginRatePercent: number = 7
): {
  hammerPrice: number;
  marginRatePercent: number;
  feeAmountGhs: number;
  totalPayableGhs: number;
} {
  const feeAmountGhs = Math.round((hammerPrice * (marginRatePercent / 100)) * 100) / 100;
  const totalPayableGhs = hammerPrice + feeAmountGhs;
  return {
    hammerPrice,
    marginRatePercent,
    feeAmountGhs,
    totalPayableGhs,
  };
}

/**
 * Calculates Ghana VAT breakdown (Standard VAT 15%, NHIL 2.5%, GETFund 2.5%, COVID Levy 1%)
 */
export function calculateGhanaTaxes(taxableAmount: number) {
  const nhil = Math.round(taxableAmount * 0.025 * 100) / 100;
  const getFund = Math.round(taxableAmount * 0.025 * 100) / 100;
  const covidLevy = Math.round(taxableAmount * 0.01 * 100) / 100;
  const vatableBase = taxableAmount + nhil + getFund + covidLevy;
  const vat = Math.round(vatableBase * 0.15 * 100) / 100;
  const totalWithTax = taxableAmount + nhil + getFund + covidLevy + vat;

  return {
    subtotal: taxableAmount,
    nhil,
    getFund,
    covidLevy,
    vat,
    totalTax: nhil + getFund + covidLevy + vat,
    totalWithTax,
  };
}

/**
 * Formats a Ghana Cedis amount in compact form for chart labels and axes
 * (e.g. GH₵ 950, GH₵ 12.5K, GH₵ 1.2M).
 */
export function formatGHSCompact(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'GH₵ 0';
  }
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const units: Array<[number, string]> = [
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'K'],
  ];
  for (const [threshold, suffix] of units) {
    if (abs >= threshold) {
      const scaled = abs / threshold;
      const digits = scaled >= 100 ? 0 : 1;
      return `${sign}GH₵ ${Number(scaled.toFixed(digits))}${suffix}`;
    }
  }
  return `${sign}GH₵ ${Math.round(abs)}`;
}
