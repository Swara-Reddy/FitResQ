import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const SlaCountdown = ({
  initialHoursRemaining = 4,
  slaState = 'At risk',
  slaTotalHours = 24,
  className = '',
}) => {
  // Compute target timestamp based on remaining hours
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, initialHoursRemaining * 3600));

  useEffect(() => {
    if (slaState === 'Breached' || slaState === 'Escalated' || secondsLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [slaState, secondsLeft]);

  const formatTimeParts = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  };

  const { hours, minutes, seconds } = formatTimeParts(secondsLeft);

  const getTheme = () => {
    switch (slaState) {
      case 'On track':
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          text: 'Within Target SLA',
          barColor: 'bg-emerald-500',
        };
      case 'At risk':
        return {
          badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          text: 'SLA Window Closing',
          barColor: 'bg-amber-500',
        };
      case 'Breached':
        return {
          badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
          dot: 'bg-rose-500',
          icon: AlertCircle,
          text: 'SLA Breached (>24h)',
          barColor: 'bg-rose-500',
        };
      case 'Escalated':
        return {
          badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
          dot: 'bg-purple-500',
          icon: ShieldAlert,
          text: 'Escalated to Agent',
          barColor: 'bg-purple-600',
        };
      default:
        return {
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: Clock,
          text: 'SLA Monitoring',
          barColor: 'bg-slate-400',
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  // Percentage elapsed
  const percentElapsed = Math.min(
    100,
    Math.max(0, Math.round(((slaTotalHours * 3600 - secondsLeft) / (slaTotalHours * 3600)) * 100))
  );

  return (
    <div className={`space-y-3 ${className}`} role="timer" aria-label={`SLA countdown: ${slaState}`}>
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${theme.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} motion-safe:animate-pulse`} />
          <span>{slaState}</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {slaTotalHours}h Configured SLA
        </span>
      </div>

      {slaState !== 'Breached' && slaState !== 'Escalated' && secondsLeft > 0 ? (
        <div className="flex items-baseline gap-2">
          <div className="flex items-center gap-1 font-mono font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
            <span>{hours}</span>
            <span className="text-slate-300 dark:text-slate-600">:</span>
            <span>{minutes}</span>
            <span className="text-slate-300 dark:text-slate-600">:</span>
            <span className="text-brand-600 dark:text-brand-400 text-xl">{seconds}</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">remaining</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
              {slaState === 'Escalated' ? 'Escalated to Agent' : 'Resolution SLA Breached'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Auto-escalated per Refund Policy Rule 3
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${theme.barColor} transition-all duration-500`}
            style={{ width: `${percentElapsed}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          <span>Started at case intake</span>
          <span>{percentElapsed}% of window elapsed</span>
        </div>
      </div>
    </div>
  );
};

export default SlaCountdown;
