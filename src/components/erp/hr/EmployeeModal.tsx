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
  type HrDepartment,
  type SalaryPaymentMethod,
} from '@/lib/types';
import { UserPlus, Calculator } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingEmployee?: Employee | null;
  nextSequenceNumber: number;
  onSaved: () => void;
}

export function EmployeeModal({
  isOpen,
  onClose,
  existingEmployee,
  nextSequenceNumber,
  onSaved,
}: EmployeeModalProps) {
  const defaultCode =
    existingEmployee?.employeeCode ||
    `AM-EMP-${String(nextSequenceNumber).padStart(3, '0')}`;

  const [fullName, setFullName] = useState(existingEmployee?.fullName || '');
  const [phone, setPhone] = useState(existingEmployee?.phone || '');
  const [ghanaCardNumber, setGhanaCardNumber] = useState(
    existingEmployee?.ghanaCardNumber || 'GHA-'
  );
  const [ssnitNumber, setSsnitNumber] = useState(
    existingEmployee?.ssnitNumber || ''
  );
  const [tinNumber, setTinNumber] = useState(existingEmployee?.tinNumber || '');
  const [department, setDepartment] = useState<HrDepartment>(
    existingEmployee?.department || 'AUCTION_OPERATIONS'
  );
  const [jobTitle, setJobTitle] = useState(existingEmployee?.jobTitle || '');
  const [status, setStatus] = useState<Employee['status']>(
    existingEmployee?.status || 'ACTIVE'
  );
  const [dateHired, setDateHired] = useState(
    existingEmployee?.dateHired || '2026-10-01'
  );

  // Salaried Remuneration
  const [basicSalaryGhs, setBasicSalaryGhs] = useState(
    String(existingEmployee?.basicSalaryGhs ?? 5000)
  );
  const [transportAllowanceGhs, setTransportAllowanceGhs] = useState(
    String(existingEmployee?.transportAllowanceGhs ?? 600)
  );
  const [housingAllowanceGhs, setHousingAllowanceGhs] = useState(
    String(existingEmployee?.housingAllowanceGhs ?? 500)
  );
  const [otherAllowanceGhs, setOtherAllowanceGhs] = useState(
    String(
      (existingEmployee?.lunchAllowanceGhs ?? 300) +
        (existingEmployee?.communicationAllowanceGhs ?? 200)
    )
  );

  // Payout Endpoint
  const [paymentMethod, setPaymentMethod] = useState<SalaryPaymentMethod>(
    existingEmployee?.paymentMethod || 'HUBTEL_MOMO_API'
  );
  const [momoNetwork, setMomoNetwork] = useState<
    'MTN' | 'TELECEL' | 'AIRTELTIGO'
  >(existingEmployee?.momoNetwork || 'MTN');
  const [momoPhoneNumber, setMomoPhoneNumber] = useState(
    existingEmployee?.momoPhoneNumber || ''
  );
  const [bankName, setBankName] = useState(
    existingEmployee?.bankName || 'GCB Bank PLC'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    existingEmployee?.bankAccountNumber || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Statutory Preview
  const previewEmployee: Employee = {
    id: existingEmployee?.id || 'preview',
    employeeCode: defaultCode,
    fullName: fullName || 'Staff Member',
    phone,
    email: existingEmployee?.email || '',
    ghanaCardNumber,
    ssnitNumber,
    tinNumber,
    gender: existingEmployee?.gender || 'MALE',
    address: existingEmployee?.address || 'Accra',
    nextOfKinName: existingEmployee?.nextOfKinName || '',
    nextOfKinPhone: existingEmployee?.nextOfKinPhone || '',
    department,
    jobTitle: jobTitle || 'Staff Officer',
    employmentType: existingEmployee?.employmentType || 'FULL_TIME_SALARIED',
    dateHired,
    locationId: existingEmployee?.locationId || 'loc-gbawe',
    status,
    isCashier: false,
    basicSalaryGhs: Number(basicSalaryGhs) || 0,
    transportAllowanceGhs: Number(transportAllowanceGhs) || 0,
    housingAllowanceGhs: Number(housingAllowanceGhs) || 0,
    lunchAllowanceGhs: Number(otherAllowanceGhs) || 0,
    communicationAllowanceGhs: 0,
    personalTaxReliefGhs: existingEmployee?.personalTaxReliefGhs || 0,
    hasSsnitContribution: true,
    tier3VoluntaryPct: existingEmployee?.tier3VoluntaryPct || 0,
    paymentMethod,
    momoNetwork,
    momoPhoneNumber,
    momoAccountName: fullName,
    bankName,
    bankBranch: existingEmployee?.bankBranch || 'High Street Main, Accra',
    bankAccountNumber,
    createdAt: existingEmployee?.createdAt || new Date().toISOString(),
  };

  const liveSlipPreview = calculateEmployeePayslip(previewEmployee, {
    runId: 'preview-run',
    period: '2026-10',
    slipSequenceNumber: 1,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !jobTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const id = existingEmployee?.id || `emp-${Date.now()}`;
      const record: Employee = {
        ...previewEmployee,
        id,
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim(),
        updatedAt: new Date().toISOString(),
      };

      await db.employees.put(record);
      await syncEngine.queueMutation(
        'employees',
        record.id,
        existingEmployee ? 'UPDATE' : 'CREATE',
        record
      );
      onSaved();
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
      title={
        existingEmployee
          ? `Edit Staff — ${existingEmployee.fullName}`
          : `Add Staff Member (${defaultCode})`
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Staff Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            1. Staff Details &amp; Role
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kwesi Boateng"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Job Title *</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Auction Coordinator"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as HrDepartment)}
                className={inputClass}
              >
                {(Object.keys(HR_DEPARTMENT_LABELS) as HrDepartment[]).map(
                  (dept) => (
                    <option key={dept} value={dept}>
                      {HR_DEPARTMENT_LABELS[dept]}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Employee['status'])
                }
                className={inputClass}
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date Hired</label>
              <input
                type="date"
                value={dateHired}
                onChange={(e) => setDateHired(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Numbers */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            2. Statutory Identification
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Ghana Card Number *</label>
              <input
                type="text"
                required
                value={ghanaCardNumber}
                onChange={(e) => setGhanaCardNumber(e.target.value)}
                placeholder="GHA-712345678-9"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>SSNIT Number</label>
              <input
                type="text"
                value={ssnitNumber}
                onChange={(e) => setSsnitNumber(e.target.value)}
                placeholder="C012345678901"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>GRA TIN Number</label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                placeholder="P0001234567"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Monthly Salaried Structure */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            3. Monthly Salary &amp; Allowances (GH₵)
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

        {/* Section 4: Payout Endpoint (MoMo vs Bank) */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            4. Salary Payment Mode
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
            <UserPlus className="w-4 h-4 mr-1.5" />
            {existingEmployee ? 'Save Changes' : 'Add Staff'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
