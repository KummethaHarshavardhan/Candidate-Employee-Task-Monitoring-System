import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for unified response handling & 401 handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors ||
      error.message ||
      'An unexpected error occurred';

    if (error.response?.status === 401) {
      // Clear token on 401 if unauthorized
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // Let AuthContext handle redirect or state change
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
