import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const Toast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800 shadow-slate-950/20'
              : toast.type === 'warning'
              ? 'bg-amber-900/95 text-amber-50 border-amber-800/80 shadow-amber-950/30'
              : toast.type === 'error'
              ? 'bg-rose-900/95 text-rose-50 border-rose-800/80 shadow-rose-950/30'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            ) : (
              <Info className="w-4 h-4 text-brand-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-xs font-bold text-white mb-0.5">{toast.title}</p>
            )}
            <p className="text-xs text-slate-200 leading-snug">{toast.message}</p>
          </div>

          {onDismiss && (
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Toast;
