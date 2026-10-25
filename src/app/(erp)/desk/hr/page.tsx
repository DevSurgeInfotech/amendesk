'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { formatGHS } from '@/lib/utils/currency';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmployeeModal } from '@/components/erp/hr/EmployeeModal';
import { PayslipModal } from '@/components/erp/hr/PayslipModal';
import {
  buildMonthlyPayrollRun,
  generateGraPayeScheduleCsv,
  generateSsnitTier1ScheduleCsv,
  generateTier2ScheduleCsv,
  GRA_MONTHLY_TAX_BANDS,
} from '@/lib/hr/payrollEngine';
import {
  approveAndPostPayrollRunToLedger,
  executeAutomatedHubtelAndBankDisbursement,
} from '@/lib/hr/payrollLedgerSync';
import {
  ATTENDANCE_STATUS_LABELS,
  HR_DEPARTMENT_LABELS,
  LEAVE_TYPE_LABELS,
  type AttendanceStatus,
  type Employee,
  type HrDepartment,
  type LeaveRequest,
  type LeaveType,
  type PayrollSlip,
  type StaffAttendance,
} from '@/lib/types';
import {
  Users,
  Wallet,
  ShieldCheck,
  CalendarClock,
  UserPlus,
  Search,
  Eye,
  EyeOff,
  Edit2,
  FileText,
  Smartphone,
  Building2,
  CheckCircle2,
  Play,
  Download,
  Clock,
  CalendarDays,
  Scale,
  Send,
} from 'lucide-react';

type HrTab = 'staff' | 'payroll' | 'attendance' | 'leave' | 'reports';

function resolveTab(param: string | null): HrTab {
  const normalized = (param || '').toLowerCase();
  if (
    normalized === 'payroll' ||
    normalized === 'attendance' ||
    normalized === 'leave' ||
    normalized === 'reports'
  ) {
    return normalized;
  }
  return 'staff';
}

