import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import Toast from '../components/common/Toast';
import caseService from '../services/caseService';
import refundService from '../services/refundService';
import policyService from '../services/policyService';
import notificationService from '../services/notificationService';
import userService from '../services/userService';
import authService from '../services/authService';
import { DEMO_USER_ID } from '../services/api';
import { useAuth } from './AuthContext';

export const SupportContext = createContext(null);

const PRODUCT_PRESETS = [
  { itemName: 'Classic Cotton Oversized Shirt', itemSku: 'SKU-SHIRT-BLK-M', itemDetails: 'Size: M • Color: Jet Black • Qty: 1', refundAmount: 2499 },
  { itemName: 'Relaxed Fit Linen Trousers', itemSku: 'SKU-TRSR-BGE-32', itemDetails: 'Size: 32 • Color: Beige • Qty: 1', refundAmount: 1899 },
  { itemName: 'Merino Wool Blend Cardigan', itemSku: 'SKU-KNT-NAVY-L', itemDetails: 'Size: L • Color: Navy • Qty: 1', refundAmount: 3299 },
  { itemName: 'Minimalist White Sneakers', itemSku: 'SKU-SNK-WHT-42', itemDetails: 'Size: 42 • Color: Crisp White • Qty: 1', refundAmount: 2499 },
  { itemName: 'Structured Tan Leather Handbag', itemSku: 'SKU-BAG-TAN-01', itemDetails: 'Material: Full Grain Leather • Color: Tan • Qty: 1', refundAmount: 3999 },
  { itemName: 'Heavyweight Cotton Crewneck T-Shirt', itemSku: 'SKU-TEE-GRY-M', itemDetails: 'Size: M • Color: Charcoal Grey • Qty: 1', refundAmount: 1299 },
  { itemName: 'Structured Slim Blazer', itemSku: 'SKU-BLZR-GRY-40', itemDetails: 'Size: 40 • Color: Slate Grey • Qty: 1', refundAmount: 4199 },
];

