import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  LifeBuoy,
  ReceiptText,
  Bell,
  UserCircle,
  Sliders,
  ShieldCheck,
  ChevronRight,
  User,
} from 'lucide-react';
import { useSupport } from '../../context/SupportContext';
import FitResQLogo from '../common/FitResQLogo';

const ICON_MAP = {
  LayoutDashboard,
  Bot,
  LifeBuoy,
  ReceiptText,
  Bell,
  UserCircle,
  Sliders,
};

export const Sidebar = () => {
  const { openCases, pendingRefunds, unreadNotificationsCount, customerProfile } = useSupport();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
    { name: 'AI Support', path: '/ai-support', icon: 'Bot', badge: 'AI Agent' },
    { name: 'My Cases', path: '/cases', icon: 'LifeBuoy', count: openCases.length },
    { name: 'Refunds', path: '/refunds', icon: 'ReceiptText', count: pendingRefunds.length },
    { name: 'Notifications', path: '/notifications', icon: 'Bell', count: unreadNotificationsCount },
    { name: 'Profile', path: '/profile', icon: 'UserCircle' },
    { name: 'Settings', path: '/settings', icon: 'Sliders' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 select-none z-30 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <FitResQLogo size="md" />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="px-3 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Platform Menu
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                    </div>
                    <span>{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-brand-600 text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-brand-200/70 dark:bg-brand-900/60 text-brand-900 dark:text-brand-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}

        {/* SLA Policy Assurance */}
        <div className="mt-8 pt-4 px-3">
          <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-transparent dark:border-slate-800 text-white shadow-md relative overflow-hidden">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>SLA Resolution Policy</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 dark:text-slate-400 leading-relaxed">
              Refunds are initiated upon system verification. Cases unresolved within configured SLA automatically escalate to a support agent.
            </p>
            <Link
              to="/refunds"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-white transition-colors"
            >
              <span>Refund Policy & SLA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <Link
          to="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-200/70 dark:hover:border-slate-700"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {customerProfile.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {customerProfile.accountType}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
