/**
 * FitResQ AI Support Service
 * Sends customer support inquiries to the local Python Support Agent
 * via POST /api/v1/ai/support (proxied by Vite or direct localhost:8000).
 */

export const aiService = {
  /**
   * Send a support inquiry to the FitResQ Support Agent.
   * @param {string} message - Customer inquiry text
   * @param {Object} options - Optional orderId and caseId
   * @returns {Promise<Object>} Agent response object
   */
  async sendMessage(message, { orderId = null, caseId = null, history = null } = {}) {
    const cleanMessage = (message || '').trim();
    if (!cleanMessage) {
      throw new Error('Message cannot be empty');
    }

    const payload = {
      message: cleanMessage,
      ...(orderId ? { orderId: orderId.trim() } : {}),
      ...(caseId ? { caseId: caseId.trim() } : {}),
      ...(history && Array.isArray(history) && history.length > 0 ? { history } : {}),
    };

    // Attempt relative proxy endpoint first, then direct server port 8000
    const endpoints = [
      '/api/v1/ai/support',
      'http://127.0.0.1:8000/api/v1/ai/support',
      'http://localhost:8000/api/v1/ai/support',
    ];

    const idToken =
      localStorage.getItem('fitresq_id_token') ||
      sessionStorage.getItem('fitresq_id_token');
    const token =
      idToken ||
      localStorage.getItem('fitresq_token') ||
      localStorage.getItem('fitresq_access_token');

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          return data;
        }

        let errDetail = '';
        try {
          const errJson = await response.json();
          errDetail = errJson.detail || errJson.message || '';
        } catch {
          errDetail = await response.text();
        }

        throw new Error(errDetail || `HTTP ${response.status}`);
      } catch (err) {
        lastError = err;
        // Try next candidate URL
      }
    }

    throw lastError || new Error('Could not connect to AI Support agent service');
  },
};

export default aiService;
