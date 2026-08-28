import apiClient from '../api/apiClient';

export const progressService = {
  getProgressOverview: async () => {
    return await apiClient.get('/progress');
  },

  getCandidateProgress: async () => {
    return await apiClient.get('/progress/candidates');
  },

  getTeamProgress: async () => {
    return await apiClient.get('/progress/teams');
  },

  updateTaskProgress: async (assignmentId, data) => {
    return await apiClient.put(`/progress/${assignmentId}`, data);
  },
};