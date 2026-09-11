export const formatCurrency = (amount, currency = 'INR') => {
  if (typeof amount !== 'number') return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

export const getStatusBadgeTheme = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'RESOLVED':
    case 'ITEM VERIFIED':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
      };
    case 'PROCESSING':
    case 'IN_PROGRESS':
    case 'REFUND PROCESSING':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/60',
        dot: 'bg-blue-500',
      };
    case 'REQUIRES_ACTION':
    case 'IN REVIEW':
    case 'UNDER REVIEW':
    case 'PENDING':
    case 'OPEN':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60',
        dot: 'bg-amber-500',
      };
    case 'FAILED':
    case 'BREACHED':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60',
        dot: 'bg-rose-500',
      };
    case 'ESCALATED':
    case 'ESCALATED TO AGENT':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/60',
        dot: 'bg-purple-500',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
};

export const getPriorityBadgeTheme = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60';
    case 'MEDIUM':
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60';
    case 'LOW':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};
