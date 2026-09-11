import api, { DEMO_USER_ID } from './api';

/**
 * Case Service
 * Communicates with AWS API Gateway backend for support cases, SLA, and customer messages.
 */
export const caseService = {
  /**
   * Fetch all cases for a user
   * GET /users/{userId}/cases
   */
  async getUserCases(userId = DEMO_USER_ID) {
    try {
      const response = await api.get(`/users/${userId}/cases`);
      return response?.cases || [];
    } catch (error) {
      console.warn(`[caseService.getUserCases] Falling back: ${error.message}`);
      throw error;
    }
  },

  /**
   * Fetch case details by ID
   * GET /cases/{caseId}
   * If route returns 401/404, fallback handles merging with user cases.
   */
  async getCaseDetails(caseId) {
    try {
      const response = await api.get(`/cases/${caseId}`);
      return response?.case || response || null;
    } catch (error) {
      console.warn(`[caseService.getCaseDetails] Endpoint not available (${error.message}). Relying on user cases list.`);
      return null;
    }
  },

  /**
   * Fetch messages thread for a case
   * GET /cases/{caseId}/messages
   */
  async getCaseMessages(caseId) {
    try {
      const response = await api.get(`/cases/${caseId}/messages`);
      return response?.messages || [];
    } catch (error) {
      console.warn(`[caseService.getCaseMessages] ${error.message}`);
      return [];
    }
  },

  /**
   * Fetch SLA monitoring state for a case
   * GET /cases/{caseId}/sla
   */
  async getCaseSla(caseId) {
    try {
      const response = await api.get(`/cases/${caseId}/sla`);
      return response || null;
    } catch (error) {
      console.warn(`[caseService.getCaseSla] ${error.message}`);
      return null;
    }
  },

  /**
   * Send a new message to a case thread
   * POST /cases/{caseId}/messages
   */
  async sendCaseMessage(caseId, messageText, userId = DEMO_USER_ID) {
    try {
      const payload = {
        sender: 'CUSTOMER',
        message: messageText,
        userId: userId,
      };
      const response = await api.post(`/cases/${caseId}/messages`, payload);
      return response;
    } catch (error) {
      console.error(`[caseService.sendCaseMessage] Failed: ${error.message}`);
      throw error;
    }
  },

  /**
   * Update case status or metadata (e.g. escalate)
   * PATCH /cases/{caseId}
   */
  async updateCaseStatus(caseId, { status = 'ESCALATED', reason = '' } = {}) {
    try {
      const payload = {
        status,
        reason: reason || 'Customer requested supervisory escalation',
      };
      const response = await api.patch(`/cases/${caseId}`, payload);
      return response?.case || response;
    } catch (error) {
      console.error(`[caseService.updateCaseStatus] Failed: ${error.message}`);
      throw error;
    }
  },
};

export default caseService;
