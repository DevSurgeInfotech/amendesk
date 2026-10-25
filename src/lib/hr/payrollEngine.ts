import type { Employee, PayrollRun, PayrollSlip } from '@/lib/types';

export interface GraTaxBandBreakdown {
  bandLabel: string;
  bandLimitGhs: number | null;
  ratePct: number;
  taxableInBandGhs: number;
  taxAmountGhs: number;
}

export const GRA_MONTHLY_TAX_BANDS: Array<{
  label: string;
  limitGhs: number | null;
  rate: number;
}> = [
  { label: 'First GH₵ 490.00', limitGhs: 490, rate: 0 },
  { label: 'Next GH₵ 110.00', limitGhs: 110, rate: 0.05 },
  { label: 'Next GH₵ 130.00', limitGhs: 130, rate: 0.1 },
  { label: 'Next GH₵ 3,166.67', limitGhs: 3166.67, rate: 0.175 },
  { label: 'Next GH₵ 16,000.00', limitGhs: 16000, rate: 0.25 },
  { label: 'Next GH₵ 30,500.00', limitGhs: 30500, rate: 0.3 },
  { label: 'Exceeding GH₵ 50,396.67', limitGhs: null, rate: 0.35 },
];

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Computes Ghana Revenue Authority (GRA) monthly PAYE tax using statutory graduated brackets (Act 896).
 */
export function calculateGraPayeTax(chargeableIncomeGhs: number): {
  totalPayeGhs: number;
  breakdown: GraTaxBandBreakdown[];
} {
  let remaining = Math.max(0, chargeableIncomeGhs);
  let totalTax = 0;
  const breakdown: GraTaxBandBreakdown[] = [];

  for (const band of GRA_MONTHLY_TAX_BANDS) {
    if (remaining <= 0) {
      breakdown.push({
        bandLabel: band.label,
        bandLimitGhs: band.limitGhs,
        ratePct: band.rate * 100,
        taxableInBandGhs: 0,
        taxAmountGhs: 0,
      });
      continue;
    }

    const taxableInBand =
      band.limitGhs === null ? remaining : Math.min(remaining, band.limitGhs);
    const taxForBand = roundCurrency(taxableInBand * band.rate);

    totalTax = roundCurrency(totalTax + taxForBand);
    remaining = roundCurrency(remaining - taxableInBand);

    breakdown.push({
      bandLabel: band.label,
      bandLimitGhs: band.limitGhs,
      ratePct: band.rate * 100,
      taxableInBandGhs: taxableInBand,
      taxAmountGhs: taxForBand,
    });
  }

  return {
    totalPayeGhs: roundCurrency(totalTax),
    breakdown,
  };
}

/**
 * Computes a complete monthly PayrollSlip for a salaried employee.
 */
