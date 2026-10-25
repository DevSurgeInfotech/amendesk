'use client';

import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { db, getActiveTenantId } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { authService } from '@/lib/auth/authService';
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type AppRole,
} from '@/lib/types/auth';
import {
  HR_DEPARTMENT_LABELS,
  type Employee,
  type HrDepartment,
} from '@/lib/types';
import { UserPlus, ShieldCheck, Clock } from 'lucide-react';

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
  const [department, setDepartment] = useState<HrDepartment>(
    existingEmployee?.department || 'AUCTION_OPERATIONS'
  );
  const [jobTitle, setJobTitle] = useState(existingEmployee?.jobTitle || '');
  const [rbacRole, setRbacRole] = useState<AppRole>('STAFF');
  const [status, setStatus] = useState<Employee['status']>(
    existingEmployee?.status || 'ACTIVE'
  );
  const [dateHired, setDateHired] = useState(
    existingEmployee?.dateHired || '2026-10-01'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !jobTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const id = existingEmployee?.id || `emp-${Date.now()}`;
      const cleanEmail =
        email.trim().toLowerCase() ||
        `${fullName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')}@amenmart.com`;

      const record: Employee = {
        id,
        employeeCode: defaultCode,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: cleanEmail,
        ghanaCardNumber: ghanaCardNumber.trim(),
        ssnitNumber: ssnitNumber.trim(),
        tinNumber: tinNumber.trim(),
        gender: existingEmployee?.gender || 'MALE',
        address: existingEmployee?.address || 'Accra',
        nextOfKinName: existingEmployee?.nextOfKinName || '',
        nextOfKinPhone: existingEmployee?.nextOfKinPhone || '',
        department,
        jobTitle: jobTitle.trim(),
        employmentType:
          existingEmployee?.employmentType || 'FULL_TIME_SALARIED',
        dateHired,
        locationId: existingEmployee?.locationId || 'loc-gbawe',
        status,
        isCashier: rbacRole === 'CASHIER',
        // Salary is strictly configured in Monthly Payroll (not during staff onboarding)
        basicSalaryGhs: existingEmployee?.basicSalaryGhs ?? 0,
        transportAllowanceGhs: existingEmployee?.transportAllowanceGhs ?? 0,
        housingAllowanceGhs: existingEmployee?.housingAllowanceGhs ?? 0,
        lunchAllowanceGhs: existingEmployee?.lunchAllowanceGhs ?? 0,
        communicationAllowanceGhs:
          existingEmployee?.communicationAllowanceGhs ?? 0,
        personalTaxReliefGhs: existingEmployee?.personalTaxReliefGhs ?? 0,
        hasSsnitContribution: existingEmployee?.hasSsnitContribution ?? true,
        tier3VoluntaryPct: existingEmployee?.tier3VoluntaryPct ?? 0,
        paymentMethod: existingEmployee?.paymentMethod || 'HUBTEL_MOMO_API',
        momoNetwork: existingEmployee?.momoNetwork || 'MTN',
        momoPhoneNumber: existingEmployee?.momoPhoneNumber || phone.trim(),
        momoAccountName: existingEmployee?.momoAccountName || fullName.trim(),
        bankName: existingEmployee?.bankName || 'GCB Bank PLC',
        bankBranch: existingEmployee?.bankBranch || 'High Street Main, Accra',
        bankAccountNumber: existingEmployee?.bankAccountNumber || '',
        createdAt: existingEmployee?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.employees.put(record);
      await syncEngine.queueMutation(
        'employees',
        record.id,
        existingEmployee ? 'UPDATE' : 'CREATE',
        record
      );

      // Unify with Workspace RBAC User Accounts if new staff member
      try {
        const tenantId = getActiveTenantId();
        const existingUsers = authService.getUsers(tenantId);
        const matchedUser = existingUsers.find(
          (u) =>
            u.email.toLowerCase() === cleanEmail ||
            u.fullName.toLowerCase() === fullName.trim().toLowerCase()
        );
        if (!matchedUser) {
          authService.inviteStaff({
            tenantId,
            fullName: fullName.trim(),
            email: cleanEmail,
            phone: phone.trim(),
            role: rbacRole,
            invitedBy: 'Staff Directory Onboarding',
            password: 'amen@2026',
          });
        } else {
          authService.updateUser(matchedUser.id, {
            fullName: fullName.trim(),
            email: cleanEmail,
            role: rbacRole,
            isActive: status === 'ACTIVE',
          });
        }
      } catch {
        // Non-blocking if username/email already exists
      }

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
          ? `Edit Staff Profile — ${existingEmployee.fullName}`
          : `Add Staff Member (${defaultCode})`
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Staff Details & Role */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              1. Staff Details &amp; Department
            </h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Clock className="w-3 h-3 text-indigo-600" />
              Hours: 8:00 AM – 5:00 PM
            </span>
          </div>

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
              <label className={labelClass}>Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. k.boateng@amenmart.com"
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
              <label className={labelClass}>Date Hired</label>
              <input
                type="date"
                value={dateHired}
                onChange={(e) => setDateHired(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Assign RBAC System Role *</label>
              <select
                value={rbacRole}
                onChange={(e) => setRbacRole(e.target.value as AppRole)}
                className={inputClass}
              >
                {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                  <option key={r} value={r}>
                    {r} — {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {ROLE_DESCRIPTIONS[rbacRole]}
              </p>
            </div>
            <div>
              <label className={labelClass}>Employment Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as Employee['status'])
                }
                className={inputClass}
              >
                <option value="ACTIVE">Active (8am – 5pm)</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Identification */}
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

        {/* RBAC Salary Separation Notice */}
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">
              RBAC Salary Separation:{' '}
            </span>
            Salary and payout account configuration are excluded from Staff Onboarding so a Secretary or HR Officer can register staff safely. Monthly salaries and allowances are configured inside the{' '}
            <strong className="text-indigo-700 dark:text-indigo-300">
              Monthly Payroll
            </strong>{' '}
            tab by the Chief Accountant or Managing Director.
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            {existingEmployee ? 'Save Profile Changes' : 'Add Staff Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
