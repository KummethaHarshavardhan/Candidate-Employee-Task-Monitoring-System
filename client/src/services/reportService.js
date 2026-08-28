import apiClient from '../api/apiClient';

export const reportService = {
  getOverview: async () => {
    return await apiClient.get('/reports/overview');
  },

  getCandidateReports: async (params = {}) => {
    return await apiClient.get('/reports/candidates', { params });
  },

  getTeamReports: async (params = {}) => {
    return await apiClient.get('/reports/teams', { params });
  },

  getTaskReports: async (params = {}) => {
    return await apiClient.get('/reports/tasks', { params });
  },
};