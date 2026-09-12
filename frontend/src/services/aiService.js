/**
 * FitResQ AI Support Service
 * Connects to the deployed AWS AI Support backend.
 */

export const aiService = {
  async sendMessage(
    message,
    { orderId = null, caseId = null, history = null } = {}
  ) {
    const cleanMessage = (message || '').trim();

    if (!cleanMessage) {
      throw new Error('Message cannot be empty');
    }

    const payload = {
      message: cleanMessage,
      ...(orderId ? { orderId: orderId.trim() } : {}),
      ...(caseId ? { caseId: caseId.trim() } : {}),
      ...(history && Array.isArray(history) && history.length > 0
        ? { history }
        : {}),
    };

    const url = `${import.meta.env.VITE_AI_API_URL}/api/v1/ai/support`;

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

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = '';

      try {
        const errorData = await response.json();
        detail = errorData.detail || errorData.message || '';
      } catch {
        detail = await response.text();
      }

      throw new Error(detail || `HTTP ${response.status}`);
    }

    return await response.json();
  },
};

export default aiService;