export const CASE_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'In Review',
  VERIFIED: 'Item Verified',
  REFUND_PROCESSING: 'Refund Processing',
  ESCALATED: 'Escalated to Agent',
  RESOLVED: 'Resolved',
};

export const CASE_PRIORITIES = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

export const REFUND_STATUSES = {
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REQUIRES_ACTION: 'REQUIRES_ACTION',
};

export const NOTIFICATION_TYPES = {
  CASE_UPDATED: 'CASE_UPDATED',
  CASE_ESCALATED: 'CASE_ESCALATED',
  SLA_WARNING: 'SLA_WARNING',
  REFUND_UPDATED: 'REFUND_UPDATED',
  REFUND_COMPLETED: 'REFUND_COMPLETED',
  SYSTEM: 'SYSTEM',
};

export const NAVIGATION_LINKS = [
  { name: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { name: 'AI Support', path: '/ai-support', icon: 'Bot', badge: 'AI Support' },
  { name: 'My Cases', path: '/cases', icon: 'LifeBuoy', badgeCountKey: 'openCases' },
  { name: 'Refunds', path: '/refunds', icon: 'ReceiptText', badgeCountKey: 'pendingRefunds' },
  { name: 'Notifications', path: '/notifications', icon: 'Bell', badgeCountKey: 'unreadNotifications' },
  { name: 'Profile', path: '/profile', icon: 'UserCircle' },
  { name: 'Settings', path: '/settings', icon: 'Sliders' },
];

export const REFUND_POLICY_RULES = [
  {
    id: 1,
    title: 'Verification Requirement',
    description: 'Refunds are initiated after the returned product has been verified by the system.',
  },
  {
    id: 2,
    title: 'Case-Based Tracking',
    description: 'Customers can track the refund status through their FitResQ support case.',
  },
  {
    id: 3,
    title: 'SLA Auto-Escalation',
    description: 'If a refund remains unresolved beyond the configured support SLA, the complaint may be escalated to a support agent.',
  },
  {
    id: 4,
    title: 'Direct Support Clarifications',
    description: 'Customers can contact FitResQ support for clarification regarding refund status.',
  },
];
