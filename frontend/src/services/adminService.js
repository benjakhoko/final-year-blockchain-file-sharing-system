import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

const adminService = {
  // User Management
  getUsers: async (page = 1, limit = 10) => {
    const response = await axios.get(`${API_URL}/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserDetails: async (userId) => {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await axios.put(`${API_URL}/users/${userId}/status`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axios.delete(`${API_URL}/users/${userId}`);
    return response.data;
  },

  // File Management
  getAllFiles: async (page = 1, limit = 10) => {
    const response = await axios.get(`${API_URL}/files?page=${page}&limit=${limit}`);
    return response.data;
  },

  getTamperedFiles: async () => {
    const response = await axios.get(`${API_URL}/files/tampered`);
    return response.data;
  },

  getFileDetails: async (fileId) => {
    const response = await axios.get(`${API_URL}/files/${fileId}`);
    return response.data;
  },

  deleteFile: async (fileId) => {
    const response = await axios.delete(`${API_URL}/files/${fileId}`);
    return response.data;
  },

  // System Monitoring
  getSystemLogs: async (page = 1, limit = 20) => {
    const response = await axios.get(`${API_URL}/logs?page=${page}&limit=${limit}`);
    return response.data;
  },

  getActivityLogs: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/logs/activity?${params}`);
    return response.data;
  },

  getSystemStats: async () => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  },

  // Feedback Management
  getFeedback: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/feedback?${params}`);
    return response.data;
  },

  respondToFeedback: async (feedbackId, message) => {
    const response = await axios.put(`${API_URL}/feedback/${feedbackId}/respond`, { message });
    return response.data;
  },

  deleteFeedback: async (feedbackId) => {
    const response = await axios.delete(`${API_URL}/feedback/${feedbackId}`);
    return response.data;
  }
};

export default adminService;