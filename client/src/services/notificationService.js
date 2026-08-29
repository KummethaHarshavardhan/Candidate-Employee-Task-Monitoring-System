import apiClient from '../api/apiClient';

export const notificationService = {
  getNotifications: async () => apiClient.get('/notifications'),
  markRead: async (id) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: async () => apiClient.put('/notifications/read-all'),
};
