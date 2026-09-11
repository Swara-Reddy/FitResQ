import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  LifeBuoy,
  Edit3,
  Save,
  Check,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ReceiptText,
  Bell,
  ArrowRight,
  Copy,
  ExternalLink,
  LogOut,
  Key,
  Shield,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import CopyButton from '../components/common/CopyButton';
import { formatCurrency, formatDate } from '../utils/formatters';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    customerProfile,
    updateProfile,
    cases,
    refunds,
    addToast,
    profileLoading,
    profileError,
    fetchUserProfile,
  } = useSupport();
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: customerProfile?.name || '',
    email: customerProfile?.email || '',
    phone: customerProfile?.phone || '',
    defaultUpiId: customerProfile?.defaultUpiId || '',
    deliveryAddress: customerProfile?.deliveryAddress || '',
  });

  // Sync formData with customerProfile when /users/me loads
  React.useEffect(() => {
    if (customerProfile) {
      setFormData({
        name: customerProfile.name || '',
        email: customerProfile.email || '',
        phone: customerProfile.phone || '',
        defaultUpiId: customerProfile.defaultUpiId || '',
        deliveryAddress: customerProfile.deliveryAddress || '',
      });
    }
  }, [customerProfile]);

  // Calculate live support statistics
  const activeCasesCount = (cases || []).filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'Resolved'
  ).length;

  const resolvedCasesCount = (cases || []).filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'Resolved'
  ).length;

  const inProgressRefunds = (refunds || []).filter((r) => r.status !== 'COMPLETED');
  const completedRefunds = (refunds || []).filter((r) => r.status === 'COMPLETED');
  const inProgressRefundsTotal = inProgressRefunds.reduce((acc, r) => acc + (r.amount || 0), 0);
  const completedRefundsTotal = completedRefunds.reduce((acc, r) => acc + (r.amount || 0), 0);

  const preferences = customerProfile?.preferences || {
    caseUpdates: true,
    refundUpdates: true,
    slaAlerts: true,
    supportMessages: true,
    preferredCommunication: 'Email',
  };

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      defaultUpiId: formData.defaultUpiId,
      deliveryAddress: formData.deliveryAddress,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Profile Status & Error Banners for /users/me */}
      {profileLoading && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
          <span>Fetching authenticated customer profile from AWS /users/me...</span>
        </div>
      )}

      {profileError && profileError.status === 401 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold">Authentication Notice (401)</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Your session token has expired or is unauthorized. Please sign in again.</p>
            </div>
          </div>
          <Button size="xs" variant="primary" onClick={() => logout()}>
            Sign In Again
          </Button>
        </div>
      )}

      {profileError && profileError.status === 404 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold">Customer Profile Not Found (HTTP 404)</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">No customer record is currently associated with this Cognito account in FitResQUsers.</p>
            </div>
          </div>
          <Button size="xs" variant="outline" onClick={() => fetchUserProfile()}>
            Retry Lookup
          </Button>
        </div>
      )}

      {profileError && profileError.status >= 500 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="font-bold">Backend Service Notice (500)</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">Unable to retrieve customer profile from server. Please try again.</p>
            </div>
          </div>
          <Button size="xs" variant="outline" onClick={() => fetchUserProfile()}>
            Retry
          </Button>
        </div>
      )}

      {/* Header Profile Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-xs">
              <User className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {customerProfile?.name || 'Customer'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  {customerProfile?.role || 'CUSTOMER'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {customerProfile?.userId || customerProfile?.id || '—'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customerProfile?.email || '—'}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {customerProfile?.phone || '—'}
                </span>
                <span>•</span>
                <span>Member since {customerProfile?.createdAt ? formatDate(customerProfile.createdAt) : (customerProfile?.memberSince || '—')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <Button
              variant={isEditing ? 'primary' : 'outline'}
              size="sm"
              icon={isEditing ? Save : Edit3}
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              className="text-xs"
            >
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Customer profile details updated successfully.</span>
        </div>
      )}

      {/* Support Activity Summary Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Support Activity Summary</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of your active cases, resolutions, and refund settlements
            </p>
          </div>
          <Link
            to="/cases"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Cases Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Cases</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <LifeBuoy className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeCasesCount}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Under 24h SLA monitoring</span>
            </div>
          </div>

          {/* Resolved Cases Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved Cases</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{resolvedCasesCount}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Satisfactorily closed with audit log
            </div>
          </div>

          {/* Refunds In Progress Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Refunds In Progress</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{inProgressRefunds.length}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(inProgressRefundsTotal)}</span> pending gateway payout
            </div>
          </div>

          {/* Total Refunds Received Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Refunds Received</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <ReceiptText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{completedRefunds.length}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(completedRefundsTotal)}</span> settled to bank
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details & Notification Preferences Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Customer Information Form / View */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader
              title="Customer Information"
              subtitle="Official contact and settlement information registered for FitResQ cases"
            />
            <CardBody>
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Registered Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Default Refund UPI VPA
                      </label>
                      <input
                        type="text"
                        value={formData.defaultUpiId}
                        onChange={(e) => setFormData({ ...formData, defaultUpiId: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Return & Delivery Address
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      required
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      Customer Name
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                      {customerProfile?.name || '—'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      User ID (Customer ID)
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                      {customerProfile?.userId || customerProfile?.id || '—'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      Registered Email
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                      {customerProfile?.email || '—'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      Phone Number
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                      {customerProfile?.phone || '—'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      Account Role
                    </span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                      {customerProfile?.role || 'CUSTOMER'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      Created At
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white mt-1 block">
                      {customerProfile?.createdAt ? formatDate(customerProfile.createdAt) : (customerProfile?.memberSince || '—')}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100/90 dark:border-blue-900/50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block uppercase tracking-wider">
                        Default Refund UPI ID
                      </span>
                      <span className="text-sm font-mono font-bold text-blue-950 dark:text-blue-100 mt-1 block">
                        {customerProfile?.defaultUpiId || '—'}
                      </span>
                    </div>
                    {customerProfile?.defaultUpiId && (
                      <CopyButton text={customerProfile.defaultUpiId} label="UPI ID" />
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                      Delivery & Return Address
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1 block leading-relaxed">
                      {customerProfile?.deliveryAddress || '—'}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Notification Preferences Overview & SLA Guarantee */}
        <div className="space-y-6">
          {/* Notification Preferences Overview */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader
              title="Notification Preferences"
              subtitle="Overview of delivery channels for support alerts"
            />
            <CardBody className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Case Updates</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {preferences.caseUpdates ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Refund Settlement</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {preferences.refundUpdates ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">SLA Breach Alerts</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {preferences.slaAlerts ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Support Chat Messages</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {preferences.supportMessages ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Preferred Channel</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {preferences.preferredCommunication || 'Email'}
                </span>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="w-full text-xs justify-center"
                >
                  Manage in Settings
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* AWS Cognito Account Identity */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader
              title="AWS Cognito Identity"
              subtitle="Authenticated User Pool session credentials"
            />
            <CardBody className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Cognito User ID (Sub)</span>
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-brand-700 dark:text-brand-300">
                  <span className="truncate max-w-[200px]">{user?.sub || user?.id || 'Not Authenticated'}</span>
                  <CopyButton text={user?.sub || user?.id || ''} label="Cognito Sub" size="xs" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">User Pool</span>
                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  ap-south-1_7WbqGdro8 (ap-south-1)
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={LogOut}
                  onClick={logout}
                  className="w-full text-xs justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Sign Out from Cognito
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* SLA Resolution Guarantee */}
          <div className="p-6 rounded-3xl bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>SLA Resolution Guarantee</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every complaint is logged with an immutable audit trail. Inquiries left pending past the 24-hour SLA window trigger automated escalation to supervisor agents.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Platform SLA standard:</span>
              <strong className="text-white">24 Hours Target</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