const INITIAL_CASES = [
  {
    id: 'FR-1F40B7F5',
    orderNumber: 'ORD-10021',
    customerName: 'Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+91 98765 43210',
    itemName: 'Classic Cotton Oversized Shirt',
    itemSku: 'SKU-SHIRT-BLK-M',
    itemDetails: 'Size: M • Color: Jet Black • Qty: 1',
    orderDate: 'Aug 28, 2026',
    deliveryAddress: 'Flat 402, Green Meadows, Indiranagar, Bengaluru, KA 560038',
    category: 'Refund Delay',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    refundId: 'RF-90001',
    refundAmount: 2499,
    refundStatus: 'PROCESSING',
    paymentMethod: 'UPI',
    upiId: 'customer@okhdfcbank',
    currency: 'INR',
    createdAt: '2026-09-05T11:20:00Z',
    updatedAt: '2026-09-06T10:15:00Z',
    slaConfiguredHours: 24,
    slaHoursRemaining: 4,
    slaState: 'At risk',
    slaEscalated: false,
    assignedAgent: 'Support Specialist - L1 Support',
    customerComplaint:
      'I returned the item 3 days ago. The system verified intake at 09:15 AM, but the ₹2,499 refund is still processing and hasn\'t credited to my UPI account. Since this is nearing the 24-hour SLA window, please expedite the banking settlement.',
    messages: [
      {
        id: 'msg-1',
        sender: 'Customer',
        isCustomer: true,
        avatarText: 'C',
        timestamp: 'Sep 5, 11:20 AM',
        text: 'Hello, I raised a return for order ORD-10021 due to a defect on the collar seam. When will my ₹2,499 refund be initiated to my UPI account?',
        attachments: [],
      },
      {
        id: 'msg-2',
        sender: 'FitResQ AI Support',
        isCustomer: false,
        avatarText: 'AI',
        timestamp: 'Sep 5, 11:21 AM',
        text: 'Hello! Your return request for order ORD-10021 has been registered under Case FR-1F40B7F5. In accordance with Refund Policy Rule 1, refunds are triggered immediately once the returned product is verified by our system upon arrival at the intake facility.',
        attachments: [],
      },
      {
        id: 'msg-3',
        sender: 'FitResQ System',
        isCustomer: false,
        avatarText: 'SYS',
        timestamp: 'Sep 6, 09:15 AM',
        text: 'System Update: Package intake scan completed at fulfillment hub. Product verification check PASSED. Refund authorization RF-90001 created.',
        attachments: [],
      },
      {
        id: 'msg-4',
        sender: 'Support Specialist (L1)',
        isCustomer: false,
        avatarText: 'L1',
        timestamp: 'Sep 6, 10:00 AM',
        text: 'Hi Customer, your refund of ₹2,499 has been sent to our banking partner for direct UPI transfer to customer@okhdfcbank. Status is currently PROCESSING. We are monitoring this under your 24h SLA target.',
        attachments: [],
      },
    ],
    timeline: [
      {
        id: 't-1',
        type: 'created',
        title: 'Case Created',
        timestamp: 'Sep 5, 11:20 AM',
        completed: true,
        actor: 'Customer',
        description: 'Support case opened for order ORD-10021 under category Refund Delay.',
      },
      {
        id: 't-2',
        type: 'sla_started',
        title: 'SLA Started',
        timestamp: 'Sep 5, 11:20 AM',
        completed: true,
        actor: 'SLA Engine',
        description: '24-hour resolution SLA timer initiated. Target completion by Sep 6, 11:20 AM.',
      },
      {
        id: 't-3',
        type: 'message_received',
        title: 'Message Received',
        timestamp: 'Sep 5, 11:21 AM',
        completed: true,
        actor: 'Customer & AI',
        description: 'Customer inquiry received and preliminary policy clarification provided.',
      },
      {
        id: 't-4',
        type: 'assigned',
        title: 'Case Assigned',
        timestamp: 'Sep 5, 12:00 PM',
        completed: true,
        actor: 'Routing Bot',
        description: 'Case routed to High Priority Queue and assigned to Support Specialist L1.',
      },
      {
        id: 't-5',
        type: 'status_changed',
        title: 'Status Changed to IN_PROGRESS',
        timestamp: 'Sep 6, 09:15 AM',
        completed: true,
        actor: 'System Verification Engine',
        description: 'Returned item verified by system. Refund RF-90001 unlocked and set to PROCESSING.',
      },
      {
        id: 't-6',
        type: 'sla_alert',
        title: 'SLA At Risk Warning',
        timestamp: 'Sep 6, 07:20 AM',
        completed: true,
        actor: 'SLA Monitor',
        description: 'Case entered final 4-hour SLA window. Automatic escalation queued if settlement does not complete on time.',
      },
      {
        id: 't-7',
        type: 'escalation',
        title: 'Case Escalated',
        timestamp: 'Pending (If unresolved)',
        completed: false,
        actor: 'Escalation Supervisor',
        description: 'Auto-escalation to Senior Support Supervisor scheduled if unresolved by SLA deadline.',
      },
      {
        id: 't-8',
        type: 'resolution',
        title: 'Resolution',
        timestamp: 'Awaiting Bank Settlement',
        completed: false,
        actor: 'Payment Gateway',
        description: 'Banking partner acknowledgement and refund credit to customer@okhdfcbank.',
      },
    ],
    auditLogs: [
      { id: 'al-1', timestamp: 'Sep 6, 10:15 AM', actor: 'Customer', action: 'Added message to case inquiry thread' },
      { id: 'al-2', timestamp: 'Sep 6, 10:00 AM', actor: 'Support Specialist', action: 'Refund RF-90001 submitted to UPI gateway' },
      { id: 'al-3', timestamp: 'Sep 6, 09:15 AM', actor: 'System Verification', action: 'Item condition verified passed. Case status updated to IN_PROGRESS' },
    ],
  },
  {
    id: 'FR-2E89A102',
    orderNumber: 'ORD-09942',
    customerName: 'Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+91 98765 43210',
    itemName: 'Relaxed Fit Linen Trousers',
    itemSku: 'SKU-TRSR-BGE-32',
    itemDetails: 'Size: 32 • Color: Beige • Qty: 1',
    orderDate: 'Aug 25, 2026',
    deliveryAddress: 'Flat 402, Green Meadows, Indiranagar, Bengaluru, KA 560038',
    category: 'Order Issue',
    priority: 'HIGH',
    status: 'ESCALATED',
    refundId: 'RF-89945',
    refundAmount: 1899,
    refundStatus: 'REQUIRES_ACTION',
    paymentMethod: 'UPI',
    upiId: 'customer@okhdfcbank',
    currency: 'INR',
    createdAt: '2026-09-04T09:15:00Z',
    updatedAt: '2026-09-06T08:30:00Z',
    slaConfiguredHours: 24,
    slaHoursRemaining: 0,
    slaState: 'Escalated',
    slaEscalated: true,
    assignedAgent: 'Senior Support Agent (Priya K.)',
    customerComplaint: 'Incorrect item was sent in delivery. Returned parcel has been sitting in warehouse without scan. 24h SLA breached.',
    messages: [],
    timeline: [],
    auditLogs: [],
  },
  {
    id: 'FR-3B45C991',
    orderNumber: 'ORD-10118',
    customerName: 'Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+91 98765 43210',
    itemName: 'Merino Wool Blend Cardigan',
    itemSku: 'SKU-KNT-NAVY-L',
    itemDetails: 'Size: L • Color: Navy • Qty: 1',
    orderDate: 'Sep 2, 2026',
    deliveryAddress: 'Flat 402, Green Meadows, Indiranagar, Bengaluru, KA 560038',
    category: 'Return & Refund',
    priority: 'MEDIUM',
    status: 'IN_REVIEW',
    refundId: 'RF-90024',
    refundAmount: 3299,
    refundStatus: 'FAILED',
    paymentMethod: 'Net Banking',
    upiId: null,
    currency: 'INR',
    createdAt: '2026-09-06T08:00:00Z',
    updatedAt: '2026-09-06T08:00:00Z',
    slaConfiguredHours: 24,
    slaHoursRemaining: 22,
    slaState: 'On track',
    slaEscalated: false,
    assignedAgent: 'AI Support (L1)',
    customerComplaint: 'Return initiated for size preference. Package en route to hub.',
    messages: [],
    timeline: [],
    auditLogs: [],
  },
  {
    id: 'FR-0D12F774',
    orderNumber: 'ORD-09810',
    customerName: 'Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+91 98765 43210',
    itemName: 'Structured Slim Blazer',
    itemSku: 'SKU-BLZR-GRY-40',
    itemDetails: 'Size: 40 • Color: Slate Grey • Qty: 1',
    orderDate: 'Aug 20, 2026',
    deliveryAddress: 'Flat 402, Green Meadows, Indiranagar, Bengaluru, KA 560038',
    category: 'Quality Issue',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    refundId: 'RF-89750',
    refundAmount: 4199,
    refundStatus: 'COMPLETED',
    paymentMethod: 'UPI',
    upiId: 'customer@okhdfcbank',
    currency: 'INR',
    createdAt: '2026-08-30T10:00:00Z',
    updatedAt: '2026-09-01T14:30:00Z',
    slaConfiguredHours: 24,
    slaHoursRemaining: 0,
    slaState: 'On track',
    slaEscalated: false,
    assignedAgent: 'AI Support (L1)',
    customerComplaint: 'Fabric flaw on lapel. Requested full refund.',
    messages: [],
    timeline: [],
    auditLogs: [],
  },
];

