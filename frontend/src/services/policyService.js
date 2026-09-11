import api from './api';

/**
 * Policy Service
 * Fetches company refund policy from AWS backend: GET /policy/refund
 */
export const policyService = {
  /**
   * Fetch live refund policy text
   * GET /policy/refund
   */
  async getRefundPolicy() {
    try {
      const response = await api.get('/policy/refund');
      // If response is text or object
      if (typeof response === 'string') {
        return response;
      }
      return response?.policy || response?.text || JSON.stringify(response);
    } catch (error) {
      console.warn(`[policyService.getRefundPolicy] ${error.message}`);
      return null;
    }
  },
};

export default policyService;
