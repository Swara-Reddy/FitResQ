import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useSupport } from '../../context/SupportContext';

export const CopyButton = ({
  text,
  label = 'ID',
  className = '',
  size = 'sm',
  showText = false,
}) => {
  const { addToast } = useSupport();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;

    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      addToast(`${label} ${text} copied to clipboard`, 'info', 'Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className={`inline-flex items-center gap-1 p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
    >
      {copied ? (
        <Check className={`${iconSizes[size]} text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-150`} />
      ) : (
        <Copy className={`${iconSizes[size]} transition-transform active:scale-90`} />
      )}
      {showText && (
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 select-none">
          {copied ? 'Copied' : 'Copy'}
        </span>
      )}
    </button>
  );
};

export default CopyButton;