const INITIAL_REFUNDS = [
  {
    id: 'RF-90001',
    orderId: 'ORD-10021',
    orderNumber: 'ORD-10021',
    caseId: 'FR-1F40B7F5',
    amount: 2499,
    currency: 'INR',
    status: 'PROCESSING',
    paymentMethod: 'UPI',
    destination: 'customer@okhdfcbank',
    initiatedDate: 'Aug 29, 2026',
    expectedDate: 'Sep 3, 2026',
    expectedCompletionDate: 'Sep 3, 2026',
    lastUpdated: '15 mins ago',
    timeline: [
      {
        id: 'rf-t1',
        title: 'Refund initiated',
        timestamp: 'Aug 29, 10:00 AM',
        completed: true,
        note: 'Return inspection verified by system. Payout ticket generated.',
      },
      {
        id: 'rf-t2',
        title: 'Payment processor contacted',
        timestamp: 'Aug 29, 10:15 AM',
        completed: true,
        note: 'Settlement payload sent to UPI banking switch.',
      },
      {
        id: 'rf-t3',
        title: 'Refund processing',
        timestamp: 'Sep 1, 09:30 AM',
        completed: true,
        note: 'Refund is currently processing with customer banking partner.',
      },
      {
        id: 'rf-t4',
        title: 'Expected completion',
        timestamp: 'Sep 3, 2026',
        completed: false,
        note: 'Automated SLA deadline for banking settlement.',
      },
      {
        id: 'rf-t5',
        title: 'Completed',
        timestamp: 'Pending settlement',
        completed: false,
        note: 'Final credit confirmation and reference UTR dispatch.',
      },
    ],
  },
  {
    id: 'RF-89945',
    orderId: 'ORD-09942',
    orderNumber: 'ORD-09942',
    caseId: 'FR-2E89A102',
    amount: 1899,
    currency: 'INR',
    status: 'REQUIRES_ACTION',
    paymentMethod: 'UPI',
    destination: 'customer@okhdfcbank',
    initiatedDate: 'Aug 26, 2026',
    expectedDate: 'Sep 1, 2026',
    expectedCompletionDate: 'Sep 1, 2026',
    lastUpdated: '2 hours ago',
    timeline: [
      {
        id: 'rf-t1',
        title: 'Refund initiated',
        timestamp: 'Aug 26, 12:00 PM',
        completed: true,
        note: 'Refund opened following order issue report.',
      },
      {
        id: 'rf-t2',
        title: 'Payment processor contacted',
        timestamp: 'Aug 26, 12:30 PM',
        completed: true,
        note: 'Inbound UPI routing initiated.',
      },
      {
        id: 'rf-t3',
        title: 'Refund processing',
        timestamp: 'Aug 28, 04:00 PM',
        completed: true,
        note: 'Bank rejected settlement: incorrect VPA alias.',
      },
      {
        id: 'rf-t4',
        title: 'Expected completion',
        timestamp: 'Action Required',
        completed: false,
        note: 'Customer must re-verify UPI VPA in profile or contact support.',
      },
      {
        id: 'rf-t5',
        title: 'Completed',
        timestamp: 'Pending Action',
        completed: false,
        note: 'Awaiting updated account confirmation.',
      },
    ],
  },
  {
    id: 'RF-90024',
    orderId: 'ORD-10118',
    orderNumber: 'ORD-10118',
    caseId: 'FR-3B45C991',
    amount: 3299,
    currency: 'INR',
    status: 'FAILED',
    paymentMethod: 'Net Banking',
    destination: 'HDFC Bank •••• 5612',
    initiatedDate: 'Aug 30, 2026',
    expectedDate: 'Sep 4, 2026',
    expectedCompletionDate: 'Sep 4, 2026',
    lastUpdated: 'Yesterday',
    timeline: [
      {
        id: 'rf-t1',
        title: 'Refund initiated',
        timestamp: 'Aug 30, 08:00 AM',
        completed: true,
        note: 'Refund ticket issued for returned cardigan.',
      },
      {
        id: 'rf-t2',
        title: 'Payment processor contacted',
        timestamp: 'Aug 30, 08:30 AM',
        completed: true,
        note: 'Net Banking settlement gateway triggered.',
      },
      {
        id: 'rf-t3',
        title: 'Refund processing',
        timestamp: 'Aug 31, 02:00 PM',
        completed: true,
        note: 'Gateway reported network timeout from beneficiary bank.',
      },
      {
        id: 'rf-t4',
        title: 'Expected completion',
        timestamp: 'Failed',
        completed: false,
        note: 'Transaction flagged as FAILED by central clearinghouse.',
      },
      {
        id: 'rf-t5',
        title: 'Completed',
        timestamp: 'Retrying automatically',
        completed: false,
        note: 'System queuing automated re-attempt via alternate switch.',
      },
    ],
  },
  {
    id: 'RF-89750',
    orderId: 'ORD-09810',
    orderNumber: 'ORD-09810',
    caseId: 'FR-0D12F774',
    amount: 4199,
    currency: 'INR',
    status: 'COMPLETED',
    paymentMethod: 'UPI',
    destination: 'customer@okhdfcbank',
    initiatedDate: 'Aug 20, 2026',
    expectedDate: 'Aug 24, 2026',
    expectedCompletionDate: 'Aug 24, 2026',
    lastUpdated: 'Sep 1, 2026',
    timeline: [
      {
        id: 'rf-t1',
        title: 'Refund initiated',
        timestamp: 'Aug 20, 10:00 AM',
        completed: true,
        note: 'Refund ticket opened following blazer inspection.',
      },
      {
        id: 'rf-t2',
        title: 'Payment processor contacted',
        timestamp: 'Aug 20, 10:30 AM',
        completed: true,
        note: 'Dispatched to UPI gateway.',
      },
      {
        id: 'rf-t3',
        title: 'Refund processing',
        timestamp: 'Aug 22, 11:00 AM',
        completed: true,
        note: 'Cleared clearinghouse switch.',
      },
      {
        id: 'rf-t4',
        title: 'Expected completion',
        timestamp: 'Aug 24, 2026',
        completed: true,
        note: 'Delivered within SLA.',
      },
      {
        id: 'rf-t5',
        title: 'Completed',
        timestamp: 'Aug 24, 02:30 PM',
        completed: true,
        note: 'UTR 2408994812 credited to customer@okhdfcbank.',
      },
    ],
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'CASE_ESCALATED',
    title: 'Case escalated',
    description: 'Case FR-1F40B7F5 has been escalated because its SLA was breached.',
    timestamp: '10 minutes ago',
    group: 'Today',
    read: false,
    caseId: 'FR-1F40B7F5',
    refundId: 'RF-90001',
    actionText: 'View Case',
    actionUrl: '/cases/FR-1F40B7F5',
  },
  {
    id: 'notif-2',
    type: 'REFUND_UPDATED',
    title: 'Refund status updated',
    description: 'Refund RF-90001 for order ORD-10021 is still processing.',
    timestamp: '45 minutes ago',
    group: 'Today',
    read: false,
    caseId: 'FR-1F40B7F5',
    refundId: 'RF-90001',
    actionText: 'Track Refund',
    actionUrl: '/refunds',
  },
  {
    id: 'notif-3',
    type: 'SLA_WARNING',
    title: 'SLA warning',
    description: 'Case FR-1F40B7F5 is approaching its resolution deadline.',
    timestamp: '2 hours ago',
    group: 'Today',
    read: false,
    caseId: 'FR-1F40B7F5',
    refundId: 'RF-90001',
    actionText: 'Check Case',
    actionUrl: '/cases/FR-1F40B7F5',
  },
  {
    id: 'notif-4',
    type: 'REFUND_COMPLETED',
    title: 'Refund completed',
    description: '₹4,199 has been credited via UPI for order ORD-09810.',
    timestamp: 'Yesterday at 02:30 PM',
    group: 'Earlier',
    read: true,
    caseId: 'FR-0D12F774',
    refundId: 'RF-89750',
    actionText: 'View Details',
    actionUrl: '/cases/FR-0D12F774',
  },
  {
    id: 'notif-5',
    type: 'CASE_UPDATED',
    title: 'Case status updated',
    description: 'Case FR-3B45C991 changed status to IN_REVIEW.',
    timestamp: '2 days ago',
    group: 'Earlier',
    read: true,
    caseId: 'FR-3B45C991',
    refundId: 'RF-90024',
    actionText: 'Open Case',
    actionUrl: '/cases/FR-3B45C991',
  },
  {
    id: 'notif-6',
    type: 'SYSTEM',
    title: 'System update',
    description: 'FitResQ automated verification engine updated with zero downtime.',
    timestamp: '3 days ago',
    group: 'Earlier',
    read: true,
    caseId: null,
    refundId: null,
    actionText: null,
    actionUrl: null,
  },
];

