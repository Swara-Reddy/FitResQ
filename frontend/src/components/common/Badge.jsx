import React from 'react';
import { getStatusBadgeTheme, getPriorityBadgeTheme } from '../../utils/formatters';

export const Badge = ({ children, status, priority, variant, className = '' }) => {
  let theme = {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  if (priority) {
    const bgClass = getPriorityBadgeTheme(priority);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${bgClass} ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            priority === 'HIGH' ? 'bg-rose-500' : priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-400'
          }`}
        />
        {children || priority}
      </span>
    );
  }

  if (status) {
    theme = getStatusBadgeTheme(status);
  } else if (variant === 'brand') {
    theme = {
      bg: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200/60 dark:border-brand-800/60',
      dot: 'bg-brand-500',
    };
  } else if (variant === 'success') {
    theme = {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    };
  } else if (variant === 'warning') {
    theme = {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60',
      dot: 'bg-amber-500',
    };
  } else if (variant === 'danger') {
    theme = {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60',
      dot: 'bg-rose-500',
    };
  }

  const isLive = ['PROCESSING', 'IN_PROGRESS', 'ESCALATED', 'REQUIRES_ACTION'].includes(
    (status || '').toUpperCase()
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${theme.bg} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${theme.dot} ${
          isLive ? 'motion-safe:animate-pulse' : ''
        }`}
      />
      <span>{children || status}</span>
    </span>
  );
};

export default Badge;
