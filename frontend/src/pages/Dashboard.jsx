import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LifeBuoy,
  ReceiptText,
  AlertTriangle,
  Clock,
  Bot,
  ArrowRight,
  Search,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  Bell,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Layers,
  Wallet,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import HeroSection from '../components/dashboard/HeroSection';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import CopyButton from '../components/common/CopyButton';
import ProductThumbnail from '../utils/productImages';
import { formatCurrency, formatDate } from '../utils/formatters';
import aiCompanionImg from '../assets/hero/ai-companion.png';

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    cases,
    openCases,
    refunds,
    pendingRefunds,
    casesRequiringAttention,
    notifications,
    customerProfile,
    isLiveBackendConnected,
    refundPolicyText,
  } = useSupport();

  // Sum of pending refunds
  const totalPendingRefundsAmount = pendingRefunds.reduce((acc, r) => acc + r.amount, 0);

  // Operational SLA health counts
  const activeSlaWithin = openCases.filter((c) => !c.slaEscalated && c.slaHoursRemaining > 0).length;
  const activeSlaBreached = openCases.filter((c) => c.slaEscalated || c.slaHoursRemaining === 0).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. CINEMATIC DARK AI HERO (70-80% VIEWPORT HEIGHT) */}
      {/* ========================================================================= */}
      <HeroSection />

      {/* Main Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* ========================================================================= */}
        {/* 2. CUSTOMER GREETING & STATUS BANNER */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="wave">
              👋
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Hello, {customerProfile?.name || 'Customer'}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Here's what's happening with your support cases and refunds.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {isLiveBackendConnected && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>AWS Live Gateway Connected</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>We're here to help, always.</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. KEY SUPPORT STATISTICS (4 HORIZONTAL CARDS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Stat 1: Active Support Cases */}
          <div
            onClick={() => navigate('/cases')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-brand-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Active Support Cases
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {openCases.length}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                +1 from last week
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Open return & order issues
            </p>
          </div>

          {/* Stat 2: Pending Refunds */}
          <div
            onClick={() => navigate('/refunds')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Pending Refunds
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(totalPendingRefundsAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pendingRefunds.length} in processing/review
              </p>
              {/* Mini Sparkline Bar Indicator */}
              <div className="flex items-end gap-1 h-3.5">
                <div className="w-1 bg-emerald-300 dark:bg-emerald-700 h-2 rounded-full" />
                <div className="w-1 bg-emerald-400 dark:bg-emerald-600 h-3 rounded-full" />
                <div className="w-1 bg-emerald-500 dark:bg-emerald-500 h-3.5 rounded-full" />
              </div>
            </div>
          </div>

          {/* Stat 3: Cases Requiring Attention */}
          <div
            onClick={() => navigate('/cases')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Cases Requiring Attention
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {casesRequiringAttention.length}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
                High Priority
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Needs your review or feedback
            </p>
          </div>

          {/* Stat 4: SLA Health Status */}
          <div
            onClick={() => navigate('/cases')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                SLA Health Status
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                On Track
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All active SLAs within timeline
              </p>
              <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" />
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 4. THREE-COLUMN SUPPORT RESOLUTION GRID (MATCHING REFERENCE) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 1: RECENT SUPPORT CASES (4.5 COLS) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Recent Support Cases
                  </h3>
                </div>
                <Link
                  to="/cases"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Cases List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cases.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/cases/${item.id}`)}
                    className="py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-all cursor-pointer group flex items-start gap-3.5"
                  >
                    {/* Realistic Product Photography */}
                    <ProductThumbnail itemName={item.itemName} category={item.category} size="lg" />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.id}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Order {item.orderNumber || item.orderId}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                            item.priority === 'HIGH'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                          {item.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {item.itemName}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        Category: {item.category || item.issueType}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {formatCurrency(item.refundAmount)}
                      </span>
                      <span className="text-[10px] font-medium text-amber-500 dark:text-amber-400 flex items-center justify-end gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.slaHoursRemaining > 0 ? `${item.slaHoursRemaining}h remaining` : 'Escalated'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                to="/cases"
                className="text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
              >
                Inspect all active cases & SLA details →
              </Link>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 2: PENDING REFUNDS WITH 4-STEP PROGRESS TRACK (4.5 COLS) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Pending Refunds
                </h3>
                <Link
                  to="/refunds"
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Refunds List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {refunds.slice(0, 3).map((ref, idx) => (
                  <div
                    key={ref.id}
                    onClick={() => navigate(`/cases/${ref.caseId}`)}
                    className="py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <ProductThumbnail itemName={ref.itemName || (idx === 0 ? 'Classic Cotton Oversized Shirt' : idx === 1 ? 'Relaxed Fit Linen Trousers' : 'Merino Wool Blend Cardigan')} size="md" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {ref.itemName || (idx === 0 ? 'Classic Cotton Oversized Shirt' : idx === 1 ? 'Relaxed Fit Linen Trousers' : 'Merino Wool Blend Cardigan')}
                          </h4>
                          <span className="text-xs font-black text-slate-900 dark:text-white shrink-0 ml-2">
                            {formatCurrency(ref.amount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono">Order {ref.orderNumber || ref.orderId}</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                            ● {ref.status}
                          </span>
                        </div>

                        {/* Visual 4-Step Progress Track */}
                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="relative flex items-center justify-between text-[9px] font-bold text-slate-400">
                            <span className="text-brand-600 dark:text-brand-400">Initiated</span>
                            <span className="text-cyan-500 font-extrabold">{ref.status === 'UNDER_REVIEW' ? 'Under Review' : 'Processing'}</span>
                            <span>Expected</span>
                            <span>Completed</span>
                          </div>
                          
                          {/* Animated Gradient Line */}
                          <div className="relative mt-1.5 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-400 rounded-full"
                              style={{ width: ref.status === 'COMPLETED' ? '100%' : ref.status === 'PROCESSING' ? '60%' : '40%' }}
                            />
                          </div>

                          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-1">
                            Expected {ref.expectedDate || 'Sep 5'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                to="/refunds"
                className="text-xs font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
              >
                Track UPI gateway settlement ledger →
              </Link>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 3: IMMEDIATE AI HELP CARD + RECENT NOTIFICATIONS (3 COLS) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
            
            {/* Card A: "Need immediate help?" */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white dark:from-[#0B0F19] dark:via-[#1E1B4B] dark:to-[#0F172A] border border-purple-200/90 dark:border-cyan-500/30 text-slate-900 dark:text-white shadow-xs dark:shadow-xl relative overflow-hidden group">
              {/* Subtle ambient lighting */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-400/10 dark:bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Need immediate help?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-[190px]">
                    Chat with FitResQ AI for instant answers about your orders, refunds and support cases.
                  </p>
                </div>

                {/* Small Futuristic 3D Bot Thumbnail */}
                <div className="w-14 h-14 rounded-2xl bg-purple-100/80 dark:bg-cyan-950/40 border border-purple-200 dark:border-cyan-500/40 p-1 shrink-0 flex items-center justify-center shadow-xs dark:shadow-lg dark:shadow-cyan-500/20">
                  <img
                    src={aiCompanionImg}
                    alt="AI Support Bot"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-100 dark:border-slate-700/60 relative z-10">
                <button
                  type="button"
                  onClick={() => navigate('/ai-support')}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 shadow-md shadow-brand-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>Chat with FitResQ AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card B: Recent Notifications */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Recent Notifications
                  </h4>
                  <Link
                    to="/notifications"
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View All →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.slice(0, 2).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => notif.caseId && navigate(`/cases/${notif.caseId}`)}
                      className="py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {notif.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/notifications"
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Notification Feed ({notifications.length} alerts)
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* 5. REFUND POLICY & GUARANTEE CARD */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-[#0B0F19] dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs dark:shadow-xl transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-brand-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>FitResQ Guaranteed Refund Policy</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Transparent resolution on every return.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                FitResQ monitors end-to-end return delivery, verification, and payment gateway settlement to guarantee no refund gets stuck in transit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-2xs dark:shadow-none">
                <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200/60 dark:border-transparent flex items-center justify-center text-xs font-bold mb-2">
                  1
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  Refunds are initiated immediately after returned garment intake.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-2xs dark:shadow-none">
                <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-transparent flex items-center justify-center text-xs font-bold mb-2">
                  2
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  Customers track live gateway bank transfers inside their support case.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-2xs dark:shadow-none">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-transparent flex items-center justify-center text-xs font-bold mb-2">
                  3
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  Unresolved issues auto-escalate to senior specialists under 24h SLA.
                </p>
              </div>
            </div>
          </div>

          {refundPolicyText && (
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <span className="font-bold text-brand-600 dark:text-cyan-400 block mb-1">
                Live AWS Refund Policy Provisions:
              </span>
              <p className="line-clamp-2 leading-relaxed text-slate-600 dark:text-slate-300">
                {typeof refundPolicyText === 'string' ? refundPolicyText : JSON.stringify(refundPolicyText)}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link
              to="/refunds"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-cyan-400 dark:hover:text-cyan-300 inline-flex items-center gap-1.5"
            >
              <span>Read complete policy guidelines</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Policy ID: FR-POL-2026-V2
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
