'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatGHS } from '@/lib/utils/currency';
import { HR_DEPARTMENT_LABELS, type PayrollSlip } from '@/lib/types';
import { Printer, FileText, Receipt, CheckCircle2, Smartphone, Building2 } from 'lucide-react';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: PayrollSlip | null;
}

export function PayslipModal({ isOpen, onClose, slip }: PayslipModalProps) {
  const [printMode, setPrintMode] = useState<'A4' | 'THERMAL_80MM'>('A4');

  if (!slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const ssnitTier1Employee05 = Math.max(
    0,
    Math.round((slip.ssnitEmployeeGhs - slip.ssnitTier2Ghs) * 100) / 100
  );
  const ssnitTier1Total135 =
    Math.round((ssnitTier1Employee05 + slip.ssnitEmployerGhs) * 100) / 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Official Staff Payslip — ${slip.slipNumber}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Format Toggle & Print Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintMode('A4')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printMode === 'A4'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              A4 Executive Payslip
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('THERMAL_80MM')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                printMode === 'THERMAL_80MM'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              80mm Thermal Slip
            </button>
          </div>

          <Button onClick={handlePrint} variant="primary" size="sm">
            <Printer className="w-4 h-4 mr-1.5" />
            Print {printMode === 'A4' ? 'A4 Payslip' : '80mm Thermal Slip'}
          </Button>
        </div>

        {printMode === 'A4' ? (
          /* A4 EXECUTIVE PAYSLIP */
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3.5">
                <Image
                  src="/amenmart-logo-horizontal-4k.png"
                  alt="Amen Mart"
                  width={180}
                  height={96}
                  className="h-12 w-auto object-contain shrink-0"
                />
                <div className="border-l border-slate-300 pl-3.5">
                  <h2 className="text-base font-black tracking-tight text-slate-900">
                    AMEN MART GHANA LIMITED
                  </h2>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Statutory Salaried Staff Emolument Advice
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Gbawe, Flower Junction, Accra &bull; GAA Lic: GAA/ACC/2026-044 &bull; TIN: C000294819X
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  PAYE &amp; SSNIT COMPLIANT
                </span>
                <p className="text-xs font-black text-slate-900 mt-1.5">
                  Period: {slip.period}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Slip Ref: {slip.slipNumber}
                </p>
              </div>
            </div>

            {/* Staff Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Staff Name &amp; ID
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {slip.fullName}
                </span>
                <span className="font-mono text-[11px] text-indigo-600 font-semibold">
                  {slip.employeeCode}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Designation &amp; Dept
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {slip.jobTitle}
                </span>
                <span className="text-[11px] text-slate-600">
                  {HR_DEPARTMENT_LABELS[slip.department]}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Statutory IDs
                </span>
                <span className="font-mono text-[11px] text-slate-800 block mt-0.5">
                  SSNIT: {slip.ssnitNumber || 'N/A'}
                </span>
                <span className="font-mono text-[11px] text-slate-600 block">
                  TIN: {slip.tinNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ghana Card &amp; Payout
                </span>
                <span className="font-mono text-[11px] text-slate-800 block mt-0.5">
                  {slip.ghanaCardNumber}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 block">
                  {slip.paymentMethod === 'HUBTEL_MOMO_API'
                    ? `Hubtel MoMo (${slip.momoNetwork} ${slip.momoPhoneNumber})`
                    : `${slip.bankName} (${slip.bankAccountNumber})`}
                </span>
              </div>
            </div>

            {/* Earnings & Deductions Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider flex justify-between">
                  <span>Monthly Salaried Earnings</span>
                  <span>Amount (GH₵)</span>
                </div>
                <div className="divide-y divide-slate-200 text-xs">
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="font-semibold text-slate-700">Consolidated Basic Salary</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatGHS(slip.basicSalaryGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Transport Allowance</span>
                    <span className="font-mono text-slate-800">
                      {formatGHS(slip.transportAllowanceGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Housing / Rent Allowance</span>
                    <span className="font-mono text-slate-800">
                      {formatGHS(slip.housingAllowanceGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Lunch &amp; Welfare Allowance</span>
                    <span className="font-mono text-slate-800">
                      {formatGHS(slip.lunchAllowanceGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Communication &amp; Utility Allowance</span>
                    <span className="font-mono text-slate-800">
                      {formatGHS(slip.communicationAllowanceGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-3 bg-emerald-50/70 flex justify-between font-black text-slate-900">
                    <span>GROSS MONTHLY SALARY</span>
                    <span className="font-mono text-emerald-700">
                      {formatGHS(slip.grossSalaryGhs)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statutory Deductions */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider flex justify-between">
                  <span>Statutory &amp; Other Deductions</span>
                  <span>Amount (GH₵)</span>
                </div>
                <div className="divide-y divide-slate-200 text-xs">
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-700">
                      SSNIT Tier 1 Employee Portion (0.5%)
                    </span>
                    <span className="font-mono text-slate-900">
                      {formatGHS(ssnitTier1Employee05)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-700">
                      Mandatory Tier 2 Occupational Pension (5.0%)
                    </span>
                    <span className="font-mono text-slate-900">
                      {formatGHS(slip.ssnitTier2Ghs)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">
                      Tier 3 Voluntary Provident Fund
                    </span>
                    <span className="font-mono text-slate-800">
                      {formatGHS(slip.tier3VoluntaryGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="font-semibold text-slate-800">
                      GRA PAYE Income Tax (Act 896 Graduated)
                    </span>
                    <span className="font-mono font-bold text-rose-700">
                      {formatGHS(slip.payeTaxGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-slate-600">Salary Advance Recovery</span>
                    <span className="font-mono text-slate-800">
                      {formatGHS(slip.salaryAdvanceDeductionGhs)}
                    </span>
                  </div>
                  <div className="px-4 py-3 bg-rose-50/70 flex justify-between font-black text-slate-900">
                    <span>TOTAL DEDUCTIONS</span>
                    <span className="font-mono text-rose-700">
                      {formatGHS(slip.totalDeductionsGhs)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Tax & Employer SSNIT Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Chargeable Taxable Income
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatGHS(slip.taxableIncomeGhs)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Employer SSNIT Burden (13.0%)
                </span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {formatGHS(slip.ssnitEmployerGhs)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Total SSNIT Tier 1 Remittance (13.5%)
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatGHS(ssnitTier1Total135)}
                </span>
              </div>
            </div>

            {/* Net Salary Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 block">
                  Net Take-Home Salary Disbursed
                </span>
                <div className="text-2xl font-black font-mono tracking-tight mt-0.5">
                  {formatGHS(slip.netPayGhs)}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
                  {slip.paymentMethod === 'HUBTEL_MOMO_API' ? (
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>
                    Ref: {slip.paymentReference || 'Pending Execution'} &bull; Status:{' '}
                    <strong className="text-emerald-400">{slip.status}</strong>
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authorized by Amen Mart Finance
                </div>
                {slip.hubtelResponseMessage && (
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                    {slip.hubtelResponseMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 80MM THERMAL PAYSLIP */
          <div className="max-w-[310px] mx-auto bg-white text-slate-900 border border-slate-300 rounded-xl p-4 font-mono text-[11px] leading-snug shadow-xs space-y-2.5">
            <div className="text-center border-b border-dashed border-slate-400 pb-2">
              <div className="font-black text-sm">AMEN MART GHANA LTD</div>
              <div className="text-[10px]">Gbawe, Flower Junction, Accra</div>
              <div className="text-[10px] font-bold mt-1">
                STAFF PAYSLIP ({slip.period})
              </div>
              <div className="text-[10px]">Slip: {slip.slipNumber}</div>
            </div>

            <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2">
              <div>
                <span className="font-bold">Staff:</span> {slip.fullName}
              </div>
              <div>
                <span className="font-bold">ID:</span> {slip.employeeCode}
              </div>
              <div>
                <span className="font-bold">Role:</span> {slip.jobTitle}
              </div>
              <div>
                <span className="font-bold">SSNIT:</span> {slip.ssnitNumber || 'N/A'}
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
              <div className="font-bold uppercase">Earnings</div>
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span>{formatGHS(slip.basicSalaryGhs)}</span>
              </div>
              <div className="flex justify-between">
                <span>Allowances:</span>
                <span>{formatGHS(slip.allowancesGhs)}</span>
              </div>
              <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-slate-300">
                <span>GROSS PAY:</span>
                <span>{formatGHS(slip.grossSalaryGhs)}</span>
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
              <div className="font-bold uppercase">Statutory Deductions</div>
              <div className="flex justify-between">
                <span>SSNIT Emp (5.5%):</span>
                <span>{formatGHS(slip.ssnitEmployeeGhs)}</span>
              </div>
              {slip.tier3VoluntaryGhs > 0 && (
                <div className="flex justify-between">
                  <span>Tier 3 Prov:</span>
                  <span>{formatGHS(slip.tier3VoluntaryGhs)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GRA PAYE Tax:</span>
                <span>{formatGHS(slip.payeTaxGhs)}</span>
              </div>
              {slip.salaryAdvanceDeductionGhs > 0 && (
                <div className="flex justify-between">
                  <span>Advance Rec:</span>
                  <span>{formatGHS(slip.salaryAdvanceDeductionGhs)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-0.5 border-t border-dotted border-slate-300">
                <span>TOTAL DEDUCT:</span>
                <span>{formatGHS(slip.totalDeductionsGhs)}</span>
              </div>
            </div>

            <div className="py-1.5 border-b border-dashed border-slate-400 flex justify-between text-xs font-black">
              <span>NET TAKE-HOME:</span>
              <span>{formatGHS(slip.netPayGhs)}</span>
            </div>

            <div className="text-[10px] space-y-0.5 pt-1">
              <div>
                Channel:{' '}
                {slip.paymentMethod === 'HUBTEL_MOMO_API'
                  ? `Hubtel MoMo (${slip.momoNetwork})`
                  : `Bank (${slip.bankName})`}
              </div>
              <div>Ref: {slip.paymentReference || 'PENDING'}</div>
              <div>Employer SSNIT (13%): {formatGHS(slip.ssnitEmployerGhs)}</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
