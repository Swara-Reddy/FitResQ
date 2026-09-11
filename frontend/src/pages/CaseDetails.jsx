import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ReceiptText,
  LifeBuoy,
  Send,
  Paperclip,
  X,
  Copy,
  Check,
  Bot,
  User,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  FileText,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Package,
  Radio,
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import CopyButton from '../components/common/CopyButton';
import SlaCountdown from '../components/common/SlaCountdown';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ProductThumbnail } from '../utils/productImages';

export const CaseDetails = () => {
  const { id, caseId } = useParams();
  const activeId = id || caseId;
  const navigate = useNavigate();
  const { getCaseById, addCaseMessage, escalateCase, addToast, isLiveBackendConnected } = useSupport();

  const [isLoading, setIsLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'audit'
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState(
    'SLA deadline approaching without UPI settlement confirmation'
  );
  const [customReason, setCustomReason] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Simulated initial loading to handle route transitions realistically
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const data = getCaseById(activeId);
      setCaseData(data);
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [activeId, getCaseById]);

  // Keep internal case data in sync if context updates
  useEffect(() => {
    if (!isLoading && activeId) {
      const freshData = getCaseById(activeId);
      if (freshData) setCaseData(freshData);
    }
  }, [activeId, getCaseById, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [caseData?.messages, isAgentTyping]);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast(`${fieldName} copied to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;

    const textToSend = inputText.trim();
    const filesToSend = [...attachedFiles];

    // Optimistic update through context
    addCaseMessage(caseData.id, textToSend, filesToSend);
    setInputText('');
    setAttachedFiles([]);

    // Trigger realistic agent response simulation
    setIsAgentTyping(true);
    setTimeout(() => {
      setIsAgentTyping(false);
      // Context will have updated messages
    }, 1800);
  };

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFiles((prev) => [...prev, file.name]);
      addToast(`Attached ${file.name}`, 'info');
    }
  };

  const removeAttachment = (fileName) => {
    setAttachedFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const handleOpenEscalateModal = () => {
    if (caseData.slaEscalated) return;
    setIsEscalateModalOpen(true);
  };

  const handleConfirmEscalation = () => {
    const finalReason =
      escalationReason === 'Other'
        ? customReason.trim() || 'Customer requested expedited supervisory review'
        : escalationReason;
    escalateCase(caseData.id, finalReason);
    setIsEscalateModalOpen(false);
    addToast('Case escalated to Senior Support Supervisor', 'warning');
  };

  const getTimelineNodeConfig = (event) => {
    if (!event.completed) {
      if (event.type === 'escalation') {
        return {
          icon: ShieldAlert,
          color: 'border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400',
          badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          border: 'border-slate-200/80 dark:border-slate-800',
          title: 'text-slate-700 dark:text-slate-300',
        };
      }
      if (event.type === 'resolution') {
        return {
          icon: CheckCircle2,
          color: 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500',
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          border: 'border-slate-200/60 dark:border-slate-800',
          title: 'text-slate-600 dark:text-slate-400',
        };
      }
      return {
        icon: Clock,
        color: 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500',
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        border: 'border-slate-200/60 dark:border-slate-800',
        title: 'text-slate-600 dark:text-slate-400',
      };
    }

    switch (event.type) {
      case 'created':
        return {
          icon: Package,
          color: 'bg-brand-600 border-brand-600 text-white shadow-xs',
          badge: 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800/60',
          border: 'border-slate-200 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800',
          title: 'text-slate-900 dark:text-white',
        };
      case 'sla_started':
        return {
          icon: Clock,
          color: 'bg-blue-600 border-blue-600 text-white shadow-xs',
          badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          border: 'border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800',
          title: 'text-slate-900 dark:text-white',
        };
      case 'message_received':
        return {
          icon: MessageSquare,
          color: 'bg-indigo-600 border-indigo-600 text-white shadow-xs',
          badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
          border: 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800',
          title: 'text-slate-900 dark:text-white',
        };
      case 'assigned':
        return {
          icon: UserCheck,
          color: 'bg-sky-600 border-sky-600 text-white shadow-xs',
          badge: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
          border: 'border-slate-200 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800',
          title: 'text-slate-900 dark:text-white',
        };
      case 'status_changed':
        return {
          icon: RefreshCw,
          color: 'bg-purple-600 border-purple-600 text-white shadow-xs',
          badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          border: 'border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800',
          title: 'text-slate-900 dark:text-white',
        };
      case 'sla_alert':
        return {
          icon: AlertTriangle,
          color: 'bg-amber-500 border-amber-500 text-white shadow-xs',
          badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          border: 'border-amber-200/80 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20',
          title: 'text-amber-950 dark:text-amber-200',
        };
      case 'escalation':
        return {
          icon: ShieldAlert,
          color: 'bg-rose-600 border-rose-600 text-white shadow-xs',
          badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
          border: 'border-rose-200/80 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/20',
          title: 'text-rose-950 dark:text-rose-200',
        };
      case 'resolution':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-600 border-emerald-600 text-white shadow-xs',
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          border: 'border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20',
          title: 'text-emerald-950 dark:text-emerald-200',
        };
      default:
        return {
          icon: Check,
          color: 'bg-brand-600 border-brand-600 text-white shadow-xs',
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          border: 'border-slate-200 dark:border-slate-800',
          title: 'text-slate-900 dark:text-white',
        };
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
            <div className="h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
            <div className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State (Case Not Found)
  if (!caseData) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/60">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Support Case Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          We could not locate any support case matching identifier <code className="font-mono font-bold text-slate-800 dark:text-slate-200">{activeId}</code>. It may have been archived or entered incorrectly.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/cases')}>
            Back to My Cases
          </Button>
          <Button variant="outline" onClick={() => navigate('/ai-support')}>
            Ask AI Assistant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate('/cases')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Cases</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isLiveBackendConnected ? 'AWS Live Gateway • Connected' : 'Live Sync • Connected'}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Updated just now</span>
          </div>
        </div>

        {/* Case Title and Identification Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
            <div className="shrink-0 mt-1">
              <ProductThumbnail
                title={caseData.itemName}
                category={caseData.category}
                size="lg"
                className="shadow-xs"
              />
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800/60 px-2.5 py-1 rounded-lg">
                  <span className="font-mono font-bold text-brand-700 dark:text-brand-300 text-sm">{caseData.id}</span>
                  <CopyButton text={caseData.id} label="Case ID" />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Order <span className="font-semibold text-slate-800 dark:text-slate-200">{caseData.orderNumber}</span>
                  </span>
                  <CopyButton text={caseData.orderNumber} label="Order Number" />
                </div>

                <Badge priority={caseData.priority} />
                <Badge status={caseData.status} />

                {caseData.slaEscalated && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Escalated to Senior Supervisor</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {caseData.itemName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Category: <strong className="text-slate-700 dark:text-slate-300">{caseData.category}</strong> • Assigned to: <span className="text-slate-800 dark:text-slate-200 font-medium">{caseData.assignedAgent}</span> • Raised {formatDate(caseData.createdAt)}
              </p>
            </div>
          </div>

          {/* SLA Quick Status Indicator */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                SLA State
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {caseData.slaState}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                Refund Value
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {formatCurrency(caseData.refundAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: LEFT (Primary: Summary, Complaint, Messages) | RIGHT (Secondary: Refund, SLA, Order) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ================= PRIMARY COLUMN (2 cols) ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Summary & Customer Complaint */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader
              title="Customer Complaint & Issue Summary"
              subtitle={`Registered under category: ${caseData.category}`}
            />
            <CardBody className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic relative">
                "{caseData.customerComplaint}"
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Item Details</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{caseData.itemDetails}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">SKU</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{caseData.itemSku}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Priority Level</span>
                  <span className="font-semibold text-rose-700 dark:text-rose-400 mt-0.5 block">{caseData.priority}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Conversation / Messages Thread */}
          <Card className="flex flex-col shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardHeader
              title="Case Inquiry & Resolution Thread"
              subtitle="All communications are recorded in the permanent case audit trail"
              action={
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {caseData.messages.length} messages
                </span>
              }
            />

            {/* Messages Area */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[480px] overflow-y-auto bg-[#FDFDFE] dark:bg-slate-950/40">
              {caseData.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.isCustomer ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      msg.isCustomer
                        ? 'bg-slate-900 dark:bg-brand-600 text-white'
                        : msg.avatarText === 'SYS'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-brand-600 text-white'
                    }`}
                  >
                    {msg.avatarText}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={`font-bold ${msg.isCustomer ? 'text-slate-900 dark:text-slate-200' : 'text-slate-800 dark:text-slate-300'}`}>
                        {msg.sender}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.isCustomer
                          ? 'bg-brand-50/90 dark:bg-brand-950/60 text-brand-950 dark:text-brand-100 border border-brand-200/70 dark:border-brand-800/60 rounded-tr-none'
                          : msg.avatarText === 'SYS'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-tl-none font-mono text-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 rounded-tl-none shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                          {msg.attachments.map((att, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-mono"
                            >
                              <Paperclip className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              {att}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isAgentTyping && (
                <div className="flex gap-3 max-w-[80%] animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    L1
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Support Specialist is typing</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
              {/* Attachment preview pills */}
              {attachedFiles.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-2">
                  {attachedFiles.map((file, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      <span className="max-w-[160px] truncate">{file}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Write a message to support specialists or request clarification..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileAttach}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      title="Attach file or screenshot"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span className="hidden sm:inline">Attach</span>
                    </button>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                      Press ⌘+Enter to send
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={Send}
                    disabled={(!inputText.trim() && attachedFiles.length === 0) || isAgentTyping}
                  >
                    Send Message
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* ================= SECONDARY COLUMN (1 col) ================= */}
        <div className="space-y-6">
          {/* Refund Summary Card */}
          <Card className="p-5 sm:p-6 border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Refund Summary
                </h3>
              </div>
              <Badge status={caseData.refundStatus} />
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">Refund ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{caseData.refundId}</span>
                  <CopyButton text={caseData.refundId} label="Refund ID" />
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">Refund Amount</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(caseData.refundAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">Payment Method</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{caseData.paymentMethod}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">Destination</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{caseData.upiId || 'Original source'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Settlement Target</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Within 4 Hours</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => navigate('/ai-support')}
                className="w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Check Refund with AI</span>
              </button>

              <Link
                to="/refunds"
                className="w-full py-1.5 text-center block text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                View in Refunds Ledger →
              </Link>
            </div>
          </Card>

          {/* SLA Status Card with Live Countdown */}
          <Card className="p-5 sm:p-6 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>SLA Performance & Countdown</span>
            </h3>

            <SlaCountdown
              initialHoursRemaining={caseData.slaHoursRemaining}
              slaState={caseData.slaState}
              slaTotalHours={caseData.slaConfiguredHours}
            />

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Escalation Status:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {caseData.slaEscalated ? 'Escalated to Senior Supervisor' : 'Auto-escalation Active'}
                </span>
              </div>

              {!caseData.slaEscalated ? (
                <Button
                  variant="outline"
                  size="sm"
                  icon={ShieldAlert}
                  onClick={handleOpenEscalateModal}
                  className="w-full text-xs text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  Escalate Case to Agent
                </Button>
              ) : (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Senior Supervisor Assigned • High Priority</span>
                </div>
              )}
            </div>
          </Card>

          {/* Order Information Card */}
          <Card className="p-5 sm:p-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Order Information</span>
              </h3>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{caseData.orderNumber}</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Item Ordered</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">{caseData.itemName}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{caseData.itemDetails}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Order Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5">{caseData.orderDate}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Delivery Address</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 block mt-0.5 leading-relaxed">
                  {caseData.deliveryAddress}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ================= BELOW: CASE TIMELINE & AUDIT HISTORY ================= */}
      <Card className="dark:bg-slate-900 dark:border-slate-800">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Case Timeline & Audit History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete chronological tracking of all events, messages, and SLA transitions
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Visual Timeline ({caseData.timeline.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Audit Log ({caseData.auditLogs.length})
            </button>
          </div>
        </div>

        <CardBody>
          {activeTab === 'timeline' ? (
            <div className="relative pl-7 sm:pl-9 space-y-6 before:absolute before:left-3.5 sm:before:left-4.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {caseData.timeline.map((event, idx) => {
                const nodeConfig = getTimelineNodeConfig(event);
                const NodeIcon = nodeConfig.icon;

                return (
                  <div key={event.id || idx} className="relative flex items-start gap-4 group">
                    {/* Timeline icon */}
                    <div
                      className={`absolute -left-7 sm:-left-9 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110 ${nodeConfig.color}`}
                    >
                      <NodeIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    <div
                      className={`flex-1 p-4 rounded-2xl border transition-all ${nodeConfig.border} bg-white dark:bg-slate-800/80 dark:border-slate-800 shadow-xs hover:shadow-card`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs sm:text-sm font-bold ${nodeConfig.title} dark:text-slate-100`}>
                            {event.title}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${nodeConfig.badge}`}
                          >
                            {event.actor}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {event.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5 sm:px-4">Timestamp</th>
                    <th className="p-3.5 sm:px-4">Actor</th>
                    <th className="p-3.5 sm:px-4">Action & System Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {caseData.auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 sm:px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-3.5 sm:px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {log.actor}
                      </td>
                      <td className="p-3.5 sm:px-4 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Escalation Modal */}
      <Modal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        title="Escalate Case to Senior Support Supervisor"
        subtitle={`Case ${caseData.id} • Order ${caseData.orderNumber} • ₹${caseData.refundAmount}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold block text-amber-950 dark:text-amber-100">Immediate Priority Routing:</strong>
              Escalating flags this case for urgent intervention by the on-duty support lead. An escalation event is permanently logged into the case audit trail.
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Reason for Escalation
            </label>
            <div className="space-y-2">
              {[
                'SLA deadline approaching without UPI settlement confirmation',
                'Banking partner gateway timeout or transaction error',
                'Need urgent supervisory intervention for high value order',
                'Other',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-xs ${
                    escalationReason === reason
                      ? 'bg-brand-50/70 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 text-brand-950 dark:text-brand-200 font-medium'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="escalationReason"
                    value={reason}
                    checked={escalationReason === reason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    className="mt-0.5 text-brand-600 focus:ring-brand-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {escalationReason === 'Other' && (
              <div className="mt-3">
                <textarea
                  rows={3}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Provide specific details about why supervisory review is needed..."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEscalateModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ShieldAlert}
              onClick={handleConfirmEscalation}
              className="text-xs bg-purple-600 hover:bg-purple-700"
            >
              Confirm Escalation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CaseDetails;
