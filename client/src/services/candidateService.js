import apiClient from '../api/apiClient';

export const candidateService = {
  getCandidates: async (params = {}) => {
    return await apiClient.get('/candidates', { params });
  },

  getCandidateById: async (id) => {
    return await apiClient.get(`/candidates/${id}`);
  },

  createCandidate: async (candidateData) => {
    return await apiClient.post('/candidates', candidateData);
  },

  updateCandidate: async (id, candidateData) => {
    return await apiClient.put(`/candidates/${id}`, candidateData);
  },

  deleteCandidate: async (id) => {
    return await apiClient.delete(`/candidates/${id}`);
  },

  getFiltersMeta: async () => {
    return await apiClient.get('/candidates/meta/filters');
  },
};