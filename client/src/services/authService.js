import apiClient from '../api/apiClient';

export const authService = {
  register: async (userData) => {
    return await apiClient.post('/auth/register', userData);
  },

  login: async (email, password) => {
    return await apiClient.post('/auth/login', { email, password });
  },

  getMe: async () => {
    return await apiClient.get('/auth/me');
  },

  updateMe: async (profileData) => {
    return await apiClient.put('/auth/me', profileData);
  },

  logout: async () => {
    return await apiClient.post('/auth/logout');
  },
};
