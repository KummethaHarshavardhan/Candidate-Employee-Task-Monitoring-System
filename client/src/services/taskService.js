import apiClient from '../api/apiClient';

export const taskService = {
  getTasks: async (params = {}) => {
    return await apiClient.get('/tasks', { params });
  },

  getTaskById: async (id) => {
    return await apiClient.get(`/tasks/${id}`);
  },

  createTask: async (taskData) => {
    return await apiClient.post('/tasks', taskData);
  },

  updateTask: async (id, taskData) => {
    return await apiClient.put(`/tasks/${id}`, taskData);
  },

  deleteTask: async (id) => {
    return await apiClient.delete(`/tasks/${id}`);
  },
};