import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Package,
  FileText,
  Copy,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import CopyButton from '../components/common/CopyButton';
import { refundRequestService } from '../services/refundRequestService';
import { formatDate } from '../utils/formatters';

const REASON_OPTIONS = [
  'Damaged item',
  'Defective or broken product',
  'Incorrect item received',
  'Sizing or fit issue',
  'Quality not as expected',
  'Late delivery / missing package',
  'Other reason',
];

const RECENT_ORDERS = ['ORD-10021', 'ORD-10016', 'ORD-10088'];

export const RequestRefund = () => {
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('Damaged item');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg(null);

    const cleanOrderId = orderId.trim();
    if (!cleanOrderId) {
      setErrorMsg('Please enter a valid Order ID (e.g. ORD-10021).');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please select or specify a refund reason.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await refundRequestService.submitRefundRequest({
        orderId: cleanOrderId,
        reason: reason.trim(),
        description: description.trim(),
      });

      setResult(response);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit refund request. Please verify order number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOrderId('');
    setReason('Damaged item');
    setDescription('');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 motion-safe:animate-in motion-safe:fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                <RotateCcw className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Customer Refund Request & 24h SLA Guarantee</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Automated SLA Tracking</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Request a Refund
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Submit a formal refund or exchange claim for your delivered order. All requests are backed by our guaranteed 24-hour support SLA.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              onClick={() => navigate('/refunds')}
              className="text-xs"
            >
              Back to Refunds
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation State */}
      {result ? (
        <Card className="p-6 sm:p-8 border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 shadow-md">
          <div className="text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Refund Request Submitted!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {result.message || 'Your refund request has been logged successfully and routed to our support team.'}
            </p>
          </div>

          {/* Ticket Metadata Breakdown */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Request / Case ID</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {result.caseId}
                </span>
                <CopyButton text={result.caseId} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Order ID</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                  {result.orderId}
                </span>
                <CopyButton text={result.orderId} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Initial Status</span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white mt-1 block">Active Investigation</span>
              </div>
              <Badge status={result.status || 'OPEN'}>{result.status || 'OPEN'}</Badge>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Assigned Priority</span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white mt-1 block">Support Queue</span>
              </div>
              <Badge priority={result.priority || 'HIGH'}>{result.priority || 'HIGH'}</Badge>
            </div>
          </div>

          {/* SLA Deadline Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 max-w-2xl mx-auto flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-amber-900 dark:text-amber-200 block">
                24-Hour SLA Target Resolution Deadline
              </span>
              <span className="text-amber-800 dark:text-amber-300 block mt-0.5 font-mono text-xs">
                {result.slaDeadline ? new Date(result.slaDeadline).toLocaleString() : 'Within 24 hours'}
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                If our support specialist does not review or resolve your case by this deadline, the system automatically escalates the ticket to a Senior Supervisor.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate('/cases')}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              View My Cases
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/refunds')}
            >
              Go to Refunds
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
            >
              Submit Another Request
            </Button>
          </div>
        </Card>
      ) : (
        /* Form State */
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 shadow-xs border border-slate-200/90 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Submission Error</span>
                  <span className="block mt-0.5">{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Order ID */}
            <div className="space-y-2">
              <label htmlFor="order-id" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Order ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="order-id"
                  name="orderId"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-10021"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Quick Select:</span>
                {RECENT_ORDERS.map((ord) => (
                  <button
                    key={ord}
                    type="button"
                    onClick={() => setOrderId(ord)}
                    className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {ord}
                  </button>
                ))}
              </div>
            </div>

            {/* Refund Reason */}
            <div className="space-y-2">
              <label htmlFor="refund-reason" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Reason for Refund <span className="text-rose-500">*</span>
              </label>
              <select
                id="refund-reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                required
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="description" className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400">Include details about item condition</span>
              </div>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="The package arrived torn and the shoes inside were scuffed."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            {/* SLA Notice Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white block">24-Hour Resolution Guarantee</span>
                Once submitted, an SLA monitor is activated immediately. If not resolved within 24 hours, the complaint is auto-escalated.
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/refunds')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                icon={ArrowRight}
                iconPosition="right"
                className="bg-brand-600 hover:bg-brand-700 text-white min-w-[160px]"
              >
                Submit Refund Request
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default RequestRefund;
