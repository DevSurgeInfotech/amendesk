'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import { useTerminal } from '@/context/TerminalContext';
import {
  getRolePermissions,
  normalizeAppRole,
  ROLE_LABELS,
  type AppRole,
} from '@/lib/types/auth';
import { formatGHS } from '@/lib/utils/currency';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmployeeModal } from '@/components/erp/hr/EmployeeModal';
import { SalaryModal } from '@/components/erp/hr/SalaryModal';
import { PayslipModal } from '@/components/erp/hr/PayslipModal';
import {
  buildMonthlyPayrollRun,
  calculateEmployeePayslip,
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
  HR_DEPARTMENT_LABELS,
  LEAVE_TYPE_LABELS,
  type Employee,
  type HrDepartment,
  type LeaveRequest,
  type LeaveType,
  type PayrollSlip,
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
  UserCheck,
  UserX,
  Trash2,
  AlertCircle,
  Lock,
} from 'lucide-react';

type HrTab = 'staff' | 'payroll' | 'leave' | 'reports' | 'attendance';

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

function getEmployeeStatusBadge(status: Employee['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300';
    case 'ON_LEAVE':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300';
    case 'SUSPENDED':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300';
    case 'TERMINATED':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  }
}

function getEmployeeStatusLabel(status: Employee['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'ON_LEAVE':
      return 'On Leave';
    case 'SUSPENDED':
      return 'Suspended';
    case 'TERMINATED':
      return 'Terminated';
  }
}

