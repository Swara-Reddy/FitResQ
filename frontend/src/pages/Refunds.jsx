import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ReceiptText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Bot,
  Copy,
  Check,
  ChevronRight,
  Filter,
  X,
  CreditCard,
  ArrowRight,
  Search,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import CopyButton from '../components/common/CopyButton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ProductThumbnail } from '../utils/productImages';

export const Refunds = () => {
  const navigate = useNavigate();
  const { refunds, addToast, isLiveBackendConnected, isLoading } = useSupport();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRefund, setSelectedRefund] = useState(refunds[0] || null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Summary Metrics calculations
  const totalRefundAmount = (refunds || []).reduce((acc, r) => acc + (r.amount || 0), 0);
  const processingRefunds = (refunds || []).filter((r) => r.status === 'PROCESSING');
  const completedRefunds = (refunds || []).filter((r) => r.status === 'COMPLETED');
  const attentionRefunds = (refunds || []).filter(
    (r) => r.status === 'FAILED' || r.status === 'REQUIRES_ACTION'
  );

  const filteredRefunds = (refunds || []).filter((item) => {
    const q = (searchQuery || '').trim().toLowerCase();
    const id = (item.id || '').toLowerCase();
    const orderId = (item.orderId || item.orderNumber || '').toLowerCase();
    const caseId = (item.caseId || '').toLowerCase();
    const paymentMethod = (item.paymentMethod || '').toLowerCase();

    const matchesSearch =
      !q ||
      id.includes(q) ||
      orderId.includes(q) ||
      caseId.includes(q) ||
      paymentMethod.includes(q);

    if (!matchesSearch) return false;
    if (selectedStatus === 'ALL') return true;
    return item.status === selectedStatus;
  });

  const handleOpenDetail = (refund) => {
    setSelectedRefund(refund);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                <ReceiptText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Direct Bank & UPI Settlement Ledger</span>
              </div>
              {isLiveBackendConnected && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>AWS Live Connected</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Refunds
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Track your refunds, payment status, and expected completion.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={Bot}
              onClick={() => navigate('/ai-support')}
              className="text-xs"
            >
              Ask FitResQ AI
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={RotateCcw}
              onClick={() => navigate('/refund-request')}
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white"
            >
              Request Refund
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Section (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Refunds"
          value={formatCurrency(totalRefundAmount)}
          subtitle={`${(refunds || []).length} total requests`}
          icon={ReceiptText}
          iconColor="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        />
        <StatCard
          title="Processing"
          value={processingRefunds.length}
          subtitle={formatCurrency(processingRefunds.reduce((a, r) => a + (r.amount || 0), 0))}
          icon={Clock}
          iconColor="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60"
        />
        <StatCard
          title="Completed"
          value={completedRefunds.length}
          subtitle={formatCurrency(completedRefunds.reduce((a, r) => a + (r.amount || 0), 0))}
          icon={CheckCircle2}
          iconColor="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60"
        />
        <StatCard
          title="Requires Attention"
          value={attentionRefunds.length}
          subtitle="Failed or action required"
          icon={AlertTriangle}
          trend={attentionRefunds.length > 0 ? `${attentionRefunds.length} Action needed` : 'All clear'}
          trendPositive={attentionRefunds.length === 0}
          iconColor="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60"
        />
      </div>

      {/* Controls Bar: Filter Status Tabs + Search */}
      <Card className="p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {[
              { id: 'ALL', label: 'All Refunds', count: refunds.length },
              { id: 'PROCESSING', label: 'Processing', count: processingRefunds.length },
              { id: 'COMPLETED', label: 'Completed', count: completedRefunds.length },
              { id: 'REQUIRES_ACTION', label: 'Requires Action', count: refunds.filter(r => r.status === 'REQUIRES_ACTION').length },
              { id: 'FAILED', label: 'Failed', count: refunds.filter(r => r.status === 'FAILED').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedStatus === tab.id
                    ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedStatus === tab.id ? 'bg-white/20 text-white dark:bg-brand-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search refund ID, order, case..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>
      </Card>

      {/* Main Refund Table / Responsive Cards */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <CardHeader
          title="Refund Ledger"
          subtitle="Click any row to inspect the real-time processor settlement timeline"
          action={
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Showing {filteredRefunds.length} of {refunds.length}
            </span>
          }
        />

        {filteredRefunds.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No refunds found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              No refund transactions match your active filter or search criteria.
            </p>
            {(searchQuery || selectedStatus !== 'ALL') && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('ALL');
                  }}
                  className="text-xs"
                >
                  Reset Filters & Search
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4 sm:px-6">Refund ID</th>
                    <th className="p-4 sm:px-6">Order & Case</th>
                    <th className="p-4 sm:px-6">Status</th>
                    <th className="p-4 sm:px-6">Payment Method</th>
                    <th className="p-4 sm:px-6">Initiated / Expected</th>
                    <th className="p-4 sm:px-6 text-right">Amount</th>
                    <th className="p-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRefunds.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenDetail(item)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 sm:px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {item.id}
                          </span>
                          <CopyButton text={item.id} label="Refund ID" />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                          Updated {item.lastUpdated}
                        </span>
                      </td>

                      <td className="p-4 sm:px-6 font-mono text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2.5">
                          <ProductThumbnail title={item.orderId || item.orderNumber} size="sm" />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.orderId || item.orderNumber}</span>
                              <CopyButton text={item.orderId || item.orderNumber} label="Order ID" />
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Link
                                to={`/cases/${item.caseId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                {item.caseId}
                              </Link>
                              <CopyButton text={item.caseId} label="Case ID" />
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 sm:px-6">
                        <Badge status={item.status} />
                      </td>

                      <td className="p-4 sm:px-6 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.paymentMethod}</span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{item.destination}</span>
                      </td>

                      <td className="p-4 sm:px-6 text-slate-600 dark:text-slate-400">
                        <div>Initiated: <span className="font-medium text-slate-800 dark:text-slate-200">{item.initiatedDate}</span></div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Expected: {item.expectedDate || item.expectedCompletionDate}</div>
                      </td>

                      <td className="p-4 sm:px-6 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.amount)}
                        </span>
                      </td>

                      <td className="p-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/cases/${item.caseId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 p-1"
                        >
                          <span>View Case</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (shown only on mobile) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRefunds.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors space-y-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {item.id}
                      </span>
                      <CopyButton text={item.id} label="Refund ID" />
                      <Badge status={item.status} />
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <ProductThumbnail title={item.orderId || item.orderNumber} size="sm" />
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 flex-1">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Order & Case</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{item.orderId || item.orderNumber}</span>
                          <CopyButton text={item.orderId || item.orderNumber} label="Order ID" />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[11px] text-brand-600 dark:text-brand-400">{item.caseId}</span>
                          <CopyButton text={item.caseId} label="Case ID" />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Payment</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.paymentMethod}</span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block truncate">{item.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span>Expected by {item.expectedDate || item.expectedCompletionDate}</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-0.5">
                      Inspect Timeline →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Selected Refund Detailed Timeline Modal / Drawer */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedRefund ? `Refund ${selectedRefund.id}` : 'Refund Details'}
        subtitle={selectedRefund ? `Order ${selectedRefund.orderId || selectedRefund.orderNumber} • Linked to Case ${selectedRefund.caseId}` : ''}
        maxWidth="max-w-2xl"
      >
        {selectedRefund && (
          <div className="space-y-6">
            {/* Status Highlight Banner */}
            {selectedRefund.status === 'PROCESSING' && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200">
                  <h4 className="font-bold text-sm text-blue-950 dark:text-blue-100">
                    Refund is currently processing with your bank
                  </h4>
                  <p className="mt-0.5 leading-relaxed text-blue-800 dark:text-blue-300">
                    Payment switch payload has been transmitted to banking partners. Settlement expected by{' '}
                    <strong>{selectedRefund.expectedDate || selectedRefund.expectedCompletionDate}</strong>.
                  </p>
                </div>
              </div>
            )}

            {selectedRefund.status === 'REQUIRES_ACTION' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <h4 className="font-bold text-sm text-amber-950 dark:text-amber-100">
                    Action Required by Customer
                  </h4>
                  <p className="mt-0.5 leading-relaxed text-amber-800 dark:text-amber-300">
                    The payment gateway could not reach the specified UPI VPA. Please verify your VPA ID in profile settings.
                  </p>
                </div>
              </div>
            )}

            {selectedRefund.status === 'FAILED' && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 dark:text-rose-200">
                  <h4 className="font-bold text-sm text-rose-950 dark:text-rose-100">
                    Transaction Re-attempt in Progress
                  </h4>
                  <p className="mt-0.5 leading-relaxed text-rose-800 dark:text-rose-300">
                    Beneficiary bank timed out. System is automatically retrying via alternate routing gateway.
                  </p>
                </div>
              </div>
            )}

            {selectedRefund.status === 'COMPLETED' && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                    Refund Completed Successfully
                  </h4>
                  <p className="mt-0.5 leading-relaxed text-emerald-800 dark:text-emerald-300">
                    ₹{selectedRefund.amount} has been successfully credited to {selectedRefund.destination}.
                  </p>
                </div>
              </div>
            )}

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">Amount</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {formatCurrency(selectedRefund.amount)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">Payment Method</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedRefund.paymentMethod}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">Status</span>
                <div className="mt-1">
                  <Badge status={selectedRefund.status} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">Expected By</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedRefund.expectedDate || selectedRefund.expectedCompletionDate}</span>
              </div>
            </div>

            {/* Detailed 5-Stage Refund Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                Processor Verification & Settlement Timeline
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {(selectedRefund?.timeline || []).map((step, idx) => (
                  <div key={step.id || idx} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                        step.completed
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {step.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{step.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to={`/cases/${selectedRefund.caseId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 py-2"
              >
                <span>View Support Case {selectedRefund.caseId}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Bot}
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigate('/ai-support');
                  }}
                  className="w-full sm:w-auto text-xs"
                >
                  Ask FitResQ AI
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full sm:w-auto text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Refunds;
