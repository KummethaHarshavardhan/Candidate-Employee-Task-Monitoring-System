import apiClient from '../api/apiClient';

export const reviewService = {
  getReviewQueue: async (params = {}) => {
    return await apiClient.get('/reviews/pending', { params });
  },

  getReviewById: async (id) => {
    return await apiClient.get(`/reviews/${id}`);
  },

  getAssignmentReviews: async (assignmentId) => {
    return await apiClient.get(`/reviews/assignment/${assignmentId}`);
  },

  approveSubmission: async (submissionId, comments) => {
    return await apiClient.post(`/reviews/${submissionId}/approve`, { comments });
  },

  reworkSubmission: async (submissionId, comments) => {
    return await apiClient.post(`/reviews/${submissionId}/rework`, { comments });
  },
};