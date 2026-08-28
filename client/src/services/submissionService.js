import apiClient from '../api/apiClient';

export const submissionService = {
  getSubmissions: async (params = {}) => {
    return await apiClient.get('/submissions', { params });
  },

  getSubmissionById: async (id) => {
    return await apiClient.get(`/submissions/${id}`);
  },

  createSubmission: async (submissionData) => {
    return await apiClient.post('/submissions', submissionData);
  },
};