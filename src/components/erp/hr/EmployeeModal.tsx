'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { calculateEmployeePayslip } from '@/lib/hr/payrollEngine';
import { formatGHS } from '@/lib/utils/currency';
import {
  EMPLOYMENT_TYPE_LABELS,
  HR_DEPARTMENT_LABELS,
  type Employee,
  type EmploymentType,
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
  const [email, setEmail] = useState(existingEmployee?.email || '');
  const [ghanaCardNumber, setGhanaCardNumber] = useState(
    existingEmployee?.ghanaCardNumber || 'GHA-'
  );
  const [ssnitNumber, setSsnitNumber] = useState(
    existingEmployee?.ssnitNumber || ''
  );
  const [tinNumber, setTinNumber] = useState(existingEmployee?.tinNumber || '');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(
    existingEmployee?.gender || 'MALE'
  );
  const [address, setAddress] = useState(existingEmployee?.address || '');
  const [nextOfKinName, setNextOfKinName] = useState(
    existingEmployee?.nextOfKinName || ''
  );
  const [nextOfKinPhone, setNextOfKinPhone] = useState(
    existingEmployee?.nextOfKinPhone || ''
  );
  const [department, setDepartment] = useState<HrDepartment>(
    existingEmployee?.department || 'AUCTION_OPERATIONS'
  );
  const [jobTitle, setJobTitle] = useState(existingEmployee?.jobTitle || '');
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    existingEmployee?.employmentType || 'FULL_TIME_SALARIED'
  );
  const [dateHired, setDateHired] = useState(
    existingEmployee?.dateHired || '2026-10-01'
  );
  const [locationId, setLocationId] = useState(
    existingEmployee?.locationId || 'loc-gbawe'
  );
  const [isCashier, setIsCashier] = useState(
    existingEmployee?.isCashier ?? false
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
  const [lunchAllowanceGhs, setLunchAllowanceGhs] = useState(
    String(existingEmployee?.lunchAllowanceGhs ?? 300)
  );
  const [communicationAllowanceGhs, setCommunicationAllowanceGhs] = useState(
    String(existingEmployee?.communicationAllowanceGhs ?? 200)
  );
  const [personalTaxReliefGhs, setPersonalTaxReliefGhs] = useState(
    String(existingEmployee?.personalTaxReliefGhs ?? 0)
  );
  const [hasSsnitContribution, setHasSsnitContribution] = useState(
    existingEmployee?.hasSsnitContribution ?? true
  );
  const [tier3VoluntaryPct, setTier3VoluntaryPct] = useState(
    String(existingEmployee?.tier3VoluntaryPct ?? 0)
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
  const [momoAccountName, setMomoAccountName] = useState(
    existingEmployee?.momoAccountName || ''
  );
  const [bankName, setBankName] = useState(
    existingEmployee?.bankName || 'GCB Bank PLC'
  );
  const [bankBranch, setBankBranch] = useState(
    existingEmployee?.bankBranch || 'High Street Main, Accra'
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
    ghanaCardNumber,
    ssnitNumber,
    tinNumber,
    gender,
    address,
    nextOfKinName,
    nextOfKinPhone,
    department,
    jobTitle: jobTitle || 'Salaried Officer',
    employmentType,
    dateHired,
    locationId,
    status: existingEmployee?.status || 'ACTIVE',
    isCashier,
    basicSalaryGhs: Number(basicSalaryGhs) || 0,
    transportAllowanceGhs: Number(transportAllowanceGhs) || 0,
    housingAllowanceGhs: Number(housingAllowanceGhs) || 0,
    lunchAllowanceGhs: Number(lunchAllowanceGhs) || 0,
    communicationAllowanceGhs: Number(communicationAllowanceGhs) || 0,
    personalTaxReliefGhs: Number(personalTaxReliefGhs) || 0,
    hasSsnitContribution,
    tier3VoluntaryPct: Number(tier3VoluntaryPct) || 0,
    paymentMethod,
    momoNetwork,
    momoPhoneNumber,
    momoAccountName: momoAccountName || fullName,
    bankName,
    bankBranch,
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
    'block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        existingEmployee
          ? `Edit Salaried Staff — ${existingEmployee.fullName}`
          : `Enroll Salaried Staff (${defaultCode})`
      }
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Identity & Statutory Numbers */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            1. Personal &amp; Statutory Identification
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
              <label className={labelClass}>Corporate Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@amenmart.com"
                className={inputClass}
              />
            </div>
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
              <label className={labelClass}>SSNIT Number (13-Digit)</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
                className={inputClass}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Gbawe, Accra"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Next of Kin Name</label>
              <input
                type="text"
                value={nextOfKinName}
                onChange={(e) => setNextOfKinName(e.target.value)}
                placeholder="Full Name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Next of Kin Phone</label>
              <input
                type="text"
                value={nextOfKinPhone}
                onChange={(e) => setNextOfKinPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Role & Department */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            2. Department &amp; Role Assignment
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
              <label className={labelClass}>Salaried Category</label>
              <select
                value={employmentType}
                onChange={(e) =>
                  setEmploymentType(e.target.value as EmploymentType)
                }
                className={inputClass}
              >
                {(
                  Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]
                ).map((t) => (
                  <option key={t} value={t}>
                    {EMPLOYMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Facility Location</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className={inputClass}
              >
                <option value="loc-gbawe">Gbawe Main Auction Grounds</option>
                <option value="loc-showroom">Amen Mart Vehicle Showroom</option>
                <option value="loc-hq">Accra Corporate Head Office</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div>
              <label className={labelClass}>Date Hired</label>
              <input
                type="date"
                value={dateHired}
                onChange={(e) => setDateHired(e.target.value)}
                className={inputClass}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isCashier}
                onChange={(e) => setIsCashier(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Authorized Front-Desk Cashier (Can Open/Close Cash Till Shifts)
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSsnitContribution}
                onChange={(e) => setHasSsnitContribution(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Enrolled in SSNIT Mandatory Tier 1 &amp; Tier 2 (Act 766)
            </label>
          </div>
        </div>

        {/* Section 3: Monthly Salaried Structure */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
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
              <label className={labelClass}>Lunch Allowance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={lunchAllowanceGhs}
                onChange={(e) => setLunchAllowanceGhs(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Communication Allowance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={communicationAllowanceGhs}
                onChange={(e) => setCommunicationAllowanceGhs(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>GRA Tax Relief (GH₵)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={personalTaxReliefGhs}
                onChange={(e) => setPersonalTaxReliefGhs(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tier 3 Voluntary (%)</label>
              <input
                type="number"
                min="0"
                max="16.5"
                step="0.5"
                value={tier3VoluntaryPct}
                onChange={(e) => setTier3VoluntaryPct(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Live Statutory Calculation Strip */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Live GRA/SSNIT Preview
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
                SSNIT Emp (5.5%)
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

        {/* Section 4: Payout Endpoint (Hubtel MoMo API vs Bank) */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            4. Automated Disbursement Endpoint
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Disbursement Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as SalaryPaymentMethod)
                }
                className={inputClass}
              >
                <option value="HUBTEL_MOMO_API">
                  Hubtel Automated MoMo API
                </option>
                <option value="BANK_TRANSFER">
                  Commercial Bank Wire Transfer
                </option>
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
                <div>
                  <label className={labelClass}>Registered Wallet Name</label>
                  <input
                    type="text"
                    value={momoAccountName}
                    onChange={(e) => setMomoAccountName(e.target.value)}
                    placeholder={fullName || 'Account Holder'}
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
                  <label className={labelClass}>Branch</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="High Street Main"
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
            {existingEmployee ? 'Save Staff Profile' : 'Enroll Salaried Staff'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
