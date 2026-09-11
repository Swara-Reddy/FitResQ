import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  User,
  ChevronDown,
  Sun,
  Moon,
  Laptop,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { useSupport } from '../../context/SupportContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import FitResQLogo from '../common/FitResQLogo';
import Badge from '../common/Badge';

export const TopNavbar = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadNotificationsCount, customerProfile, markNotificationAsRead } =
    useSupport();
  const { theme, setTheme, isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Close menus on route change
  useEffect(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/cases?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'AI Support', path: '/ai-support' },
    { name: 'My Cases', path: '/cases' },
    { name: 'Refunds', path: '/refunds' },
    { name: 'Notifications', path: '/notifications', badge: unreadNotificationsCount },
  ];

  const isNavActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const toggleTheme = () => {
    if (isDark) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT: Logo + Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <FitResQLogo size="md" showSubtitle={true} subtitleText="Support. Resolve. Move Forward." />
        </div>

        {/* CENTER: Capsule Navigation Pills (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-full border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          {navItems.map((item) => {
            const active = isNavActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 select-none ${
                  active
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{item.name}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                      active
                        ? 'bg-white text-brand-700'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT: Search, Ask AI, Theme, Notifications, Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global Search Bar */}
          <div className="hidden lg:flex items-center relative w-56 xl:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search cases, orders, refunds..."
              className="w-full bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-full pl-8 pr-11 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            <div className="absolute right-2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 leading-none">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* "+ Ask FitResQ AI" Primary CTA */}
          <button
            type="button"
            onClick={() => navigate('/ai-support')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-sm shadow-brand-500/25 active:scale-95 transition-all duration-200"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask FitResQ AI</span>
          </button>

          {/* Visible Segmented Theme Toggle Pill */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-full bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-750/80 shadow-2xs select-none">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Light Mode"
            >
              <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span className="text-[11px] hidden sm:inline font-semibold">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xs ring-1 ring-purple-500/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Dark Mode"
            >
              <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-200 fill-cyan-200' : 'text-slate-400'}`} />
              <span className="text-[11px] hidden sm:inline font-semibold">Dark</span>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0B0F19] animate-pulse" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                        {unreadNotificationsCount} unread
                      </span>
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    onClick={() => setShowNotifications(false)}
                  >
                    View All
                  </Link>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.slice(0, 4).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-xs ${
                        !notif.read ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="px-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
                  <Link
                    to="/notifications"
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400"
                    onClick={() => setShowNotifications(false)}
                  >
                    Go to Notification Center →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Pill Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {(customerProfile?.name || user?.name || 'C').charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {customerProfile?.name || 'Customer Account'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {customerProfile?.email || user?.email || '—'}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Cognito Verified</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    to="/cases"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>My Active Cases</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clearly Visible Top Navigation Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100/90 dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/90 dark:border-slate-800 transition-all shadow-2xs cursor-pointer"
            title="Log out of FitResQ"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Logout</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