export function calculateEmployeePayslip(
  employee: Employee,
  options: {
    runId: string;
    period: string;
    slipSequenceNumber: number;
    salaryAdvanceDeductionGhs?: number;
  }
): PayrollSlip {
  const basic = roundCurrency(employee.basicSalaryGhs);
  const transport = roundCurrency(employee.transportAllowanceGhs || 0);
  const housing = roundCurrency(employee.housingAllowanceGhs || 0);
  const lunch = roundCurrency(employee.lunchAllowanceGhs || 0);
  const communication = roundCurrency(employee.communicationAllowanceGhs || 0);

  const allowancesGhs = roundCurrency(transport + housing + lunch + communication);
  const grossSalaryGhs = roundCurrency(basic + allowancesGhs);

  // SSNIT Act 766 Mandatory Contributions (calculated on Basic Salary)
  // Employee pays 5.5% total mandatory (5.0% Tier 2 + 0.5% Tier 1)
  // Employer pays 13.0% mandatory (13.0% + 0.5% = 13.5% remitted to SSNIT Tier 1)
  const ssnitEmployeeGhs = employee.hasSsnitContribution
    ? roundCurrency(basic * 0.055)
    : 0;
  const ssnitTier2Ghs = employee.hasSsnitContribution
    ? roundCurrency(basic * 0.05)
    : 0;
  const ssnitEmployerGhs = employee.hasSsnitContribution
    ? roundCurrency(basic * 0.13)
    : 0;

  // Tier 3 Voluntary Provident Fund (up to 16.5% tax-exempt)
  const tier3Pct = Math.min(16.5, Math.max(0, employee.tier3VoluntaryPct || 0));
  const tier3VoluntaryGhs = roundCurrency(basic * (tier3Pct / 100));

  const personalReliefGhs = roundCurrency(employee.personalTaxReliefGhs || 0);

  // Chargeable Taxable Income = Gross Salary - Tax-Exempt Pension (5.5% + Tier 3) - Personal Reliefs
  const taxableIncomeGhs = Math.max(
    0,
    roundCurrency(
      grossSalaryGhs - ssnitEmployeeGhs - tier3VoluntaryGhs - personalReliefGhs
    )
  );

  const { totalPayeGhs } = calculateGraPayeTax(taxableIncomeGhs);

  const salaryAdvanceDeductionGhs = roundCurrency(
    options.salaryAdvanceDeductionGhs || 0
  );

  const totalDeductionsGhs = roundCurrency(
    ssnitEmployeeGhs +
      tier3VoluntaryGhs +
      totalPayeGhs +
      salaryAdvanceDeductionGhs
  );

  const netPayGhs = Math.max(0, roundCurrency(grossSalaryGhs - totalDeductionsGhs));
  const employerTotalCostGhs = roundCurrency(grossSalaryGhs + ssnitEmployerGhs);

  const seqStr = String(options.slipSequenceNumber).padStart(3, '0');

  return {
    id: `slip-${options.period}-${employee.id}`,
    slipNumber: `PS-${options.period}-${seqStr}`,
    runId: options.runId,
    period: options.period,
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    jobTitle: employee.jobTitle,
    department: employee.department,
    ghanaCardNumber: employee.ghanaCardNumber,
    ssnitNumber: employee.ssnitNumber,
    tinNumber: employee.tinNumber,
    basicSalaryGhs: basic,
    transportAllowanceGhs: transport,
    housingAllowanceGhs: housing,
    lunchAllowanceGhs: lunch,
    communicationAllowanceGhs: communication,
    allowancesGhs,
    grossSalaryGhs,
    ssnitEmployeeGhs,
    ssnitTier2Ghs,
    tier3VoluntaryGhs,
    personalReliefGhs,
    taxableIncomeGhs,
    payeTaxGhs: totalPayeGhs,
    salaryAdvanceDeductionGhs,
    totalDeductionsGhs,
    netPayGhs,
    ssnitEmployerGhs,
    employerTotalCostGhs,
    paymentMethod: employee.paymentMethod,
    bankName: employee.bankName,
    bankAccountNumber: employee.bankAccountNumber,
    momoNetwork: employee.momoNetwork,
    momoPhoneNumber: employee.momoPhoneNumber,
    status: 'PENDING',
    syncStatus: 'PENDING',
  };
}

/**
 * Generates a full PayrollRun and its constituent PayrollSlips for active salaried staff.
 */
export function buildMonthlyPayrollRun(
  employees: Employee[],
  options: {
    period: string; // YYYY-MM
    processedBy: string;
    advanceDeductionsByEmployeeId?: Record<string, number>;
  }
): {
  run: PayrollRun;
  slips: PayrollSlip[];
} {
  const activeStaff = employees.filter(
    (emp) => emp.status === 'ACTIVE' || emp.status === 'ON_LEAVE'
  );
  const runId = `pr-${options.period}`;
  const runNumber = `PR-${options.period}`;

  const slips = activeStaff.map((emp, idx) =>
    calculateEmployeePayslip(emp, {
      runId,
      period: options.period,
      slipSequenceNumber: idx + 1,
      salaryAdvanceDeductionGhs:
        options.advanceDeductionsByEmployeeId?.[emp.id] || 0,
    })
  );

  const totalBasicGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.basicSalaryGhs, 0)
  );
  const totalAllowancesGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.allowancesGhs, 0)
  );
  const totalGrossGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.grossSalaryGhs, 0)
  );
  const totalTaxableGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.taxableIncomeGhs, 0)
  );
  const totalPayeGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.payeTaxGhs, 0)
  );
  const totalSsnitTier1EmployerGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.ssnitEmployerGhs, 0)
  );
  const totalSsnitTier2EmployeeGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.ssnitTier2Ghs, 0)
  );
  const totalSsnitEmployeeTotalGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.ssnitEmployeeGhs, 0)
  );
  const totalTier3Ghs = roundCurrency(
    slips.reduce((acc, s) => acc + s.tier3VoluntaryGhs, 0)
  );
  const totalDeductionsGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.totalDeductionsGhs, 0)
  );
  const totalNetGhs = roundCurrency(
    slips.reduce((acc, s) => acc + s.netPayGhs, 0)
  );

  const run: PayrollRun = {
    id: runId,
    runNumber,
    period: options.period,
    status: 'CALCULATED',
    totalEmployees: slips.length,
    totalBasicGhs,
    totalAllowancesGhs,
    totalGrossGhs,
    totalTaxableGhs,
    totalPayeGhs,
    totalSsnitTier1EmployerGhs,
    totalSsnitTier2EmployeeGhs,
    totalSsnitEmployeeTotalGhs,
    totalTier3Ghs,
    totalDeductionsGhs,
    totalNetGhs,
    processedBy: options.processedBy,
    createdAt: new Date().toISOString(),
    syncStatus: 'PENDING',
  };

  return { run, slips };
}

