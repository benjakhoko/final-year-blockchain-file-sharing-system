import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const aiService = {
  // Analyze a single file
  analyzeFile: async (fileId) => {
    const response = await axios.get(`${API_URL}/ai/analyze/${fileId}`);
    return response.data;
  },

  // Analyze all user files
  analyzeAllFiles: async () => {
    const response = await axios.get(`${API_URL}/ai/analyze-all`);
    return response.data;
  },

  // Get AI alerts for current user
  getMyAlerts: async () => {
    const response = await axios.get(`${API_URL}/ai/alerts`);
    return response.data;
  },

  // Get AI statistics
  getAIStats: async () => {
    const response = await axios.get(`${API_URL}/ai/stats`);
    return response.data;
  },

  // Admin: Get all AI alerts
  getAllAlerts: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/ai/admin/alerts?${params}`);
    return response.data;
  },

  // Admin: Resolve an alert
  resolveAlert: async (alertId, resolution) => {
    const response = await axios.put(`${API_URL}/ai/admin/alerts/${alertId}/resolve`, {
      resolution
    });
    return response.data;
  },

  // Admin: Get all suspicious files
  getSuspiciousFiles: async () => {
    const response = await axios.get(`${API_URL}/ai/admin/suspicious-files`);
    return response.data;
  },

  // Check ML service health
  checkHealth: async () => {
    const response = await axios.get(`${API_URL}/ai/health`);
    return response.data;
  }
};

export default aiService;