import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  glass = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs dark:shadow-none text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
        hover
          ? 'motion-safe:transition-all duration-200 hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${glass ? 'backdrop-blur-md bg-white/90 dark:bg-slate-900/90' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 ${className}`}>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-base">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:px-6 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl text-slate-700 dark:text-slate-300 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