/**
 * Generates GRA Form DT 0107 Monthly PAYE Schedule CSV content.
 */
export function generateGraPayeScheduleCsv(
  run: PayrollRun,
  slips: PayrollSlip[]
): string {
  const headers = [
    'Period',
    'Employee Code',
    'Full Name',
    'GRA TIN',
    'Ghana Card Number',
    'Job Title',
    'Basic Salary (GHS)',
    'Cash Allowances (GHS)',
    'Gross Emoluments (GHS)',
    'SSNIT Employee 5.5% (GHS)',
    'Tier 3 Provident (GHS)',
    'Tax Reliefs (GHS)',
    'Chargeable Income (GHS)',
    'PAYE Tax Deducted (GHS)',
    'Net Salary (GHS)',
  ];

  const rows = slips.map((s) => [
    run.period,
    s.employeeCode,
    `"${s.fullName}"`,
    s.tinNumber || 'N/A',
    s.ghanaCardNumber,
    `"${s.jobTitle}"`,
    s.basicSalaryGhs.toFixed(2),
    s.allowancesGhs.toFixed(2),
    s.grossSalaryGhs.toFixed(2),
    s.ssnitEmployeeGhs.toFixed(2),
    s.tier3VoluntaryGhs.toFixed(2),
    s.personalReliefGhs.toFixed(2),
    s.taxableIncomeGhs.toFixed(2),
    s.payeTaxGhs.toFixed(2),
    s.netPayGhs.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates SSNIT Tier 1 Monthly Contribution Schedule (13.5% of Basic Salary: 13% Employer + 0.5% Employee).
 */
export function generateSsnitTier1ScheduleCsv(
  run: PayrollRun,
  slips: PayrollSlip[]
): string {
  const headers = [
    'Contribution Period',
    'Employee Code',
    'Full Name',
    'SSNIT Number',
    'Ghana Card Number',
    'Basic Salary (GHS)',
    'Employee 0.5% Tier 1 (GHS)',
    'Employer 13.0% Tier 1 (GHS)',
    'Total SSNIT Tier 1 13.5% Remittance (GHS)',
  ];

  const rows = slips
    .filter((s) => s.ssnitEmployeeGhs > 0)
    .map((s) => {
      const emp05 = roundCurrency(s.ssnitEmployeeGhs - s.ssnitTier2Ghs);
      const total135 = roundCurrency(emp05 + s.ssnitEmployerGhs);
      return [
        run.period,
        s.employeeCode,
        `"${s.fullName}"`,
        s.ssnitNumber || 'PENDING',
        s.ghanaCardNumber,
        s.basicSalaryGhs.toFixed(2),
        emp05.toFixed(2),
        s.ssnitEmployerGhs.toFixed(2),
        total135.toFixed(2),
      ];
    });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates Generic Tier 2 Occupational Pension Schedule (5.0% Employee Mandatory Deduction).
 */
export function generateTier2ScheduleCsv(
  run: PayrollRun,
  slips: PayrollSlip[]
): string {
  const headers = [
    'Contribution Period',
    'Employee Code',
    'Full Name',
    'SSNIT Number',
    'Ghana Card Number',
    'Basic Salary (GHS)',
    'Mandatory Tier 2 Employee 5.0% (GHS)',
    'Tier 3 Voluntary (GHS)',
  ];

  const rows = slips
    .filter((s) => s.ssnitTier2Ghs > 0 || s.tier3VoluntaryGhs > 0)
    .map((s) => [
      run.period,
      s.employeeCode,
      `"${s.fullName}"`,
      s.ssnitNumber || 'PENDING',
      s.ghanaCardNumber,
      s.basicSalaryGhs.toFixed(2),
      s.ssnitTier2Ghs.toFixed(2),
      s.tier3VoluntaryGhs.toFixed(2),
    ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
