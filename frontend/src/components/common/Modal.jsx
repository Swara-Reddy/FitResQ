import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity motion-safe:animate-in motion-safe:fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`inline-block w-full ${maxWidth} my-8 text-left align-middle transition-all transform bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 relative z-10 overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-200`}
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