const INITIAL_CUSTOMER_PROFILE = {
  userId: null,
  id: null,
  name: null,
  email: null,
  phone: null,
  role: 'CUSTOMER',
  createdAt: null,
  accountStatus: 'Active',
  memberSince: null,
  defaultUpiId: null,
  defaultPaymentMethod: 'UPI',
  deliveryAddress: null,
  supportStats: {
    activeCases: 0,
    resolvedCases: 0,
    totalCases: 0,
    totalRefunds: 0,
    totalRefundAmount: 0,
  },
  preferences: {
    caseUpdates: true,
    refundUpdates: true,
    slaAlerts: true,
    supportMessages: true,
    preferredCommunication: 'Email',
    realTimeNotifications: true,
  },
};

export const SupportProvider = ({ children }) => {
  const auth = useAuth();
  const currentUserId = auth?.user?.id || DEMO_USER_ID;

  const [cases, setCases] = useState(INITIAL_CASES);
  const [refunds, setRefunds] = useState(INITIAL_REFUNDS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [customerProfile, setCustomerProfile] = useState(INITIAL_CUSTOMER_PROFILE);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveBackendConnected, setIsLiveBackendConnected] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [refundPolicyText, setRefundPolicyText] = useState(null);

  // Fetch currently authenticated customer profile from AWS API Gateway GET /users/me
  const fetchUserProfile = useCallback(async () => {
    const idToken = authService.getIdToken() || localStorage.getItem('fitresq_id_token') || sessionStorage.getItem('fitresq_id_token');
    if (!idToken && !auth?.isAuthenticated) {
      setCustomerProfile(INITIAL_CUSTOMER_PROFILE);
      setProfileLoading(false);
      setProfileError(null);
      return null;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const me = await userService.getMe();
      if (me && me.userId) {
        setCustomerProfile((prev) => ({
          ...prev,
          userId: me.userId,
          id: me.userId,
          name: me.name || auth?.user?.name || null,
          email: me.email || auth?.user?.email || null,
          phone: me.phone || auth?.user?.phoneNumber || null,
          role: me.role || 'CUSTOMER',
          createdAt: me.createdAt || null,
          memberSince: me.createdAt
            ? new Date(me.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : prev.memberSince,
        }));
        setProfileError(null);
        return me;
      } else {
        throw new Error('Customer profile response missing userId');
      }
    } catch (err) {
      console.warn('[SupportContext] GET /users/me profile fetch notice:', err.status, err.message);
      const status = err.status || (err.message?.includes('404') ? 404 : err.message?.includes('401') ? 401 : 500);
      setProfileError({
        status,
        message: err.message || 'Unable to retrieve customer profile from server',
        cognitoSub: err.cognitoSub,
      });
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [auth?.isAuthenticated, auth?.user]);

  const addToast = (message, type = 'info', title = null) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load live data from AWS API Gateway backend
  const loadBackendData = useCallback(async (customUserId = null) => {
    setIsLoading(true);
    setApiError(null);

    const activeUserId = customUserId || (authService.isAuthenticated() ? null : DEMO_USER_ID);

    if (!activeUserId) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch live cases for authenticated user
      let backendCases = [];
      try {
        backendCases = await caseService.getUserCases(activeUserId);
      } catch (userErr) {
        console.warn(`[SupportContext] Failed to load cases for ${activeUserId}:`, userErr.message);
      }

      if (Array.isArray(backendCases) && backendCases.length > 0) {
        setIsLiveBackendConnected(true);

        const existingMap = new Map(INITIAL_CASES.map((c) => [c.id.toUpperCase(), c]));

        const mergedCases = backendCases.map((raw, idx) => {
          const existing = existingMap.get((raw.caseId || '').toUpperCase());
          const preset = PRODUCT_PRESETS[idx % PRODUCT_PRESETS.length];
          const isEscalated =
            raw.status === 'ESCALATED' ||
            raw.escalationLevel === '1' ||
            Number(raw.escalationLevel) > 0;

          return {
            id: raw.caseId,
            orderNumber: raw.orderId,
            orderId: raw.orderId,
            customerName: raw.customerName || 'Customer',
            customerEmail: raw.customerEmail || '',
            customerPhone: raw.customerPhone || '',
            itemName: existing?.itemName || preset.itemName,
            itemSku: existing?.itemSku || preset.itemSku,
            itemDetails: existing?.itemDetails || preset.itemDetails,
            orderDate: existing?.orderDate || 'Aug 28, 2026',
            deliveryAddress:
              existing?.deliveryAddress ||
              'Flat 402, Green Meadows, Indiranagar, Bengaluru, KA 560038',
            category: (raw.category || 'Refund Delay').replace(/_/g, ' '),
            priority: raw.priority || 'MEDIUM',
            status: raw.status === 'OPEN' ? 'IN_PROGRESS' : raw.status,
            refundId: existing?.refundId || `RF-${raw.caseId.slice(-5)}`,
            refundAmount: existing?.refundAmount || preset.refundAmount,
            refundStatus: isEscalated ? 'PROCESSING' : existing?.refundStatus || 'PROCESSING',
            paymentMethod: existing?.paymentMethod || 'UPI',
            upiId: existing?.upiId || 'customer@okhdfcbank',
            currency: 'INR',
            createdAt: raw.createdAt || existing?.createdAt || new Date().toISOString(),
            updatedAt: raw.updatedAt || existing?.updatedAt || new Date().toISOString(),
            slaConfiguredHours: existing?.slaConfiguredHours || 24,
            slaHoursRemaining: isEscalated ? 0 : existing?.slaHoursRemaining ?? 4,
            slaState: isEscalated ? 'Escalated' : raw.priority === 'HIGH' ? 'At risk' : 'On track',
            slaEscalated: isEscalated,
            assignedAgent: isEscalated
              ? 'Senior Support Supervisor (Escalated)'
              : existing?.assignedAgent || 'Support Specialist - L1 Support',
            customerComplaint:
              raw.description ||
              existing?.customerComplaint ||
              'Support issue registered for order.',
            messages: existing?.messages || [],
            timeline: existing?.timeline || [],
            auditLogs: existing?.auditLogs || [],
          };
        });

        // 2. Fetch live messages & SLA for primary case FR-1F40B7F5
        try {
          const [liveMessagesRes, liveSlaRes] = await Promise.allSettled([
            caseService.getCaseMessages('FR-1F40B7F5'),
            caseService.getCaseSla('FR-1F40B7F5'),
          ]);

          if (
            liveMessagesRes.status === 'fulfilled' &&
            Array.isArray(liveMessagesRes.value) &&
            liveMessagesRes.value.length > 0
          ) {
            const formatted = liveMessagesRes.value
              .filter((m) => m.message)
              .map((m, mIdx) => ({
                id: m.messageKey || `live-msg-${mIdx}`,
                sender: m.sender === 'CUSTOMER' ? 'Customer' : 'FitResQ Support Specialist',
                isCustomer: m.sender === 'CUSTOMER',
                avatarText: m.sender === 'CUSTOMER' ? 'C' : 'AI',
                timestamp: m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recently',
                text: m.message,
                attachments: [],
              }));

            const targetCase = mergedCases.find((c) => c.id === 'FR-1F40B7F5');
            if (targetCase) {
              const existingTexts = new Set(targetCase.messages.map((msg) => msg.text.trim()));
              const newOnes = formatted.filter((f) => !existingTexts.has(f.text.trim()));
              targetCase.messages = [...targetCase.messages, ...newOnes];
            }
          }

          if (liveSlaRes.status === 'fulfilled' && liveSlaRes.value) {
            const targetCase = mergedCases.find((c) => c.id === 'FR-1F40B7F5');
            if (targetCase && liveSlaRes.value.status === 'BREACHED') {
              targetCase.slaState = 'At risk';
            }
          }
        } catch (subErr) {
          console.warn('[SupportContext] Error fetching case sub-resources:', subErr);
        }

        setCases(mergedCases);
      }

      // 3. Fetch live refund for ORD-10021 from AWS
      try {
        const liveRefund = await refundService.getRefundByOrderId('ORD-10021');
        if (liveRefund) {
          setRefunds((prev) => {
            const exists = prev.find(
              (r) => r.id === liveRefund.refundId || r.orderId === liveRefund.orderId
            );
            const mapped = {
              id: liveRefund.refundId || 'RF-90001',
              orderId: liveRefund.orderId || 'ORD-10021',
              orderNumber: liveRefund.orderId || 'ORD-10021',
              caseId: liveRefund.caseId || 'FR-1F40B7F5',
              amount: Number(liveRefund.amount) || 2499,
              currency: liveRefund.currency || 'INR',
              status: liveRefund.status || 'PROCESSING',
              paymentMethod: liveRefund.paymentMethod || 'UPI',
              destination: 'customer@okhdfcbank',
              initiatedDate: liveRefund.initiatedAt
                ? new Date(liveRefund.initiatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Aug 29, 2026',
              expectedDate: liveRefund.expectedBy
                ? new Date(liveRefund.expectedBy).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Sep 3',
              expectedCompletionDate: liveRefund.expectedBy || 'Sep 3, 2026',
              lastUpdated: liveRefund.updatedAt ? 'Recently synced' : '15 mins ago',
              timeline: exists?.timeline || INITIAL_REFUNDS[0].timeline,
            };

            if (exists) {
              return prev.map((r) =>
                r.id === mapped.id || r.orderId === mapped.orderId ? { ...r, ...mapped } : r
              );
            }
            return [mapped, ...prev];
          });
        }
      } catch (refErr) {
        console.warn('[SupportContext] Error fetching live refund:', refErr);
      }

      // 4. Fetch live refund policy from AWS
      try {
        const livePolicy = await policyService.getRefundPolicy();
        if (livePolicy) {
          setRefundPolicyText(livePolicy);
        }
      } catch (polErr) {
        console.warn('[SupportContext] Error fetching live policy:', polErr);
      }
    } catch (err) {
      console.warn('[SupportProvider] Backend unavailable, using robust fallback state:', err.message);
      setApiError(err.message);
      setIsLiveBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth?.isAuthenticated) {
      fetchUserProfile()
        .then((me) => {
          const targetUserId =
            me?.userId ||
            (auth?.user?.sub === '01c33dea-c021-7081-15a5-5a86516f8e13' ? 'CUS-099' : auth?.user?.id) ||
            DEMO_USER_ID;
          loadBackendData(targetUserId);
        })
        .catch(() => {
          const fallbackUserId =
            (auth?.user?.sub === '01c33dea-c021-7081-15a5-5a86516f8e13' ? 'CUS-099' : auth?.user?.id) ||
            DEMO_USER_ID;
          loadBackendData(fallbackUserId);
        });
    } else {
      if (DEMO_USER_ID) {
        loadBackendData(DEMO_USER_ID);
      } else {
        setCustomerProfile(INITIAL_CUSTOMER_PROFILE);
        setIsLoading(false);
      }
    }
  }, [auth?.isAuthenticated, auth?.user, fetchUserProfile, loadBackendData]);

  const openCases = useMemo(
    () => cases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'Resolved'),
    [cases]
  );

  const pendingRefunds = useMemo(
    () => refunds.filter((r) => r.status === 'PROCESSING' || r.status === 'REQUIRES_ACTION'),
    [refunds]
  );

  const casesRequiringAttention = useMemo(
    () =>
      cases.filter(
        (c) =>
          c.priority === 'HIGH' ||
          c.slaState === 'At risk' ||
          c.slaState === 'Breached' ||
          c.slaEscalated
      ),
    [cases]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const getCaseById = (id) => {
    return cases.find((c) => c.id.toLowerCase() === id?.toLowerCase()) || null;
  };

  const getRefundById = (id) => {
    return refunds.find((r) => r.id.toLowerCase() === id?.toLowerCase()) || null;
  };

  const getRefundByCaseId = (caseId) => {
    return refunds.find((r) => r.caseId.toLowerCase() === caseId?.toLowerCase());
  };

  const addCaseMessage = async (caseId, text, attachments = []) => {
    const tempId = `msg-${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender: 'Customer',
      isCustomer: true,
      avatarText: 'C',
      timestamp: 'Just now',
      text,
      attachments,
    };

    const newAudit = {
      id: `al-${Date.now()}`,
      timestamp: 'Just now',
      actor: 'Customer',
      action: `Customer sent message: "${text.slice(0, 35)}${text.length > 35 ? '...' : ''}"`,
    };

    // 1. Optimistic UI update
    setCases((prev) =>
      prev.map((c) => {
        if (c.id.toLowerCase() === caseId.toLowerCase()) {
          return {
            ...c,
            updatedAt: new Date().toISOString(),
            messages: [...c.messages, newMsg],
            auditLogs: [newAudit, ...c.auditLogs],
          };
        }
        return c;
      })
    );

    // 2. Post to AWS API Gateway backend: POST /cases/{caseId}/messages
    try {
      const res = await caseService.sendCaseMessage(caseId, text, currentUserId);
      if (res?.messageKey) {
        setCases((prev) =>
          prev.map((c) => {
            if (c.id.toLowerCase() === caseId.toLowerCase()) {
              return {
                ...c,
                messages: c.messages.map((m) => (m.id === tempId ? { ...m, id: res.messageKey } : m)),
              };
            }
            return c;
          })
        );
      }
      addToast('Message posted to support case thread', 'success', 'Message Sent');
    } catch (err) {
      console.warn('[addCaseMessage] Backend dispatch delayed, preserved locally:', err.message);
      addToast('Message saved to local case thread', 'info', 'Message Sent');
    }
  };

  const escalateCase = async (caseId, reason = 'Customer requested SLA escalation') => {
    const escalationTimeline = {
      id: `t-esc-${Date.now()}`,
      type: 'escalation',
      title: 'Case Escalated to Senior Agent',
      timestamp: 'Just now',
      completed: true,
      actor: 'Customer Escalation',
      description: `Escalated per customer request: ${reason}. Priority assigned to supervisor queue.`,
    };

    const escalationAudit = {
      id: `al-esc-${Date.now()}`,
      timestamp: 'Just now',
      actor: 'Customer',
      action: `Case escalated: ${reason}`,
    };

    // 1. Optimistic local update
    setCases((prev) =>
      prev.map((c) => {
        if (c.id.toLowerCase() === caseId.toLowerCase()) {
          return {
            ...c,
            status: 'ESCALATED',
            slaState: 'Escalated',
            slaEscalated: true,
            assignedAgent: 'Senior Support Supervisor (Escalated)',
            timeline: [
              ...c.timeline.slice(0, -2),
              escalationTimeline,
              c.timeline[c.timeline.length - 1],
            ],
            auditLogs: [escalationAudit, ...c.auditLogs],
          };
        }
        return c;
      })
    );

    // 2. Patch to AWS API Gateway backend: PATCH /cases/{caseId}
    try {
      await caseService.updateCaseStatus(caseId, { status: 'ESCALATED', reason });
      addToast(
        `Case ${caseId} has been escalated in AWS support gateway.`,
        'warning',
        'Case Escalated'
      );
    } catch (err) {
      console.warn('[escalateCase] Backend sync failed, preserved locally:', err.message);
      addToast(
        `Case ${caseId} has been escalated to a senior support supervisor.`,
        'warning',
        'Case Escalated'
      );
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('All notifications marked as read', 'info');
  };

  const clearNotifications = () => {
    setNotifications([]);
    addToast('Notifications cleared', 'info');
  };

  const simulateAwsEvent = (customEvent = null) => {
    const defaultEvent = {
      id: `notif-${Date.now()}`,
      type: 'REFUND_UPDATED',
      title: 'Payment gateway status updated',
      description: 'UPI clearinghouse acknowledged transaction RF-90001 for order ORD-10021.',
      timestamp: 'Just now',
      group: 'Today',
      read: false,
      caseId: 'FR-1F40B7F5',
      refundId: 'RF-90001',
      actionText: 'Track Refund',
      actionUrl: '/refunds',
      isLiveEvent: true,
    };

    const newEvent = customEvent || defaultEvent;

    setNotifications((prev) => [newEvent, ...prev]);
    addToast(newEvent.description, 'info', `Live Alert: ${newEvent.title}`);
  };

  const updateProfile = (updates) => {
    setCustomerProfile((prev) => ({ ...prev, ...updates }));
    addToast('Profile updated successfully', 'success');
  };

  const updatePreferences = (newPrefs) => {
    setCustomerProfile((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...newPrefs },
    }));
    addToast('Preferences saved successfully', 'success');
  };

  const value = {
    cases,
    openCases,
    refunds,
    pendingRefunds,
    casesRequiringAttention,
    notifications,
    customerProfile,
    profileLoading,
    profileError,
    fetchUserProfile,
    unreadNotificationsCount,
    toasts,
    addToast,
    removeToast,
    getCaseById,
    getRefundById,
    getRefundByCaseId,
    addCaseMessage,
    escalateCase,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    simulateAwsEvent,
    updateProfile,
    updatePreferences,
    // AWS Gateway Backend Integration properties:
    isLoading,
    isLiveBackendConnected,
    apiError,
    refundPolicyText,
    refreshData: loadBackendData,
  };

  return (
    <SupportContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};

export default SupportProvider;
