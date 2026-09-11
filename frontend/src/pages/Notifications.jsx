import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ReceiptText,
  LifeBuoy,
  Clock,
  ShieldAlert,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  ExternalLink,
  Radio,
  Trash2,
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import CopyButton from '../components/common/CopyButton';

export const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    simulateAwsEvent,
  } = useSupport();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter((item) => {
    if (showUnreadOnly && item.read) return false;
    if (selectedTypeFilter === 'ALL') return true;
    if (selectedTypeFilter === 'CASES') {
      return item.type === 'CASE_UPDATED' || item.type === 'CASE_ESCALATED';
    }
    if (selectedTypeFilter === 'REFUNDS') {
      return item.type === 'REFUND_UPDATED' || item.type === 'REFUND_COMPLETED';
    }
    if (selectedTypeFilter === 'SLA') {
      return item.type === 'SLA_WARNING' || item.type === 'CASE_ESCALATED';
    }
    if (selectedTypeFilter === 'SYSTEM') {
      return item.type === 'SYSTEM';
    }
    return item.type === selectedTypeFilter;
  });

  // Group by Today vs Earlier
  const todayNotifications = filteredNotifications.filter((n) => n.group === 'Today');
  const earlierNotifications = filteredNotifications.filter((n) => n.group === 'Earlier');

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CASE_ESCALATED':
        return <ShieldAlert className="w-5 h-5 text-purple-600" />;
      case 'SLA_WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'REFUND_UPDATED':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'REFUND_COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'CASE_UPDATED':
        return <LifeBuoy className="w-5 h-5 text-brand-600" />;
      case 'SYSTEM':
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'CASE_ESCALATED':
        return 'bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-800/60';
      case 'SLA_WARNING':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800/60';
      case 'REFUND_UPDATED':
        return 'bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-800/60';
      case 'REFUND_COMPLETED':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800/60';
      case 'CASE_UPDATED':
        return 'bg-brand-50 dark:bg-brand-950/60 border-brand-100 dark:border-brand-800/60';
      case 'SYSTEM':
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const renderNotificationCard = (item) => (
    <div
      key={item.id}
      onClick={() => {
        if (!item.read) markNotificationAsRead(item.id);
      }}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative group cursor-pointer ${
        !item.read
          ? 'bg-white dark:bg-slate-900 border-brand-200/90 dark:border-brand-800/80 shadow-sm hover:border-brand-300 dark:hover:border-brand-700'
          : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
      } ${item.isLiveEvent ? 'animate-in fade-in slide-in-from-top-2 ring-2 ring-brand-400/40' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${getNotificationBg(
            item.type
          )}`}
        >
          {getNotificationIcon(item.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {item.title}
              </h3>
              {!item.read && (
                <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 inline-block animate-pulse" />
              )}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
              {item.timestamp}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {item.description}
          </p>

          {/* Related Case/Refund and Action buttons */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              {item.caseId && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold inline-flex items-center gap-1">
                  Case {item.caseId}
                  <CopyButton text={item.caseId} label="Case ID" />
                </span>
              )}
              {item.refundId && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold inline-flex items-center gap-1">
                  Refund {item.refundId}
                  <CopyButton text={item.refundId} label="Refund ID" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {item.actionText && item.actionUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(item.id);
                    navigate(item.actionUrl);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 px-3 py-1 rounded-lg transition-colors"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {!item.read && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(item.id);
                  }}
                  className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium px-2 py-1 transition-colors"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>Real-Time Support Feed • Live Sync Active</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">Updated just now</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 font-bold">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Stay updated on your cases, refunds, and support activity. Real-time alerts for SLA triggers, payment gateways, and escalations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
            {unreadNotificationsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Check}
                onClick={markAllNotificationsAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 rounded-xl">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
                DEV SIMULATOR
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={Sparkles}
                onClick={() => simulateAwsEvent()}
                className="text-xs bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-brand-700 dark:text-brand-300 border-slate-200 dark:border-slate-700 hover:border-brand-200"
                title="Simulates incoming EventBridge / SNS push notification"
              >
                Simulate Live Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Toggle */}
      <Card className="p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'CASES', label: 'Cases' },
              { id: 'REFUNDS', label: 'Refunds' },
              { id: 'SLA', label: 'SLA Warnings' },
              { id: 'SYSTEM', label: 'System' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTypeFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTypeFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Unread Only Toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-2 ${
                showUnreadOnly
                  ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showUnreadOnly ? 'bg-brand-600 dark:bg-brand-400' : 'bg-slate-400 dark:text-slate-500'}`} />
              <span>Unread only</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications List Grouped By Today / Earlier */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-16 text-center dark:bg-slate-900 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">No notifications to display</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {showUnreadOnly
              ? 'You have read all incoming alerts. Toggle unread filter to view history.'
              : 'You have no notifications in this category.'}
          </p>
          {(selectedTypeFilter !== 'ALL' || showUnreadOnly) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setSelectedTypeFilter('ALL');
                  setShowUnreadOnly(false);
                }}
                className="text-xs"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {/* GROUP: Today */}
          {todayNotifications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Today
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {todayNotifications.length} alerts
                </span>
              </div>

              <div className="space-y-3">
                {todayNotifications.map((item) => renderNotificationCard(item))}
              </div>
            </div>
          )}

          {/* GROUP: Earlier */}
          {earlierNotifications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Earlier
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {earlierNotifications.length} alerts
                </span>
              </div>

              <div className="space-y-3">
                {earlierNotifications.map((item) => renderNotificationCard(item))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
