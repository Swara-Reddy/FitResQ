import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Key,
  Bell,
  Sliders,
  Shield,
  CreditCard,
  Check,
  Smartphone,
  Mail,
  Clock,
  LogOut,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  Sun,
  Moon,
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import { useTheme } from '../context/ThemeContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export const Settings = () => {
  const { customerProfile, updatePreferences, addToast } = useSupport();
  const { theme, setTheme } = useTheme();

  // Local state for toggles and settings initialized from context
  const [settings, setSettings] = useState({
    // Section 2: Notifications
    caseUpdates: customerProfile?.preferences?.caseUpdates ?? true,
    refundUpdates: customerProfile?.preferences?.refundUpdates ?? true,
    slaAlerts: customerProfile?.preferences?.slaAlerts ?? true,
    supportMessages: customerProfile?.preferences?.supportMessages ?? true,

    // Section 3: Support preferences
    preferredCommunication: customerProfile?.preferences?.preferredCommunication || 'Email',
    emailNotifications: true,
    realTimeNotifications: customerProfile?.preferences?.realTimeNotifications ?? true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleToggle = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
  };

  const handleCommunicationChange = (method) => {
    setSettings((prev) => ({ ...prev, preferredCommunication: method }));
  };

  const handleSaveAll = () => {
    updatePreferences({
      caseUpdates: settings.caseUpdates,
      refundUpdates: settings.refundUpdates,
      slaAlerts: settings.slaAlerts,
      supportMessages: settings.supportMessages,
      preferredCommunication: settings.preferredCommunication,
      realTimeNotifications: settings.realTimeNotifications,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      addToast('Please enter both current and new password', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      addToast('New password must be at least 8 characters long', 'error');
      return;
    }

    addToast('Password updated successfully', 'success');
    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSignOut = () => {
    setIsSignOutModalOpen(false);
    addToast('Session logged out successfully', 'info');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-2.5">
              <Sliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Customer Account & System Preferences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Settings
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Manage your account credentials, visual theme, notification channels, SLA escalation preferences, and security sessions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <Button variant="primary" size="sm" onClick={handleSaveAll} className="text-xs">
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Your settings and communication preferences have been saved.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. APPEARANCE & THEME SECTION */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader
          title="1. Appearance & Theme"
          subtitle="Customize your visual experience with Light, Dark, or System theme"
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === 'light'
                  ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 ring-2 ring-brand-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === 'light' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Light Mode</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Crisp white cards with soft slate accents for brightly lit environments.
              </p>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === 'dark'
                  ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 ring-2 ring-brand-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === 'dark' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Dark Mode</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Deep obsidian slate surfaces with vibrant purple highlights for reduced eye fatigue.
              </p>
            </button>

            {/* System Preference */}
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                theme === 'system'
                  ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 ring-2 ring-brand-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                {theme === 'system' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">System Automatic</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Synchronize automatically with your operating system light and dark schedule.
              </p>
            </button>
          </div>
        </CardBody>
      </Card>

      {/* ========================================================================= */}
      {/* 2. ACCOUNT SECTION */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader
          title="2. Account Information"
          subtitle="Customer identity and login credentials"
          action={
            <Link
              to="/profile"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <span>Edit Full Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-400 block font-medium">Customer Name</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                {customerProfile?.name || 'Customer'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-400 block font-medium">Registered Email</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {customerProfile?.email || '—'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Password & Credentials</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                  •••••••••••••••• <span className="text-slate-400 dark:text-slate-500 font-sans text-[11px]">(Last changed 30 days ago)</span>
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Key}
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-xs shrink-0 self-start sm:self-center"
            >
              Change Password
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ========================================================================= */}
      {/* 3. NOTIFICATIONS SECTION */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader
          title="3. Notifications"
          subtitle="Select the types of alerts and status updates you want to receive"
        />
        <CardBody className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Case Updates Toggle */}
          <div className="flex items-center justify-between pt-2 first:pt-0">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Case Updates</span>
                <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.2 rounded-full border border-blue-100 dark:border-blue-900/50">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Receive real-time progress updates when an agent comments, requests details, or changes your case status.
              </p>
            </div>
            <button
              onClick={() => handleToggle('caseUpdates')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.caseUpdates ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.caseUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Refund Updates Toggle */}
          <div className="flex items-center justify-between pt-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Refund Updates</span>
                <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                  Critical
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Get instant notifications when the payment gateway initiates, verifies, or completes your bank settlement.
              </p>
            </div>
            <button
              onClick={() => handleToggle('refundUpdates')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.refundUpdates ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.refundUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* SLA Alerts Toggle */}
          <div className="flex items-center justify-between pt-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">SLA Alerts</span>
                <span className="text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.2 rounded-full border border-amber-100 dark:border-amber-900/50">
                  24h Window
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Receive proactive warnings when an active case is approaching or crosses the 24-hour resolution SLA window.
              </p>
            </div>
            <button
              onClick={() => handleToggle('slaAlerts')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.slaAlerts ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.slaAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Support Messages Toggle */}
          <div className="flex items-center justify-between pt-4">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Support Messages</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Notify me immediately when AI Customer Support or a assigned human specialist sends a message.
              </p>
            </div>
            <button
              onClick={() => handleToggle('supportMessages')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.supportMessages ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.supportMessages ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* ========================================================================= */}
      {/* 4. SUPPORT PREFERENCES SECTION */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader
          title="4. Support Preferences"
          subtitle="Preferred communication channels and delivery options for case correspondence"
        />
        <CardBody className="space-y-6">
          {/* Preferred Communication Method */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-3">
              Preferred Communication Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Email Option */}
              <div
                onClick={() => handleCommunicationChange('Email')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  settings.preferredCommunication === 'Email'
                    ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 ring-2 ring-brand-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  {settings.preferredCommunication === 'Email' && (
                    <span className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Email</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Full case logs & settlement summaries to {customerProfile?.email}
                </div>
              </div>

              {/* SMS Option */}
              <div
                onClick={() => handleCommunicationChange('SMS')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  settings.preferredCommunication === 'SMS'
                    ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 ring-2 ring-brand-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  {settings.preferredCommunication === 'SMS' && (
                    <span className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">SMS</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Urgent escalation alerts to {customerProfile?.phone}
                </div>
              </div>

              {/* WhatsApp Option */}
              <div
                onClick={() => handleCommunicationChange('WhatsApp')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  settings.preferredCommunication === 'WhatsApp'
                    ? 'border-brand-600 dark:border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 ring-2 ring-brand-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  {settings.preferredCommunication === 'WhatsApp' && (
                    <span className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">WhatsApp</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Instant settlement notices to {customerProfile?.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Email Notifications & Receipts
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send periodic case digests, intake inspection certificates, and settlement receipts to {customerProfile?.email}.
              </p>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.emailNotifications ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Real-time Notifications Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Real-Time Push Notifications
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Display in-app toast alerts and browser push updates for immediate customer replies and SLA status changes.
              </p>
            </div>
            <button
              onClick={() => handleToggle('realTimeNotifications')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.realTimeNotifications ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.realTimeNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* ========================================================================= */}
      {/* 5. SECURITY SECTION */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader
          title="5. Security & Sessions"
          subtitle="Authentication status, active devices, and session authorization"
        />
        <CardBody className="space-y-6">
          {/* Authentication Status Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                  Authentication Status: Active
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200">
                  Verified via OTP/Token
                </span>
              </div>
              <p className="text-emerald-800 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                Your account is safeguarded by tokenized authentication. All customer case updates and refund transfers are signed with cryptographic audit verification.
              </p>
            </div>
          </div>

          {/* Active Sessions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Active Devices & Sessions
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">2 devices authorized</span>
            </div>

            <div className="space-y-2.5">
              {/* Current Session */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <Laptop className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">Chrome on macOS / Windows</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                        Current Device
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Indiranagar, Bengaluru, IN • IP: 106.51.120.44 • Active now
                    </span>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950 shrink-0" />
              </div>

              {/* Mobile Web Session */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">FitResQ Mobile Web (Safari on iOS)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Indiranagar, Bengaluru, IN • Last active 2 days ago
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Idle</span>
              </div>
            </div>
          </div>

          {/* Sign Out Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Need to terminate account access on other devices?
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addToast('All other device sessions revoked', 'success')}
                className="text-xs w-full sm:w-auto"
              >
                Revoke Other Sessions
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={LogOut}
                onClick={() => setIsSignOutModalOpen(true)}
                className="text-xs w-full sm:w-auto"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Account Password"
        subtitle="Ensure your new password contains at least 8 characters"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              placeholder="••••••••••••"
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              placeholder="Minimum 8 characters"
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              placeholder="Re-type new password"
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Sign Out of FitResQ"
        subtitle="Are you sure you want to end your active session?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            You will need to sign back in with your registered email and mobile OTP to view your active cases and refund settlements.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSignOutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={LogOut}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
