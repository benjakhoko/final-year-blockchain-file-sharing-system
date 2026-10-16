import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ai';

const aiService = {
  // Analyze a single file
  analyzeFile: async (fileId) => {
    const response = await axios.get(`${API_URL}/analyze/${fileId}`);
    return response.data;
  },

  // Analyze all user files
  analyzeAllFiles: async () => {
    const response = await axios.get(`${API_URL}/analyze-all`);
    return response.data;
  },

  // Get AI alerts for current user
  getMyAlerts: async () => {
    const response = await axios.get(`${API_URL}/alerts`);
    return response.data;
  },

  // Get AI statistics
  getAIStats: async () => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  },

  // Admin: Get all AI alerts
  getAllAlerts: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/admin/alerts?${params}`);
    return response.data;
  },

  // Admin: Resolve an alert
  resolveAlert: async (alertId, resolution) => {
    const response = await axios.put(`${API_URL}/admin/alerts/${alertId}/resolve`, {
      resolution
    });
    return response.data;
  },

  // Admin: Get all suspicious files
  getSuspiciousFiles: async () => {
    const response = await axios.get(`${API_URL}/admin/suspicious-files`);
    return response.data;
  },

  // Check ML service health
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        mlService: { status: 'unavailable', models_loaded: false } 
      };
    }
  }
};

export default aiService;