function HrModuleContent() {
  const searchParams = useSearchParams();
  const { role, setRole, currentStaffName, activeTenant } = useTerminal();
  const activeAppRole = normalizeAppRole(role);
  const permissions = getRolePermissions(activeAppRole);

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
  const leaveRequests =
    useLiveQuery(() => db.leaveRequests.reverse().sortBy('createdAt'), []) ||
    [];

  // UI States
  const [maskSalaries, setMaskSalaries] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [payoutFilter, setPayoutFilter] = useState<string>('ALL');
  const [leaveFilter, setLeaveFilter] = useState<string>('ALL');

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryTargetEmployee, setSalaryTargetEmployee] =
    useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null
  );
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);

  // Payroll Wizard State
  const [selectedPeriod, setSelectedPeriod] = useState('2026-10');
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollBannerMessage, setPayrollBannerMessage] = useState<
    string | null
  >(null);

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
  const unconfiguredSalaryCount = activeEmployees.filter(
    (e) => e.basicSalaryGhs <= 0
  ).length;

  const formatMaskedGhs = (val: number) => {
    if (!permissions.canConfigureSalaryAndPayroll) return 'Restricted';
    return maskSalaries ? 'GH₵ ••••••' : formatGHS(val);
  };

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
    const matchesStatus =
      statusFilter === 'ALL' || emp.status === statusFilter;
    const matchesPayout =
      payoutFilter === 'ALL' || emp.paymentMethod === payoutFilter;
    return matchesSearch && matchesDept && matchesStatus && matchesPayout;
  });

  // Filtered Leave Requests
  const filteredLeaveRequests = leaveRequests.filter((lv) => {
    if (leaveFilter !== 'ALL' && lv.status !== leaveFilter) return false;
    return true;
  });

  // Active Payroll Run for selected period (plus live fallback preview for payroll & reports)
  const currentPeriodRun =
    payrollRuns.find((r) => r.period === selectedPeriod) || null;
  const currentPeriodSlips = payrollSlips.filter(
    (s) => s.period === selectedPeriod
  );

  const reportRunAndSlips = (() => {
    if (currentPeriodRun && currentPeriodSlips.length > 0) {
      return { run: currentPeriodRun, slips: currentPeriodSlips };
    }
    return buildMonthlyPayrollRun(employees, {
      period: selectedPeriod,
      processedBy: currentStaffName || 'Chief Accountant',
    });
  })();

  // Staff Directory Row Actions
  const handleOpenEmployeePayslip = (emp: Employee, idx: number) => {
    if (!permissions.canConfigureSalaryAndPayroll) return;
    const existingForPeriod = payrollSlips.find(
      (s) => s.employeeId === emp.id && s.period === selectedPeriod
    );
    if (existingForPeriod) {
      setSelectedSlip(existingForPeriod);
      return;
    }
    const latestForEmp = payrollSlips.find((s) => s.employeeId === emp.id);
    if (latestForEmp) {
      setSelectedSlip(latestForEmp);
      return;
    }
    const generated = calculateEmployeePayslip(emp, {
      runId: `pr-${selectedPeriod}`,
      period: selectedPeriod,
      slipSequenceNumber: idx + 1,
    });
    setSelectedSlip(generated);
  };

  const handleOpenSalaryModal = (emp: Employee | null) => {
    if (!permissions.canConfigureSalaryAndPayroll) return;
    setSalaryTargetEmployee(emp);
    setIsSalaryModalOpen(true);
  };

  const handleToggleEmployeeStatus = async (emp: Employee) => {
    if (!permissions.canApproveLeaveAndStatus) return;
    const nextStatus: Employee['status'] =
      emp.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updated: Employee = {
      ...emp,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    await db.employees.put(updated);
    await syncEngine.queueMutation('employees', updated.id, 'UPDATE', updated);
  };

  const handleConfirmDeleteEmployee = async () => {
    if (!deletingEmployee || !permissions.canApproveLeaveAndStatus) return;
    await db.employees.delete(deletingEmployee.id);
    await syncEngine.queueMutation(
      'employees',
      deletingEmployee.id,
      'DELETE',
      { id: deletingEmployee.id }
    );
    setDeletingEmployee(null);
  };

  // Payroll Handlers
  const handleCalculateMonthlyPayroll = async () => {
    if (employees.length === 0 || !permissions.canConfigureSalaryAndPayroll)
      return;
    setIsProcessingPayroll(true);
    setPayrollBannerMessage(null);
    try {
      const { run, slips } = buildMonthlyPayrollRun(employees, {
        period: selectedPeriod,
        processedBy: currentStaffName || 'Chief Accountant',
      });
      await db.payrollRuns.put(run);
      await db.payrollSlips.bulkPut(slips);
      await syncEngine.queueMutation('payrollRuns', run.id, 'CREATE', run);
      setPayrollBannerMessage(
        `Calculated monthly payroll (${selectedPeriod}) for ${slips.length} salaried staff.`
      );
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleApproveAndPostLedger = async () => {
    if (
      !currentPeriodRun ||
      currentPeriodSlips.length === 0 ||
      !permissions.canDisbursePayrollAndApproveLedger
    )
      return;
    setIsProcessingPayroll(true);
    setPayrollBannerMessage(null);
    try {
      const updated = await approveAndPostPayrollRunToLedger(
        currentPeriodRun,
        currentPeriodSlips,
        currentStaffName || 'Dr. Francis Kwaku Yeboah'
      );
      setPayrollBannerMessage(
        `Payroll ${updated.runNumber} approved and posted to General Ledger (${updated.journalEntryId}).`
      );
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleExecuteHubtelAndBankPayout = async () => {
    if (
      !currentPeriodRun ||
      currentPeriodSlips.length === 0 ||
      !permissions.canDisbursePayrollAndApproveLedger
    )
      return;
    setIsProcessingPayroll(true);
    setPayrollBannerMessage(null);
    try {
      const { updatedRun } = await executeAutomatedHubtelAndBankDisbursement(
        currentPeriodRun,
        currentPeriodSlips,
        currentStaffName || 'Dr. Francis Kwaku Yeboah'
      );
      setPayrollBannerMessage(
        `Salaries disbursed via Hubtel MoMo (${updatedRun.hubtelBatchId}) & Bank Transfer.`
      );
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  // Leave Handlers
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
    if (!permissions.canApproveLeaveAndStatus) return;
    const updated: LeaveRequest = {
      ...leave,
      status: decision,
      approvedBy: currentStaffName || 'Dr. Francis Kwaku Yeboah',
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

    const emp = employees.find((e) => e.id === leave.employeeId);
    if (emp && decision === 'APPROVED') {
      const updatedEmp: Employee = {
        ...emp,
        status: 'ON_LEAVE',
        updatedAt: new Date().toISOString(),
      };
      await db.employees.put(updatedEmp);
    }
  };

  const handleDeleteLeaveRequest = async (leaveId: string) => {
    if (!permissions.canApproveLeaveAndStatus) return;
    await db.leaveRequests.delete(leaveId);
    await syncEngine.queueMutation('leaveRequests', leaveId, 'DELETE', {
      id: leaveId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Clean Module Header with RBAC Role Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Staff &amp; Payroll
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Clock className="w-3 h-3 text-indigo-600" />
              8:00 AM – 5:00 PM
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Staff onboarding &amp; directory, monthly salary administration, and statutory GRA / SSNIT filings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* RBAC Role Indicator: Interactive Simulator in Sandbox for Dev Surge testing; Static secure badge in Production */}
          {activeTenant.isSandbox ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase text-slate-400">
                RBAC Simulator:
              </span>
              <select
                value={activeAppRole}
                onChange={(e) => setRole(e.target.value as AppRole)}
                aria-label="Active RBAC Role Simulator"
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                  <option
                    key={r}
                    value={r}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {r} ({ROLE_LABELS[r]})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Role:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activeAppRole} ({ROLE_LABELS[activeAppRole]})
              </span>
            </div>
          )}

          {permissions.canConfigureSalaryAndPayroll && (
            <button
              type="button"
              onClick={() => setMaskSalaries((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {maskSalaries ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  Show Salaries
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  Hide Salaries
                </>
              )}
            </button>
          )}

          {permissions.canOnboardStaff && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingEmployee(null);
                setIsEmployeeModalOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Add Staff
            </Button>
          )}
        </div>
      </div>

      {/* 4-Card KPI Strip (RBAC-aware: hides salary figures from Secretary / non-finance roles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard
          title="Salaried Workforce"
          value={`${activeEmployees.length} Staff`}
          theme="indigo"
          icon={<Users className="w-5 h-5" />}
          onClick={() => setManualTab('staff')}
        />
        <GlassCard
          title="Monthly Gross Payroll"
          value={
            permissions.canConfigureSalaryAndPayroll
              ? formatMaskedGhs(monthlyGrossCommitmentGhs)
              : 'Restricted (Payroll)'
          }
          theme="emerald"
          icon={<Wallet className="w-5 h-5" />}
          onClick={() => setManualTab('payroll')}
        />
        <GlassCard
          title="Employer SSNIT (13%)"
          value={
            permissions.canConfigureSalaryAndPayroll
              ? formatMaskedGhs(monthlyEmployerSsnitGhs)
              : 'Restricted (Payroll)'
          }
          theme="amber"
          icon={<ShieldCheck className="w-5 h-5" />}
          onClick={() => setManualTab('reports')}
        />
        <GlassCard
          title="Leave Requests"
          value={`${pendingLeaveCount} Pending`}
          theme="purple"
          icon={<CalendarClock className="w-5 h-5" />}
          onClick={() => setManualTab('leave')}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {[
          {
            id: 'staff',
            label: 'Staff Directory',
            icon: Users,
            locked: false,
          },
          {
            id: 'payroll',
            label: 'Monthly Payroll & Salaries',
            icon: Wallet,
            locked: !permissions.canConfigureSalaryAndPayroll,
          },
          {
            id: 'leave',
            label: 'Leave Requests',
            icon: CalendarDays,
            locked: false,
          },
          {
            id: 'reports',
            label: 'GRA & SSNIT Filings',
            icon: Scale,
            locked: !permissions.canConfigureSalaryAndPayroll,
          },
          {
            id: 'attendance',
            label: 'Attendance',
            icon: Clock,
            notConfigured: true,
            locked: false,
          },
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
              <span>{tab.label}</span>
              {tab.locked && (
                <Lock
                  className={`w-3 h-3 ${
                    isActive ? 'text-white/80' : 'text-amber-600'
                  }`}
                />
              )}
              {tab.notConfigured && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}
                >
                  Not Configured
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active (8am – 5pm)</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              {permissions.canConfigureSalaryAndPayroll && (
                <select
                  value={payoutFilter}
                  onChange={(e) => setPayoutFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">All Payout Modes</option>
                  <option value="HUBTEL_MOMO_API">Mobile Money (Hubtel)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  <th className="py-3 px-4 whitespace-nowrap">Staff Member</th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    Role &amp; Department
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">Statutory IDs</th>
                  {permissions.canConfigureSalaryAndPayroll && (
                    <th className="py-3 px-4 text-right whitespace-nowrap">
                      Monthly Pay
                    </th>
                  )}
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredEmployees.map((emp, idx) => {
                  const allowances =
                    emp.transportAllowanceGhs +
                    emp.housingAllowanceGhs +
                    emp.lunchAllowanceGhs +
                    emp.communicationAllowanceGhs;
                  const gross = emp.basicSalaryGhs + allowances;
                  const hasSalarySet = emp.basicSalaryGhs > 0;
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {emp.fullName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
                          <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {emp.employeeCode}
                          </span>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">
                            {emp.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {emp.jobTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                          {HR_DEPARTMENT_LABELS[emp.department]}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {emp.ghanaCardNumber}
                        </div>
                        <div className="text-slate-500 whitespace-nowrap">
                          SSNIT: {emp.ssnitNumber || 'Pending'}
                        </div>
                      </td>
                      {permissions.canConfigureSalaryAndPayroll && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {hasSalarySet ? (
                            <>
                              <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                {formatMaskedGhs(gross)}
                              </div>
                              <div className="font-mono text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                                Basic: {formatMaskedGhs(emp.basicSalaryGhs)}{' '}
                                &bull; Allow: {formatMaskedGhs(allowances)}
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenSalaryModal(emp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold cursor-pointer whitespace-nowrap"
                            >
                              <Wallet className="w-3 h-3 text-amber-600" />
                              Set Salary in Payroll
                            </button>
                          )}
                        </td>
                      )}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${getEmployeeStatusBadge(
                              emp.status
                            )}`}
                          >
                            {getEmployeeStatusLabel(emp.status)}
                          </span>
                          {permissions.canConfigureSalaryAndPayroll &&
                            (emp.paymentMethod === 'HUBTEL_MOMO_API' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 text-[11px] font-semibold whitespace-nowrap">
                                <Smartphone className="w-3 h-3 text-emerald-600 shrink-0" />
                                {emp.momoNetwork} ({emp.momoPhoneNumber})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 text-[11px] font-semibold whitespace-nowrap">
                                <Building2 className="w-3 h-3 text-sky-600 shrink-0" />
                                {emp.bankName}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setViewingEmployee(emp)}
                            title="View Staff Profile"
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            View
                          </button>

                          {permissions.canConfigureSalaryAndPayroll && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenSalaryModal(emp)}
                                title="Set or Edit Staff Salary in Payroll"
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                Salary
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEmployeePayslip(emp, idx)
                                }
                                title="View & Print Payslip"
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Payslip
                              </button>
                            </>
                          )}

                          {permissions.canOnboardStaff && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmployee(emp);
                                setIsEmployeeModalOpen(true);
                              }}
                              title="Edit Staff Details & Statutory IDs"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                              Edit
                            </button>
                          )}

                          {permissions.canManageLeave && (
                            <button
                              type="button"
                              onClick={() => {
                                setLvEmployeeId(emp.id);
                                setIsLeaveModalOpen(true);
                              }}
                              title="Record Leave for Staff"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <CalendarDays className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              Leave
                            </button>
                          )}

                          {permissions.canApproveLeaveAndStatus && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleEmployeeStatus(emp)}
                                title={
                                  emp.status === 'ACTIVE'
                                    ? 'Suspend Staff'
                                    : 'Activate Staff'
                                }
                                className={`inline-flex items-center p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                                  emp.status === 'ACTIVE'
                                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                                }`}
                              >
                                {emp.status === 'ACTIVE' ? (
                                  <UserX className="w-3.5 h-3.5" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingEmployee(emp)}
                                title="Remove Staff Record"
                                className="inline-flex items-center p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-400 transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY PAYROLL & SALARY CONFIGURATION */}
      {activeTab === 'payroll' &&
        (permissions.canConfigureSalaryAndPayroll ? (
          <div className="space-y-5">
            {/* Control Bar */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Payroll Month
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
                      Run Status
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
                    </div>
                  </div>
                )}

                {unconfiguredSalaryCount > 0 && (
                  <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {unconfiguredSalaryCount} New Staff Awaiting Salary Setup
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenSalaryModal(null)}
                >
                  <Wallet className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  Set / Edit Staff Salary
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCalculateMonthlyPayroll}
                  disabled={isProcessingPayroll}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  {currentPeriodRun
                    ? 'Recalculate Payroll'
                    : 'Calculate Payroll'}
                </Button>

                {currentPeriodRun &&
                  currentPeriodRun.status === 'CALCULATED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApproveAndPostLedger}
                      disabled={isProcessingPayroll}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Approve &amp; Post to Accounts
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
                      Disburse Salaries (MoMo &amp; Bank)
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

            {/* Payroll & Salary Structure Table (Always visible so Accountant/Owner can configure salaries anytime) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Total Gross Pay
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {formatMaskedGhs(reportRunAndSlips.run.totalGrossGhs)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    SSNIT Employee (5.5%)
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    {formatMaskedGhs(
                      reportRunAndSlips.run.totalSsnitEmployeeTotalGhs
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    GRA PAYE Tax
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatMaskedGhs(reportRunAndSlips.run.totalPayeGhs)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Employer SSNIT (13%)
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    {formatMaskedGhs(
                      reportRunAndSlips.run.totalSsnitTier1EmployerGhs
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Total Net Take-Home
                  </span>
                  <span className="font-mono font-black text-emerald-600">
                    {formatMaskedGhs(reportRunAndSlips.run.totalNetGhs)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      <th className="py-3 px-4 whitespace-nowrap">
                        Staff Member
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Basic
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Allowances
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Gross Pay
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        SSNIT (5.5%)
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        GRA PAYE
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Net Pay
                      </th>
                      <th className="py-3 px-4 whitespace-nowrap">
                        Payout Status
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">
                        Salary &amp; Payslip
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {reportRunAndSlips.slips.map((slip) => {
                      const empRecord =
                        employees.find((e) => e.id === slip.employeeId) || null;
                      const isUnset = slip.basicSalaryGhs <= 0;
                      return (
                        <tr
                          key={slip.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {slip.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 whitespace-nowrap">
                              {slip.employeeCode} &bull; {slip.jobTitle}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                            {isUnset ? (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                                Not Set
                              </span>
                            ) : (
                              formatMaskedGhs(slip.basicSalaryGhs)
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatMaskedGhs(slip.allowancesGhs)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatMaskedGhs(slip.grossSalaryGhs)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400 whitespace-nowrap">
                            {formatMaskedGhs(slip.ssnitEmployeeGhs)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {formatMaskedGhs(slip.payeTaxGhs)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            {formatMaskedGhs(slip.netPayGhs)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                                  slip.status === 'DISBURSED'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                }`}
                              >
                                {currentPeriodRun ? slip.status : 'PREVIEW'}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                {slip.paymentReference ||
                                  (slip.paymentMethod === 'HUBTEL_MOMO_API'
                                    ? `MoMo (${slip.momoNetwork || 'MTN'})`
                                    : slip.bankName || 'Bank')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenSalaryModal(empRecord)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                  isUnset
                                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <Wallet className="w-3.5 h-3.5 shrink-0" />
                                {isUnset ? 'Set Salary' : 'Edit Salary'}
                              </button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSlip(slip)}
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                Payslip
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* RBAC Locked State for Secretary / Non-Finance Roles */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
            <div className="max-w-lg mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  RBAC Restricted — {activeAppRole}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Salary &amp; Monthly Payroll Access Restricted
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your current role (
                  <strong>{ROLE_LABELS[activeAppRole]}</strong>) is authorized to
                  add staff members and manage the Staff Directory &amp; Leave
                  Requests, but cannot view or configure staff salaries. Salary
                  administration and payroll disbursement are restricted to{' '}
                  <strong>Managing Director (OWNER)</strong> and{' '}
                  <strong>Chief Accountant (ACCOUNTANT)</strong>.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setManualTab('staff')}
                >
                  Return to Staff Directory
                </Button>
              </div>
            </div>
          </div>
        ))}

      {/* TAB 3: LEAVE REQUESTS */}
      {activeTab === 'leave' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLeaveFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      leaveFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Requests'
                      : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                )
              )}
            </div>

            {permissions.canManageLeave && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setLvEmployeeId(employees[0]?.id || '');
                  setIsLeaveModalOpen(true);
                }}
              >
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                Request Leave
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  <th className="py-3 px-4 whitespace-nowrap">Staff Member</th>
                  <th className="py-3 px-4 whitespace-nowrap">Leave Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Dates</th>
                  <th className="py-3 px-4 whitespace-nowrap">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredLeaveRequests.map((lv) => (
                  <tr
                    key={lv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {lv.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500 whitespace-nowrap">
                        {lv.employeeCode} &bull;{' '}
                        {HR_DEPARTMENT_LABELS[lv.department]}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {LEAVE_TYPE_LABELS[lv.leaveType]}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {lv.startDate} &rarr; {lv.endDate}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                      {lv.workingDaysCount} days
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 min-w-[220px]">
                      {lv.reason}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
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
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {lv.status === 'PENDING' &&
                        permissions.canApproveLeaveAndStatus ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() =>
                                handleLeaveDecision(lv, 'APPROVED')
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleLeaveDecision(lv, 'REJECTED')
                              }
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 mr-1">
                            {lv.status === 'PENDING'
                              ? 'Awaiting Approval'
                              : `By ${lv.approvedBy || 'Management'}`}
                          </span>
                        )}
                        {permissions.canApproveLeaveAndStatus && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLeaveRequest(lv.id)}
                            title="Delete Leave Request"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STATUTORY GRA & SSNIT FILINGS */}
      {activeTab === 'reports' &&
        (permissions.canConfigureSalaryAndPayroll ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Cards */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Monthly GRA &amp; SSNIT Returns ({selectedPeriod})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Export official CSV schedules for GRA Taxpayers Portal and SSNIT filings.
                  </p>
                </div>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      GRA Monthly PAYE Tax Schedule (Form DT 0107)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Total PAYE Payable:{' '}
                      <strong className="font-mono text-rose-600">
                        {formatMaskedGhs(reportRunAndSlips.run.totalPayeGhs)}
                      </strong>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csv = generateGraPayeScheduleCsv(
                        reportRunAndSlips.run,
                        reportRunAndSlips.slips
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
                      SSNIT Tier 1 Schedule (13.5% Remittance)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      13.0% Employer + 0.5% Employee:{' '}
                      <strong className="font-mono text-indigo-600">
                        {formatMaskedGhs(
                          reportRunAndSlips.run.totalSsnitTier1EmployerGhs +
                            (reportRunAndSlips.run.totalSsnitEmployeeTotalGhs -
                              reportRunAndSlips.run.totalSsnitTier2EmployeeGhs)
                        )}
                      </strong>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csv = generateSsnitTier1ScheduleCsv(
                        reportRunAndSlips.run,
                        reportRunAndSlips.slips
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
                      Tier 2 Pension Schedule (5.0% Employee)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Total Tier 2 Deduction:{' '}
                      <strong className="font-mono text-amber-600">
                        {formatMaskedGhs(
                          reportRunAndSlips.run.totalSsnitTier2EmployeeGhs
                        )}
                      </strong>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csv = generateTier2ScheduleCsv(
                        reportRunAndSlips.run,
                        reportRunAndSlips.slips
                      );
                      downloadCsvFile(
                        `PENSION_TIER2_${selectedPeriod}.csv`,
                        csv
                      );
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
                GRA Monthly PAYE Tax Brackets (Act 896)
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
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
            <div className="max-w-lg mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  RBAC Restricted — {activeAppRole}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  GRA &amp; SSNIT Statutory Filings Restricted
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Statutory tax and pension schedules contain confidential
                  salary data and are restricted to{' '}
                  <strong>Managing Director (OWNER)</strong> and{' '}
                  <strong>Chief Accountant (ACCOUNTANT)</strong>.
                </p>
              </div>
            </div>
          </div>
        ))}

      {/* TAB 5: ATTENDANCE (NOT CONFIGURED — 8:00 AM - 5:00 PM) */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xs">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Not Configured
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Staff Attendance Tracking is Not Configured
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Amen Mart operates standard working hours of{' '}
                <strong>8:00 AM – 5:00 PM</strong> with a fixed monthly salaried
                payroll structure. Biometric clock-in hardware is not configured
                for this workspace.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Biometric / Clock-In Terminal
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  Not Configured
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Standard Operating Hours
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                  8:00 AM – 5:00 PM
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Payroll Calculation Mode
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Fixed Monthly Salary
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setManualTab('staff')}
              >
                View Staff Directory
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setManualTab('leave')}
              >
                Manage Leave Requests
              </Button>
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

      {isSalaryModalOpen && permissions.canConfigureSalaryAndPayroll && (
        <SalaryModal
          key={salaryTargetEmployee?.id || 'salary-cfg'}
          isOpen={isSalaryModalOpen}
          onClose={() => {
            setIsSalaryModalOpen(false);
            setSalaryTargetEmployee(null);
          }}
          employees={employees}
          initialEmployee={salaryTargetEmployee}
          onSaved={(empName) => {
            setPayrollBannerMessage(
              `Salary and payout configuration updated for ${empName}.`
            );
          }}
        />
      )}

      {/* View Staff Profile Modal */}
      <Modal
        isOpen={Boolean(viewingEmployee)}
        onClose={() => setViewingEmployee(null)}
        title={
          viewingEmployee
            ? `Staff Profile — ${viewingEmployee.fullName}`
            : 'Staff Profile'
        }
        maxWidth="2xl"
      >
        {viewingEmployee &&
          (() => {
            const previewSlip = calculateEmployeePayslip(viewingEmployee, {
              runId: `pr-${selectedPeriod}`,
              period: selectedPeriod,
              slipSequenceNumber: 1,
            });
            return (
              <div className="space-y-4 text-xs">
                <div className="flex items-start justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {viewingEmployee.fullName}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      {viewingEmployee.jobTitle} &bull;{' '}
                      {HR_DEPARTMENT_LABELS[viewingEmployee.department]}
                    </div>
                    <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">
                      {viewingEmployee.employeeCode} &bull; Hired:{' '}
                      {viewingEmployee.dateHired} &bull; Hours: 8:00 AM – 5:00 PM
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getEmployeeStatusBadge(
                      viewingEmployee.status
                    )}`}
                  >
                    {getEmployeeStatusLabel(viewingEmployee.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Phone Number
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                      {viewingEmployee.phone}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Ghana Card
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white mt-0.5 block">
                      {viewingEmployee.ghanaCardNumber}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      SSNIT &amp; TIN
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {viewingEmployee.ssnitNumber || 'N/A'} /{' '}
                      {viewingEmployee.tinNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                {permissions.canConfigureSalaryAndPayroll ? (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="font-black uppercase text-[10px] tracking-wider text-indigo-600 dark:text-indigo-400">
                      Monthly Salary &amp; Statutory Breakdown (Payroll RBAC)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Basic Salary
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatMaskedGhs(previewSlip.basicSalaryGhs)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Allowances
                        </span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {formatMaskedGhs(previewSlip.allowancesGhs)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Gross Salary
                        </span>
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {formatMaskedGhs(previewSlip.grossSalaryGhs)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          SSNIT Employee (5.5%)
                        </span>
                        <span className="font-mono font-semibold text-amber-600">
                          {formatMaskedGhs(previewSlip.ssnitEmployeeGhs)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          GRA PAYE Tax
                        </span>
                        <span className="font-mono font-semibold text-rose-600">
                          {formatMaskedGhs(previewSlip.payeTaxGhs)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Net Take-Home Pay
                        </span>
                        <span className="font-mono font-black text-emerald-600">
                          {formatMaskedGhs(previewSlip.netPayGhs)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-500">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Salary &amp; payout figures are restricted to Chief Accountant and Managing Director.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">
                    {permissions.canConfigureSalaryAndPayroll ? (
                      <>
                        Payout:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {viewingEmployee.paymentMethod === 'HUBTEL_MOMO_API'
                            ? `Mobile Money (${viewingEmployee.momoNetwork} ${viewingEmployee.momoPhoneNumber})`
                            : `${viewingEmployee.bankName} (${viewingEmployee.bankAccountNumber})`}
                        </strong>
                      </>
                    ) : (
                      <span>Standard Hours: 8:00 AM – 5:00 PM</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {permissions.canConfigureSalaryAndPayroll && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const emp = viewingEmployee;
                            setViewingEmployee(null);
                            handleOpenSalaryModal(emp);
                          }}
                        >
                          <Wallet className="w-3.5 h-3.5 mr-1" />
                          Configure Salary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const emp = viewingEmployee;
                            setViewingEmployee(null);
                            handleOpenEmployeePayslip(emp, 0);
                          }}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Payslip
                        </Button>
                      </>
                    )}
                    {permissions.canOnboardStaff && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const emp = viewingEmployee;
                          setViewingEmployee(null);
                          setEditingEmployee(emp);
                          setIsEmployeeModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Delete Staff Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingEmployee)}
        onClose={() => setDeletingEmployee(null)}
        title="Remove Staff Member"
        maxWidth="md"
      >
        {deletingEmployee && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-slate-900 dark:text-white">
                {deletingEmployee.fullName} ({deletingEmployee.employeeCode})
              </strong>{' '}
              from the staff directory?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingEmployee(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteEmployee}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Remove Staff
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <PayslipModal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        slip={selectedSlip}
      />

      {/* Leave Request Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Request Staff Leave"
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
          Loading Staff &amp; Payroll...
        </div>
      }
    >
      <HrModuleContent />
    </Suspense>
  );
}
