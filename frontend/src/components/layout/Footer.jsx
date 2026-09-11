import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  ReceiptText,
  Lock,
  ArrowRight,
  LifeBuoy,
  Bot,
  Sparkles,
} from 'lucide-react';
import FitResQLogo from '../common/FitResQLogo';

export const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200/80 dark:border-slate-800/90 bg-white dark:bg-[#070B14] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        {/* Trust Value Propositions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                24-Hour SLA Guarantee
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Automated resolution timers trigger immediate senior supervisor review if unresolved within policy window.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Direct Gateway Telemetry
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Real-time settlement verification with UPI and banking switch partners for rapid payout confirmation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Immutable Audit Trail
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Every return verification, customer message, and status update is cryptographically signed and stored.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Brand */}
        <div className="pt-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <FitResQLogo size="sm" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Customer support, order issue resolution, and automated refund tracking platform for fashion e-commerce.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Dashboard
            </Link>
            <Link to="/ai-support" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              AI Support
            </Link>
            <Link to="/cases" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Support Cases
            </Link>
            <Link to="/refunds" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Refunds
            </Link>
            <Link to="/notifications" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Notifications
            </Link>
            <Link to="/profile" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Customer Profile
            </Link>
            <Link to="/settings" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Settings
            </Link>
          </div>
        </div>

        {/* Copyright & Live Status Pill */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>FitResQ Core Telemetry: All Systems Operational</span>
          </div>

          <p>© {new Date().getFullYear()} FitResQ Support & Resolution Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
