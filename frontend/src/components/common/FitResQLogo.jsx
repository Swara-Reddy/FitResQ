import React from 'react';
import { Link } from 'react-router-dom';

export const FitResQLogo = ({
  size = 'md',
  showSubtitle = true,
  subtitleText = 'Support. Resolve. Move Forward.',
  linkTo = '/',
  iconOnly = false,
  monochrome = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  const logoMark = (
    <div
      className={`${iconSizes[size] || iconSizes.md} rounded-xl ${
        monochrome
          ? 'bg-slate-800 text-white'
          : 'bg-gradient-to-br from-[#0B0F19] to-[#1E1B4B] border border-cyan-500/30'
      } flex items-center justify-center p-1.5 shadow-md shadow-brand-600/20 group-hover:scale-105 transition-all duration-200 shrink-0 relative overflow-hidden`}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="fr-logo-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id="fr-logo-cyan" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="fr-logo-violet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>

        {/* Outer fluid ribbon - stylized F/R sweep */}
        <path
          d="M8 28V9C8 7.34315 9.34315 6 11 6H21C25.4183 6 29 9.58172 29 14C29 17.5 26.8 20.4 23.6 21.5L29 29H23.5L18.8 22H13V28H8Z"
          fill={monochrome ? '#ffffff' : 'url(#fr-logo-primary)'}
        />
        {/* Core loop negative cut */}
        <path
          d="M13 10.5H20.5C22.433 10.5 24 12.067 24 14C24 15.933 22.433 17.5 20.5 17.5H13V10.5Z"
          fill="#0B0F19"
        />
        {/* Upper forward resolution loop highlight */}
        <path
          d="M7 12C7 8.68629 9.68629 6 13 6H23C24.1046 6 25 6.89543 25 8C25 9.10457 24.1046 10 23 10H13C11.8954 10 11 10.8954 11 12C11 13.1046 10.1046 14 9 14C7.89543 14 7 13.1046 7 12Z"
          fill={monochrome ? '#cbd5e1' : 'url(#fr-logo-cyan)'}
        />
        {/* Floating resolution node spark */}
        <circle cx="28" cy="8" r="2.2" fill={monochrome ? '#ffffff' : '#38BDF8'} />
      </svg>
    </div>
  );

  if (iconOnly) {
    if (linkTo) {
      return (
        <Link to={linkTo} className={`inline-flex focus-visible:outline-none ${className}`}>
          {logoMark}
        </Link>
      );
    }
    return logoMark;
  }

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {logoMark}

      {/* Wordmark and Slogan */}
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight text-slate-900 dark:text-white ${
              titleSizes[size] || titleSizes.md
            }`}
          >
            Fit<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 dark:from-brand-400 dark:via-indigo-300 dark:to-cyan-400">ResQ</span>
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"
            title="SLA Active"
          />
        </div>

        {showSubtitle && (
          <span className="text-[10px] font-medium tracking-tight text-slate-400 dark:text-slate-400 mt-0.5">
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="focus-visible:outline-none rounded-xl inline-flex">
        {content}
      </Link>
    );
  }

  return content;
};

export default FitResQLogo;
