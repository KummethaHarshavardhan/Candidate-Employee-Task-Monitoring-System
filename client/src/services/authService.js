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

  forgotPassword: async (email) => {
    return await apiClient.post('/auth/forgot-password', { email });
  },

  verifyOTP: async (email, otp) => {
    return await apiClient.post('/auth/verify-otp', { email, otp });
  },

  resetPassword: async (email, password, resetAuthToken) => {
    return await apiClient.post('/auth/reset-password', { email, password, resetAuthToken });
  },

  logout: async () => {
    return await apiClient.post('/auth/logout');
  },
};

