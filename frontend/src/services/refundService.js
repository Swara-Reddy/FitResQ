import api from './api';

/**
 * Refund Service
 * Handles refund inquiries, timeline tracking, and settlement queries
 * via AWS API Gateway `GET /refunds/{orderId}`.
 */
export const refundService = {
  /**
   * Fetch refund for a specific order ID
   * GET /refunds/{orderId}
   */
  async getRefundByOrderId(orderId) {
    if (!orderId) return null;
    try {
      const response = await api.get(`/refunds/${orderId}`);
      return response?.refund || response || null;
    } catch (error) {
      console.warn(`[refundService.getRefundByOrderId] Order ${orderId}: ${error.message}`);
      return null;
    }
  },

  /**
   * Fetch refunds for a list of order IDs in parallel with error tolerance
   */
  async getRefundsForOrders(orderIds = []) {
    if (!Array.isArray(orderIds) || orderIds.length === 0) return [];
    
    // Deduplicate order IDs
    const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];
    const results = await Promise.allSettled(
      uniqueOrderIds.map((orderId) => this.getRefundByOrderId(orderId))
    );

    return results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);
  },
};

export default refundService;
