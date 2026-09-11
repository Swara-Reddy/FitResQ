import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  User,
  Send,
  Paperclip,
  Trash2,
  ReceiptText,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  CreditCard,
  Layers,
} from 'lucide-react';
import { useSupport } from '../context/SupportContext';
import aiService from '../services/aiService';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import CopyButton from '../components/common/CopyButton';
import { formatCurrency } from '../utils/formatters';
import { ProductThumbnail } from '../utils/productImages';
import aiCompanionImg from '../assets/hero/ai-companion.png';

const SUGGESTED_PROMPTS = [
  'Where is my refund?',
  'Why is my refund delayed?',
  'Track my case',
  'What is the refund policy?',
  'I want to escalate my case.',
];

const INITIAL_CONVERSATION = [
  {
    id: 'welcome-1',
    sender: 'ai',
    text: "Hello Customer, I am your FitResQ AI Support Assistant. I am directly linked to your order records, intake scans, and payment gateway logs.\n\nHow can I help resolve your order or refund inquiry today?",
    timestamp: 'Just now',
    refundCard: null,
    chips: [
      'Where is my refund?',
      'Why is my refund delayed?',
      "What's happening with my case?",
      'I want to escalate my case.',
    ],
  },
];

export const AISupport = () => {
  const navigate = useNavigate();
  const { customerProfile, getCaseById, escalateCase, addToast } = useSupport();

  const [messages, setMessages] = useState(INITIAL_CONVERSATION);
  const [inputText, setInputText] = useState('');
  const [isCheckingState, setIsCheckingState] = useState(false);
  const [checkingMessage, setCheckingMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCheckingState]);

  const handleClearConversation = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: "Conversation cleared. I am ready to help with your orders, refunds, and support cases.",
        timestamp: 'Just now',
        refundCard: null,
        chips: SUGGESTED_PROMPTS,
      },
    ]);
    addToast('Conversation history reset', 'info');
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

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() && attachedFiles.length === 0) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: 'Just now',
      attachments: [...attachedFiles],
      refundCard: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setAttachedFiles([]);

    // Show initial AI checking state
    setIsCheckingState(true);
    setCheckingMessage('Connecting with FitResQ Support Agent...');

    const history = messages
      .filter((m) => m.text && m.sender === 'user')
      .slice(-3)
      .map((m) => ({
        role: 'user',
        content: m.text,
      }));

    try {
      const result = await aiService.sendMessage(text.trim(), { history });

      let refundCardData = null;
      const refObj = result.api_data?.refund || (result.tool_used === 'refund_api' ? result.api_data : null);
      if (refObj && (refObj.orderId || refObj.amount || refObj.status)) {
        refundCardData = {
          orderNumber: refObj.orderId || result.api_data?.case?.orderId || '',
          caseId: refObj.caseId || result.api_data?.case?.caseId || '',
          refundAmount: Number(refObj.amount) || 0,
          status: refObj.status === 'PROCESSING' ? 'Processing' : (refObj.status || 'Active'),
          paymentMethod: refObj.paymentMethod || 'UPI',
          expectedBy: refObj.expectedBy
            ? `Expected: ${refObj.expectedBy.split('T')[0]}`
            : 'In processing window',
          destination: refObj.userId || 'Linked Customer Account',
        };
        if (!refundCardData.orderNumber && !refundCardData.refundAmount) {
          refundCardData = null;
        }
      }

      let chips = [];
      if (result.tool_used === 'refund_api' || result.tool_used === 'case_and_refund_api') {
        chips = ['Track my case', 'What is the refund policy?', 'I want to escalate my case.'];
      } else if (result.policy_used) {
        chips = ['What is the return window?', 'Can I return a damaged product?', 'How long does a refund take?'];
      } else {
        chips = SUGGESTED_PROMPTS.slice(0, 3);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: result.response,
          timestamp: 'Just now',
          refundCard: refundCardData,
          chips,
        },
      ]);
    } catch (err) {
      console.error('[AISupport] Error calling AI support service:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `I apologize, but I could not reach the support agent service: ${err.message}. Please verify the backend agent service is running.`,
          timestamp: 'Just now',
          refundCard: null,
          chips: ['Where is my refund for ORD-10021?', 'How long does a refund take?'],
        },
      ]);
    } finally {
      setIsCheckingState(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-200">
      {/* Flagship Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-100 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-2.5">
              <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse" />
              <span>FitResQ Autonomous Support Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How can we help?
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              Describe your issue and FitResQ will help resolve it. Get instant refund verification status, order tracking, and SLA escalation assistance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleClearConversation}
              className="text-xs"
              title="Clear current conversation"
            >
              Clear Chat
            </Button>
          </div>
        </div>

        {/* Quick Suggested Prompts Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block mb-2.5">
            Suggested Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-white border border-slate-200/80 dark:border-slate-700 hover:border-brand-200 dark:hover:border-slate-600 transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Context Grounding Banner */}
      <div className="bg-gradient-to-r from-brand-50/90 via-purple-50/50 to-slate-50 dark:from-brand-950/40 dark:via-purple-950/20 dark:to-slate-900 border border-brand-200/80 dark:border-brand-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">Context Grounding Active:</span>
              <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-900 border border-brand-200/80 dark:border-brand-800 px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                FR-1F40B7F5
                <CopyButton text="FR-1F40B7F5" label="Case ID" />
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">ORD-10021 (₹2,499)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live synchronized with order intake inspection and direct UPI settlement gateway telemetry.
            </p>
          </div>
        </div>

        <Link
          to="/cases/FR-1F40B7F5"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 border border-brand-200 dark:border-brand-800 px-3.5 py-1.5 rounded-xl transition-colors shrink-0 shadow-2xs self-start sm:self-center"
        >
          <span>Inspect Case</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Flagship Chat Conversation Area */}
      <Card className="flex flex-col h-[680px] shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {/* Chat Sub-header with Live Connection */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
              <img src={aiCompanionImg} alt="FitResQ AI" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">FitResQ AI Resolution Assistant</p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected to Case Ledger & SLA System</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
            Avg resolution time: &lt; 2 mins
          </span>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FDFDFE] dark:bg-slate-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 dark:bg-brand-600 text-white'
                    : 'bg-gradient-to-tr from-brand-600 to-cyan-500 p-0.5'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <img src={aiCompanionImg} alt="AI" className="w-full h-full object-contain" />
                )}
              </div>

              <div className="space-y-2.5 flex-1">
                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 dark:bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Customer attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 dark:border-slate-700 flex flex-wrap gap-1.5">
                      {msg.attachments.map((file, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[11px] text-slate-200"
                        >
                          <Paperclip className="w-3 h-3 text-slate-300" />
                          {file}
                        </span>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-2 ${
                      msg.sender === 'user' ? 'text-slate-400 dark:text-white/70' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* RICH REFUND CARD inside Conversation */}
                {msg.refundCard && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/90 dark:border-blue-900/60 p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-1">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Refund Ledger Record
                        </span>
                      </div>
                      <Badge status={msg.refundCard.status} />
                    </div>

                    <div className="flex items-start gap-3.5">
                      <ProductThumbnail title="Linen Classic Shirt" size="md" className="shrink-0 mt-1" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                            Order
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {msg.refundCard.orderNumber}
                            </span>
                            <CopyButton text={msg.refundCard.orderNumber} label="Order ID" />
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                            Refund
                          </span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                            {formatCurrency(msg.refundCard.refundAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                            Payment
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
                            {msg.refundCard.paymentMethod}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                            Expected by
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
                            {msg.refundCard.expectedBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Destination: {msg.refundCard.destination}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={ExternalLink}
                        iconPosition="right"
                        className="text-xs py-1 px-3 bg-brand-600 hover:bg-brand-700"
                        onClick={() => navigate(`/cases/${msg.refundCard.caseId}`)}
                      >
                        View Case
                      </Button>
                    </div>
                  </div>
                )}

                {/* Follow-up Quick Action Chips */}
                {msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (chip === 'View Case Details' || chip === 'View Case FR-1F40B7F5') {
                            navigate('/cases/FR-1F40B7F5');
                          } else {
                            handleSendMessage(chip);
                          }
                        }}
                        className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-white border border-slate-200/70 dark:border-slate-700 hover:border-brand-200 dark:hover:border-slate-600 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* AI Response State: "Checking your refund and support case..." */}
          {isCheckingState && (
            <div className="flex gap-3 max-w-[80%] animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800/80 p-4 rounded-2xl rounded-tl-none shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
                  <span>{checkingMessage}</span>
                </div>
                <div className="flex items-center gap-1.5 pl-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
          {/* Attached files preview */}
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttach}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Attach document or screenshot"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your refund, case status, or escalate..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Send}
              disabled={(!inputText.trim() && attachedFiles.length === 0) || isCheckingState}
              className="shrink-0 bg-brand-600 hover:bg-brand-700"
            >
              Send
            </Button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
            <span>Direct resolution with live banking and SLA log verification</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AISupport;
