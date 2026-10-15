/**
 * Calculate the exact 14-day due date from a start date (defaults to now)
 */
export function calculate14DayDueDate(startDate: Date | string = new Date()): string {
  const date = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  date.setDate(date.getDate() + 14);
  return date.toISOString();
}

/**
 * Calculates days remaining from today until the due date
 */
export function getDaysRemaining(dueDateStr: string): number {
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  
  // Set both to start of day for integer day calculation
  const d1 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = d1.getTime() - d2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats date into standard readable Ghana presentation (e.g. 15 Oct 2026)
 */
export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'N/A';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats date and time into standard readable presentation (e.g. 15 Oct 2026, 02:45 PM)
 */
export function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return 'N/A';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns instalment countdown metadata: status badge color, label, and urgency
 */
export function getInstalmentWindowInfo(dueDateStr: string | undefined): {
  daysRemaining: number;
  isOverdue: boolean;
  statusLabel: string;
  badgeClass: string;
} {
  if (!dueDateStr) {
    return {
      daysRemaining: 0,
      isOverdue: false,
      statusLabel: 'No Window',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    };
  }

  const days = getDaysRemaining(dueDateStr);

  if (days < 0) {
    return {
      daysRemaining: days,
      isOverdue: true,
      statusLabel: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`,
      badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-semibold',
    };
  }

  if (days === 0) {
    return {
      daysRemaining: 0,
      isOverdue: false,
      statusLabel: 'Due Today (Final Day)',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold animate-pulse',
    };
  }

  if (days <= 3) {
    return {
      daysRemaining: days,
      isOverdue: false,
      statusLabel: `${days} day${days === 1 ? '' : 's'} remaining (Urgent)`,
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium',
    };
  }

  return {
    daysRemaining: days,
    isOverdue: false,
    statusLabel: `${days} days remaining`,
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  };
}