function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function HrModuleContent() {
  const searchParams = useSearchParams();
  const urlTab = resolveTab(searchParams.get('tab'));
  const [manualTab, setManualTab] = useState<HrTab | null>(null);
  const [lastUrlTab, setLastUrlTab] = useState<HrTab>(urlTab);

  if (urlTab !== lastUrlTab) {
    setLastUrlTab(urlTab);
    setManualTab(null);
  }

  const activeTab: HrTab = manualTab ?? urlTab;

  // Live Queries from Dexie v5
  const employees = useLiveQuery(() => db.employees.toArray(), []) || [];
  const payrollRuns =
    useLiveQuery(() => db.payrollRuns.reverse().sortBy('period'), []) || [];
  const payrollSlips = useLiveQuery(() => db.payrollSlips.toArray(), []) || [];
  const attendanceList =
    useLiveQuery(() => db.staffAttendance.reverse().sortBy('date'), []) || [];
  const leaveRequests =
    useLiveQuery(() => db.leaveRequests.reverse().sortBy('createdAt'), []) ||
    [];
  const cashShifts = useLiveQuery(() => db.cashShifts.toArray(), []) || [];

  // UI States
  const [maskSalaries, setMaskSalaries] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [payoutFilter, setPayoutFilter] = useState<string>('ALL');

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);

  // Payroll Wizard State
  const [selectedPeriod, setSelectedPeriod] = useState('2026-10');
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollBannerMessage, setPayrollBannerMessage] = useState<
    string | null
  >(null);

  // Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attEmployeeId, setAttEmployeeId] = useState('');
  const [attDate, setAttDate] = useState('2026-10-25');
  const [attTimeIn, setAttTimeIn] = useState('08:00');
  const [attTimeOut, setAttTimeOut] = useState('17:00');
  const [attStatus, setAttStatus] = useState<AttendanceStatus>('PRESENT');
  const [attShiftType, setAttShiftType] = useState<
    'STANDARD_DAY' | 'AUCTION_EVENT_DUTY' | 'WEEKEND_DUTY'
  >('STANDARD_DAY');
  const [attLinkedShiftId, setAttLinkedShiftId] = useState('');
  const [attNotes, setAttNotes] = useState('');

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [lvEmployeeId, setLvEmployeeId] = useState('');
  const [lvType, setLvType] = useState<LeaveType>('ANNUAL');
  const [lvStartDate, setLvStartDate] = useState('2026-11-02');
  const [lvEndDate, setLvEndDate] = useState('2026-11-13');
  const [lvDays, setLvDays] = useState('10');
  const [lvReason, setLvReason] = useState('');

  // Computed KPI Metrics
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
  const monthlyGrossCommitmentGhs = activeEmployees.reduce(
    (sum, e) =>
      sum +
      e.basicSalaryGhs +
      e.transportAllowanceGhs +
      e.housingAllowanceGhs +
      e.lunchAllowanceGhs +
      e.communicationAllowanceGhs,
    0
  );
  const monthlyEmployerSsnitGhs = activeEmployees.reduce(
    (sum, e) => sum + (e.hasSsnitContribution ? e.basicSalaryGhs * 0.13 : 0),
    0
  );
  const pendingLeaveCount = leaveRequests.filter(
    (l) => l.status === 'PENDING'
  ).length;
  const authorizedCashiersCount = activeEmployees.filter(
    (e) => e.isCashier
  ).length;

  const formatMaskedGhs = (val: number) =>
    maskSalaries ? 'GH₵ ••••••' : formatGHS(val);

  // Filtered Employees
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      emp.fullName.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q) ||
      emp.ghanaCardNumber.toLowerCase().includes(q) ||
      emp.phone.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;
    const matchesPayout =
      payoutFilter === 'ALL' || emp.paymentMethod === payoutFilter;
    return matchesSearch && matchesDept && matchesPayout;
  });

  // Active Payroll Run for selected period
  const currentPeriodRun =
    payrollRuns.find((r) => r.period === selectedPeriod) || null;
  const currentPeriodSlips = payrollSlips.filter(
    (s) => s.period === selectedPeriod
  );

  // Handlers
  const handleCalculateMonthlyPayroll = async () => {
    if (employees.length === 0) return;
    setIsProcessingPayroll(true);
    setPayrollBannerMessage(null);
    try {
      const { run, slips } = buildMonthlyPayrollRun(employees, {
        period: selectedPeriod,
        processedBy: 'Mary Afriyie (Chief Accountant)',
      });
      await db.payrollRuns.put(run);
      await db.payrollSlips.bulkPut(slips);
      await syncEngine.queueMutation('payrollRuns', run.id, 'CREATE', run);
      setPayrollBannerMessage(
        `Calculated monthly salaried payroll (${selectedPeriod}) for ${slips.length} staff members with GRA PAYE & SSNIT Act 766 compliance.`
      );
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleApproveAndPostLedger = async () => {
    if (!currentPeriodRun || currentPeriodSlips.length === 0) return;
    setIsProcessingPayroll(true);
    setPayrollBannerMessage(null);
    try {
      const updated = await approveAndPostPayrollRunToLedger(
        currentPeriodRun,
        currentPeriodSlips,
        'Dr. Francis Kwaku Yeboah'
      );
      setPayrollBannerMessage(
        `Payroll ${updated.runNumber} approved and balanced double-entry Journal Entry (${updated.journalEntryId}) posted to QuickBooks General Ledger.`
      );
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleExecuteHubtelAndBankPayout = async () => {
    if (!currentPeriodRun || currentPeriodSlips.length === 0) return;
    setIsProcessingPayroll(true);
    setPayrollBannerMessage(null);
    try {
      const { updatedRun } = await executeAutomatedHubtelAndBankDisbursement(
        currentPeriodRun,
        currentPeriodSlips,
        'Dr. Francis Kwaku Yeboah'
      );
      setPayrollBannerMessage(
        `Automated Hubtel API Mobile Money disbursement (${updatedRun.hubtelBatchId}) & Bank wires executed. Net salaries settled.`
      );
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleRecordAttendance = async (e: FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === attEmployeeId) || employees[0];
    if (!emp) return;

    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) + (m || 0) / 60;
    };
    const hoursWorked = Math.max(
      0,
      Math.round((parseTime(attTimeOut) - parseTime(attTimeIn)) * 100) / 100
    );

    const record: StaffAttendance = {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      department: emp.department,
      date: attDate,
      timeIn: attTimeIn,
      timeOut: attTimeOut,
      status: attStatus,
      shiftType: attShiftType,
      hoursWorked,
      linkedShiftId: attLinkedShiftId || undefined,
      recordedBy: 'Mary Afriyie',
      notes: attNotes.trim() || undefined,
      syncStatus: 'PENDING',
    };

    await db.staffAttendance.put(record);
    await syncEngine.queueMutation(
      'staffAttendance',
      record.id,
      'CREATE',
      record
    );
    setIsAttendanceModalOpen(false);
    setAttNotes('');
  };

  const handleSubmitLeaveRequest = async (e: FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === lvEmployeeId) || employees[0];
    if (!emp || !lvReason.trim()) return;

    const record: LeaveRequest = {
      id: `lv-${Date.now()}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      department: emp.department,
      leaveType: lvType,
      startDate: lvStartDate,
      endDate: lvEndDate,
      workingDaysCount: Math.max(1, Number(lvDays) || 1),
      reason: lvReason.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };

    await db.leaveRequests.put(record);
    await syncEngine.queueMutation(
      'leaveRequests',
      record.id,
      'CREATE',
      record
    );
    setIsLeaveModalOpen(false);
    setLvReason('');
  };

  const handleLeaveDecision = async (
    leave: LeaveRequest,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const updated: LeaveRequest = {
      ...leave,
      status: decision,
      approvedBy: 'Dr. Francis Kwaku Yeboah',
      actionDate: new Date().toISOString(),
      syncStatus: 'PENDING',
    };
    await db.leaveRequests.put(updated);
    await syncEngine.queueMutation(
      'leaveRequests',
      updated.id,
      'UPDATE',
      updated
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              GRA PAYE Act 896 &bull; SSNIT Act 766
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
              Salaried Staff Only
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Staff &amp; Payroll Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Salaried workforce directory, statutory GRA PAYE &amp; SSNIT payroll engine, and automated Hubtel API Mobile Money disbursement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMaskSalaries((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {maskSalaries ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                Unmask Salaries
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                Mask Salaries
              </>
            )}
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Enroll Salaried Staff
          </Button>
        </div>
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard
          title="Salaried Workforce"
          value={`${activeEmployees.length} Staff`}
          badge={`${authorizedCashiersCount} Cashiers`}
          theme="indigo"
          icon={<Users className="w-5 h-5" />}
        />
        <GlassCard
          title="Monthly Gross Payroll"
          value={formatMaskedGhs(monthlyGrossCommitmentGhs)}
          badge="Fixed Salaries"
          theme="emerald"
          icon={<Wallet className="w-5 h-5" />}
        />
        <GlassCard
          title="Employer SSNIT (13%)"
          value={formatMaskedGhs(monthlyEmployerSsnitGhs)}
          badge="SSNIT Tier 1"
          theme="amber"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <GlassCard
          title="Leave & Shifts"
          value={`${pendingLeaveCount} Pending`}
          badge={`${attendanceList.length} Duty Logs`}
          theme="purple"
          icon={<CalendarClock className="w-5 h-5" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {[
          { id: 'staff', label: 'Salaried Staff Directory', icon: Users },
          { id: 'payroll', label: 'Payroll & Hubtel API', icon: Wallet },
          { id: 'attendance', label: 'Attendance & Till Shifts', icon: Clock },
          { id: 'leave', label: 'Leave Management', icon: CalendarDays },
          { id: 'reports', label: 'Statutory GRA & SSNIT', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setManualTab(tab.id as HrTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SALARIED STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, Ghana Card, or phone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Departments</option>
                {(Object.keys(HR_DEPARTMENT_LABELS) as HrDepartment[]).map(
                  (d) => (
                    <option key={d} value={d}>
                      {HR_DEPARTMENT_LABELS[d]}
                    </option>
                  )
                )}
              </select>

              <select
                value={payoutFilter}
                onChange={(e) => setPayoutFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Payout Modes</option>
                <option value="HUBTEL_MOMO_API">Hubtel MoMo API</option>
                <option value="BANK_TRANSFER">Commercial Bank Wire</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role &amp; Department</th>
                  <th className="py-3 px-4">Statutory IDs</th>
                  <th className="py-3 px-4 text-right">Basic Salary</th>
                  <th className="py-3 px-4 text-right">Allowances</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4">Disbursement Endpoint</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredEmployees.map((emp) => {
                  const allowances =
                    emp.transportAllowanceGhs +
                    emp.housingAllowanceGhs +
                    emp.lunchAllowanceGhs +
                    emp.communicationAllowanceGhs;
                  const gross = emp.basicSalaryGhs + allowances;
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {emp.fullName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {emp.employeeCode}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {emp.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {emp.jobTitle}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500">
                            {HR_DEPARTMENT_LABELS[emp.department]}
                          </span>
                          {emp.isCashier && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 text-[9px] font-bold uppercase">
                              Till Cashier
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-slate-800 dark:text-slate-200">
                          {emp.ghanaCardNumber}
                        </div>
                        <div className="text-slate-500">
                          SSNIT: {emp.ssnitNumber || 'Pending'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatMaskedGhs(emp.basicSalaryGhs)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatMaskedGhs(allowances)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {formatMaskedGhs(gross)}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.paymentMethod === 'HUBTEL_MOMO_API' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 text-[11px] font-semibold">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            Hubtel {emp.momoNetwork} ({emp.momoPhoneNumber})
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 text-[11px] font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-sky-600" />
                            {emp.bankName} ({emp.bankAccountNumber})
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEmployee(emp);
                            setIsEmployeeModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY PAYROLL WIZARD & AUTOMATED HUBTEL API EXECUTION */}
      {activeTab === 'payroll' && (
        <div className="space-y-5">
          {/* Control Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Payroll Period (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    setPayrollBannerMessage(null);
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              {currentPeriodRun && (
                <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Run Status &amp; Ref
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {currentPeriodRun.runNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        currentPeriodRun.status === 'DISBURSED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : currentPeriodRun.status === 'POSTED'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}
                    >
                      {currentPeriodRun.status}
                    </span>
                    {currentPeriodRun.hubtelBatchId && (
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Batch: {currentPeriodRun.hubtelBatchId}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCalculateMonthlyPayroll}
                disabled={isProcessingPayroll}
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                {currentPeriodRun
                  ? 'Recalculate Monthly Run'
                  : '1. Calculate Monthly Payroll'}
              </Button>

              {currentPeriodRun && currentPeriodRun.status === 'CALCULATED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApproveAndPostLedger}
                  disabled={isProcessingPayroll}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  2. Approve &amp; Post to Ledger
                </Button>
              )}

              {currentPeriodRun &&
                (currentPeriodRun.status === 'POSTED' ||
                  currentPeriodRun.status === 'CALCULATED') && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleExecuteHubtelAndBankPayout}
                    disabled={isProcessingPayroll}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    3. Execute Hubtel API &amp; Bank Payout
                  </Button>
                )}
            </div>
          </div>

          {payrollBannerMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{payrollBannerMessage}</span>
            </div>
          )}

          {/* Payroll Slips Table */}
          {currentPeriodRun ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Total Gross Salary
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {formatMaskedGhs(currentPeriodRun.totalGrossGhs)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    SSNIT Emp (5.5%)
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatMaskedGhs(
                      currentPeriodRun.totalSsnitEmployeeTotalGhs
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Tier 2 (5.0% Generic)
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatMaskedGhs(
                      currentPeriodRun.totalSsnitTier2EmployeeGhs
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    GRA PAYE Tax
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatMaskedGhs(currentPeriodRun.totalPayeGhs)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Employer SSNIT (13%)
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    {formatMaskedGhs(
                      currentPeriodRun.totalSsnitTier1EmployerGhs
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Total Net Take-Home
                  </span>
                  <span className="font-mono font-black text-emerald-600">
                    {formatMaskedGhs(currentPeriodRun.totalNetGhs)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4 text-right">Basic</th>
                      <th className="py-3 px-4 text-right">Allowances</th>
                      <th className="py-3 px-4 text-right">Gross Salary</th>
                      <th className="py-3 px-4 text-right">SSNIT (5.5%)</th>
                      <th className="py-3 px-4 text-right">GRA PAYE</th>
                      <th className="py-3 px-4 text-right">Net Pay</th>
                      <th className="py-3 px-4">Hubtel API / Bank Status</th>
                      <th className="py-3 px-4 text-right">Payslip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {currentPeriodSlips.map((slip) => (
                      <tr
                        key={slip.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {slip.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {slip.employeeCode} &bull; {slip.jobTitle}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatMaskedGhs(slip.basicSalaryGhs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                          {formatMaskedGhs(slip.allowancesGhs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatMaskedGhs(slip.grossSalaryGhs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400">
                          {formatMaskedGhs(slip.ssnitEmployeeGhs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                          {formatMaskedGhs(slip.payeTaxGhs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {formatMaskedGhs(slip.netPayGhs)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                slip.status === 'DISBURSED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              }`}
                            >
                              {slip.status}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {slip.paymentReference || slip.paymentMethod}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSlip(slip)}
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3">
              <Wallet className="w-8 h-8 text-indigo-600 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                No Payroll Run Calculated for {selectedPeriod}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &quot;1. Calculate Monthly Payroll&quot; above to run GRA PAYE graduated tax brackets and SSNIT Tier 1 &amp; Tier 2 calculations for all active salaried staff.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STAFF ATTENDANCE & TILL SHIFTS */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Salaried Staff Attendance &amp; Duty Register
              </h3>
              <p className="text-xs text-slate-500">
                Tracks daily clock-in/out, live auction field duty, and front-desk cash shift assignments.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAttEmployeeId(employees[0]?.id || '');
                setIsAttendanceModalOpen(true);
              }}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Log Staff Attendance
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Clock In / Out</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Duty Status</th>
                  <th className="py-3 px-4">Notes &amp; Till Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {attendanceList.map((att) => (
                  <tr
                    key={att.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {att.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {att.fullName}
                      </div>
                      <div className="font-mono text-[10px] text-indigo-600">
                        {att.employeeCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {HR_DEPARTMENT_LABELS[att.department]}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {att.timeIn || '--:--'} &rarr; {att.timeOut || '--:--'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {att.hoursWorked} hrs
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        {ATTENDANCE_STATUS_LABELS[att.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {att.notes || 'Standard duty'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE MANAGEMENT */}
      {activeTab === 'leave' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Statutory Staff Leave Register (Ghana Labour Act 651)
              </h3>
              <p className="text-xs text-slate-500">
                Manage annual, medical, maternity, and GAA professional study leave requests.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setLvEmployeeId(employees[0]?.id || '');
                setIsLeaveModalOpen(true);
              }}
            >
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Request Staff Leave
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Leave Category</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {leaveRequests.map((lv) => (
                  <tr
                    key={lv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lv.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {lv.employeeCode} &bull;{' '}
                        {HR_DEPARTMENT_LABELS[lv.department]}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {LEAVE_TYPE_LABELS[lv.leaveType]}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {lv.startDate} &rarr; {lv.endDate}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {lv.workingDaysCount} days
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs">
                      {lv.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          lv.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : lv.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        }`}
                      >
                        {lv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {lv.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleLeaveDecision(lv, 'APPROVED')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleLeaveDecision(lv, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          By {lv.approvedBy || 'Management'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STATUTORY REPORTS & GRA TAX SCHEDULE EXPORTS */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Monthly Statutory Filing Exports ({selectedPeriod})
            </h3>
            <p className="text-xs text-slate-500">
              Download official CSV schedules ready for Ghana Revenue Authority (GRA Taxpayers Portal) and SSNIT monthly returns.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    GRA Monthly PAYE Tax Return (Form DT 0107)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Graduated income tax schedule with TIN, Ghana Card, and chargeable income.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentPeriodRun}
                  onClick={() => {
                    if (!currentPeriodRun) return;
                    const csv = generateGraPayeScheduleCsv(
                      currentPeriodRun,
                      currentPeriodSlips
                    );
                    downloadCsvFile(
                      `GRA_PAYE_DT0107_${selectedPeriod}.csv`,
                      csv
                    );
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export CSV
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    SSNIT Tier 1 Contribution Schedule (13.5%)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    13.0% Employer + 0.5% Employee mandatory SSNIT Tier 1 schedule.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentPeriodRun}
                  onClick={() => {
                    if (!currentPeriodRun) return;
                    const csv = generateSsnitTier1ScheduleCsv(
                      currentPeriodRun,
                      currentPeriodSlips
                    );
                    downloadCsvFile(`SSNIT_TIER1_${selectedPeriod}.csv`, csv);
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export CSV
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    Tier 2 Occupational Pension Deduction Schedule (5.0%)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Generic 5.0% mandatory employee Tier 2 &amp; voluntary Tier 3 deduction export.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!currentPeriodRun}
                  onClick={() => {
                    if (!currentPeriodRun) return;
                    const csv = generateTier2ScheduleCsv(
                      currentPeriodRun,
                      currentPeriodSlips
                    );
                    downloadCsvFile(`PENSION_TIER2_${selectedPeriod}.csv`, csv);
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* GRA Statutory Tax Table Reference */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              GRA Monthly PAYE Graduated Tax Brackets (Act 896)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500">
                    <th className="py-2.5 px-3">Monthly Chargeable Band</th>
                    <th className="py-2.5 px-3 text-right">Band Width</th>
                    <th className="py-2.5 px-3 text-right">Tax Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {GRA_MONTHLY_TAX_BANDS.map((band) => (
                    <tr key={band.label}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {band.label}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {band.limitGhs === null
                          ? 'Above GH₵ 50,396.67'
                          : formatGHS(band.limitGhs)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {(band.rate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          key={editingEmployee?.id || 'new-emp'}
          isOpen={isEmployeeModalOpen}
          onClose={() => setIsEmployeeModalOpen(false)}
          existingEmployee={editingEmployee}
          nextSequenceNumber={employees.length + 1}
          onSaved={() => setEditingEmployee(null)}
        />
      )}

      <PayslipModal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        slip={selectedSlip}
      />

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Log Salaried Staff Attendance"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordAttendance} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">
              Staff Member
            </label>
            <select
              value={attEmployeeId}
              onChange={(e) => setAttEmployeeId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Date
              </label>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Time In
              </label>
              <input
                type="time"
                value={attTimeIn}
                onChange={(e) => setAttTimeIn(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Time Out
              </label>
              <input
                type="time"
                value={attTimeOut}
                onChange={(e) => setAttTimeOut(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Attendance Status
              </label>
              <select
                value={attStatus}
                onChange={(e) =>
                  setAttStatus(e.target.value as AttendanceStatus)
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              >
                {(
                  Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {ATTENDANCE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Shift Type
              </label>
              <select
                value={attShiftType}
                onChange={(e) =>
                  setAttShiftType(
                    e.target.value as
                      | 'STANDARD_DAY'
                      | 'AUCTION_EVENT_DUTY'
                      | 'WEEKEND_DUTY'
                  )
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              >
                <option value="STANDARD_DAY">Standard Day Shift</option>
                <option value="AUCTION_EVENT_DUTY">
                  Auction Event Field Duty
                </option>
                <option value="WEEKEND_DUTY">Weekend Duty</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">
              Linked Cash Till Shift (Optional)
            </label>
            <select
              value={attLinkedShiftId}
              onChange={(e) => setAttLinkedShiftId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            >
              <option value="">None</option>
              {cashShifts.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.shiftNumber} — {sh.cashierName} ({sh.shiftDate})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">
              Duty Notes
            </label>
            <input
              type="text"
              value={attNotes}
              onChange={(e) => setAttNotes(e.target.value)}
              placeholder="e.g. Gbawe yard vehicle inspection duty"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAttendanceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Attendance Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Submit Staff Leave Request"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Staff Member
              </label>
              <select
                value={lvEmployeeId}
                onChange={(e) => setLvEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Leave Type
              </label>
              <select
                value={lvType}
                onChange={(e) => setLvType(e.target.value as LeaveType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              >
                {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((t) => (
                  <option key={t} value={t}>
                    {LEAVE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={lvStartDate}
                onChange={(e) => setLvStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={lvEndDate}
                onChange={(e) => setLvEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Working Days
              </label>
              <input
                type="number"
                min="1"
                value={lvDays}
                onChange={(e) => setLvDays(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">
              Reason / Handover Notes *
            </label>
            <input
              type="text"
              required
              value={lvReason}
              onChange={(e) => setLvReason(e.target.value)}
              placeholder="Specify reason and duty relief officer..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsLeaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function HrPayrollPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-slate-500">
          Loading Staff &amp; Payroll Module...
        </div>
      }
    >
      <HrModuleContent />
    </Suspense>
  );
}
