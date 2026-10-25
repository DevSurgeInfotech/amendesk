'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { calculateEmployeePayslip } from '@/lib/hr/payrollEngine';
import { formatGHS } from '@/lib/utils/currency';
import {
  HR_DEPARTMENT_LABELS,
  type Employee,
  type SalaryPaymentMethod,
} from '@/lib/types';
import { Wallet, Calculator, ShieldCheck } from 'lucide-react';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialEmployee?: Employee | null;
  onSaved: (employeeName: string) => void;
}

export function SalaryModal({
  isOpen,
  onClose,
  employees,
  initialEmployee,
  onSaved,
}: SalaryModalProps) {
  const defaultEmp = initialEmployee || employees[0] || null;

  const [selectedEmpId, setSelectedEmpId] = useState(defaultEmp?.id || '');
  const currentEmp =
    employees.find((e) => e.id === selectedEmpId) || defaultEmp;

  const [basicSalaryGhs, setBasicSalaryGhs] = useState(
    String(currentEmp?.basicSalaryGhs || 0)
  );
  const [transportAllowanceGhs, setTransportAllowanceGhs] = useState(
    String(currentEmp?.transportAllowanceGhs || 0)
  );
  const [housingAllowanceGhs, setHousingAllowanceGhs] = useState(
    String(currentEmp?.housingAllowanceGhs || 0)
  );
  const [otherAllowanceGhs, setOtherAllowanceGhs] = useState(
    String(
      (currentEmp?.lunchAllowanceGhs || 0) +
        (currentEmp?.communicationAllowanceGhs || 0)
    )
  );

  const [paymentMethod, setPaymentMethod] = useState<SalaryPaymentMethod>(
    currentEmp?.paymentMethod || 'HUBTEL_MOMO_API'
  );
  const [momoNetwork, setMomoNetwork] = useState<
    'MTN' | 'TELECEL' | 'AIRTELTIGO'
  >(currentEmp?.momoNetwork || 'MTN');
  const [momoPhoneNumber, setMomoPhoneNumber] = useState(
    currentEmp?.momoPhoneNumber || currentEmp?.phone || ''
  );
  const [bankName, setBankName] = useState(
    currentEmp?.bankName || 'GCB Bank PLC'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    currentEmp?.bankAccountNumber || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmployeeSwitch = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setBasicSalaryGhs(String(emp.basicSalaryGhs || 0));
      setTransportAllowanceGhs(String(emp.transportAllowanceGhs || 0));
      setHousingAllowanceGhs(String(emp.housingAllowanceGhs || 0));
      setOtherAllowanceGhs(
        String((emp.lunchAllowanceGhs || 0) + (emp.communicationAllowanceGhs || 0))
      );
      setPaymentMethod(emp.paymentMethod || 'HUBTEL_MOMO_API');
      setMomoNetwork(emp.momoNetwork || 'MTN');
      setMomoPhoneNumber(emp.momoPhoneNumber || emp.phone || '');
      setBankName(emp.bankName || 'GCB Bank PLC');
      setBankAccountNumber(emp.bankAccountNumber || '');
    }
  };

  if (!currentEmp) return null;

  const previewEmployee: Employee = {
    ...currentEmp,
    basicSalaryGhs: Number(basicSalaryGhs) || 0,
    transportAllowanceGhs: Number(transportAllowanceGhs) || 0,
    housingAllowanceGhs: Number(housingAllowanceGhs) || 0,
    lunchAllowanceGhs: Number(otherAllowanceGhs) || 0,
    communicationAllowanceGhs: 0,
    paymentMethod,
    momoNetwork,
    momoPhoneNumber,
    bankName,
    bankAccountNumber,
  };

  const liveSlipPreview = calculateEmployeePayslip(previewEmployee, {
    runId: 'preview-run',
    period: '2026-10',
    slipSequenceNumber: 1,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updated: Employee = {
        ...previewEmployee,
        updatedAt: new Date().toISOString(),
      };
      await db.employees.put(updated);
      await syncEngine.queueMutation(
        'employees',
        updated.id,
        'UPDATE',
        updated
      );
      onSaved(updated.fullName);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass =
    'block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Staff Salary & Payout — ${currentEmp.fullName} (${currentEmp.employeeCode})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Staff Selector & Context Banner */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Payroll RBAC: Authorized Finance / Executive Configuration
            </span>
            <span className="text-[11px] text-slate-500">
              {currentEmp.jobTitle} &bull;{' '}
              {HR_DEPARTMENT_LABELS[currentEmp.department]}
            </span>
          </div>

          {!initialEmployee && employees.length > 1 && (
            <div>
              <label className={labelClass}>Select Staff Member</label>
              <select
                value={currentEmp.id}
                onChange={(e) => handleEmployeeSwitch(e.target.value)}
                className={inputClass}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode}) — {emp.jobTitle}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Section 1: Monthly Salary & Allowances */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            1. Monthly Salary &amp; Allowances (GH₵)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Basic Salary (GH₵) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={basicSalaryGhs}
                onChange={(e) => setBasicSalaryGhs(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Transport Allowance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={transportAllowanceGhs}
                onChange={(e) => setTransportAllowanceGhs(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Housing Allowance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={housingAllowanceGhs}
                onChange={(e) => setHousingAllowanceGhs(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Other Allowances</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherAllowanceGhs}
                onChange={(e) => setOtherAllowanceGhs(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Live Statutory Calculation Strip */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Monthly Preview
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">
                Gross Salary
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatGHS(liveSlipPreview.grossSalaryGhs)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">
                SSNIT (5.5%)
              </span>
              <span className="font-mono font-semibold text-amber-600">
                {formatGHS(liveSlipPreview.ssnitEmployeeGhs)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">
                GRA PAYE Tax
              </span>
              <span className="font-mono font-semibold text-rose-600">
                {formatGHS(liveSlipPreview.payeTaxGhs)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">
                Net Take-Home
              </span>
              <span className="font-mono font-black text-emerald-600">
                {formatGHS(liveSlipPreview.netPayGhs)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Salary Payment Mode */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            2. Salary Payment Mode (Disbursement Endpoint)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Payment Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as SalaryPaymentMethod)
                }
                className={inputClass}
              >
                <option value="HUBTEL_MOMO_API">
                  Mobile Money (Hubtel)
                </option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            {paymentMethod === 'HUBTEL_MOMO_API' ? (
              <>
                <div>
                  <label className={labelClass}>MoMo Network</label>
                  <select
                    value={momoNetwork}
                    onChange={(e) =>
                      setMomoNetwork(
                        e.target.value as 'MTN' | 'TELECEL' | 'AIRTELTIGO'
                      )
                    }
                    className={inputClass}
                  >
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="TELECEL">Telecel Cash</option>
                    <option value="AIRTELTIGO">AT Money</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>MoMo Wallet Number *</label>
                  <input
                    type="text"
                    required
                    value={momoPhoneNumber}
                    onChange={(e) => setMomoPhoneNumber(e.target.value)}
                    placeholder="024XXXXXXX"
                    className={inputClass}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="GCB Bank / Stanbic"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="1011130049281"
                    className={inputClass}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            <Wallet className="w-4 h-4 mr-1.5" />
            Save Salary &amp; Payout
          </Button>
        </div>
      </form>
    </Modal>
  );
}
