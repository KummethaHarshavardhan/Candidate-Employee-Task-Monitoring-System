import apiClient from '../api/apiClient';

export const assignmentService = {
  getAssignments: async (params = {}) => {
    return await apiClient.get('/assignments', { params });
  },

  getAssignmentById: async (id) => {
    return await apiClient.get(`/assignments/${id}`);
  },

  createAssignment: async (assignmentData) => {
    return await apiClient.post('/assignments', assignmentData);
  },

  updateAssignment: async (id, assignmentData) => {
    return await apiClient.put(`/assignments/${id}`, assignmentData);
  },

  reassignAssignment: async (id, reassignData) => {
    return await apiClient.put(`/assignments/${id}/reassign`, reassignData);
  },
};