import apiClient from '../api/apiClient';

export const userService = {
  getUsers: async (params = {}) => {
    return await apiClient.get('/users', { params });
  },

  createUser: async (userData) => {
    return await apiClient.post('/users', userData);
  },

  updateUser: async (id, userData) => {
    return await apiClient.put(`/users/${id}`, userData);
  },

  deleteUser: async (id) => {
    return await apiClient.delete(`/users/${id}`);
  },
};
