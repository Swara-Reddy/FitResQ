/**
 * FitResQ Refund Request Service
 * Communicates with backend POST /refund-requests to submit new customer refund requests
 * with automated 24h SLA tracking and audit logging.
 */
import api from './api';

export const refundRequestService = {
  /**
   * Submit a new refund request for an order.
   * @param {Object} params
   * @param {string} params.orderId - Order ID (e.g. ORD-10021)
   * @param {string} params.reason - Refund reason (e.g. "Damaged item")
   * @param {string} [params.description] - Optional details
   * @returns {Promise<Object>} Confirmation object { success, caseId, orderId, status, priority, slaDeadline, message }
   */
  async submitRefundRequest({ orderId, reason, description = '' }) {
    const cleanOrderId = (orderId || '').trim();
    if (!cleanOrderId) {
      throw new Error('Order ID is required.');
    }

    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      throw new Error('Refund reason is required.');
    }

    const payload = {
      orderId: cleanOrderId,
      reason: cleanReason,
      description: (description || '').trim(),
    };

    const data = await api.post('/refund-requests', payload);
    return data;
  },
};

export default refundRequestService;

