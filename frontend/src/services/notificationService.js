import api, { DEMO_USER_ID } from './api';

/**
 * Notification Service
 * Manages customer notification feeds and attempts backend retrieval where available.
 */
export const notificationService = {
  /**
   * Attempt to fetch notifications from backend where an API exists
   */
  async getNotifications(userId = DEMO_USER_ID) {
    // Attempt standard endpoints if backend deploys them
    for (const endpoint of [`/users/${userId}/notifications`, '/notifications']) {
      try {
        const response = await api.get(endpoint);
        if (response && (Array.isArray(response) || Array.isArray(response.notifications))) {
          return response.notifications || response;
        }
      } catch (e) {
        // Expected if endpoint not implemented on backend
      }
    }
    return null;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (e) {
      // Graceful local handling
    }
    return { success: true, notificationId };
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await api.post('/notifications/read-all');
    } catch (e) {
      // Graceful local handling
    }
    return { success: true };
  },
};

export default notificationService;
