import axios from 'axios';

// Resolve API base URL from environment or default to backend port 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = new Error(
      error.response?.data?.message || error.message || 'API request failed'
    );
    customError.statusCode = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export const api = {
  // Competitors
  competitors: {
    getAll: (params) => apiClient.get('/competitors', { params }),
    getById: (id) => apiClient.get(`/competitors/${id}`),
  },

  // Changes
  changes: {
    getAll: (params) => apiClient.get('/changes', { params }),
    getById: (id) => apiClient.get(`/changes/${id}`),
  },

  // AI Insights
  insights: {
    getAll: (params) => apiClient.get('/insights', { params }),
    getByChangeId: (changeId) => apiClient.get(`/insights/${changeId}`),
    generate: (changeId) => apiClient.post(`/analysis/changes/${changeId}`),
  },

  // Pricing
  pricing: {
    getAll: (params) => apiClient.get('/pricing', { params }),
    getByCompetitorId: (competitorId) => apiClient.get(`/pricing/${competitorId}`),
  },

  // Weekly Reports
  reports: {
    getAll: (params) => apiClient.get('/reports', { params }),
    getById: (id) => apiClient.get(`/reports/${id}`),
  },

  // System Health
  health: {
    check: () => apiClient.get('/health'),
  },
};

export default apiClient;
