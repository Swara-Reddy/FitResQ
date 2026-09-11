import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Bot,
  LifeBuoy,
  ReceiptText,
  Bell,
  UserCircle,
  Sliders,
  User,
  LogOut,
} from 'lucide-react';
import { useSupport } from '../../context/SupportContext';
import { useAuth } from '../../context/AuthContext';
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

export const MobileNav = ({ isOpen, onClose }) => {
  const { openCases, pendingRefunds, unreadNotificationsCount, customerProfile } = useSupport();
  const { logout } = useAuth();

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
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col transition-colors duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div onClick={onClose}>
            <FitResQLogo size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1 rounded-lg ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                      </div>
                      <span>{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-600 text-white">
                          {item.badge}
                        </span>
                      )}
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Profile with Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {customerProfile.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {customerProfile.accountType}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
