import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const fileService = {
  // Upload file
  uploadFile: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/upload`, formData, {
      onUploadProgress,
    });
    return response.data;
  },

  // Get all files
  getFiles: async () => {
    const response = await axios.get(`${API_URL}/files`);
    return response.data;
  },

  // Get shared files
  getSharedFiles: async () => {
    const response = await axios.get(`${API_URL}/users/shared-files`);
    return response.data;
  },

  // Get file details
  getFileDetails: async (fileId) => {
    const response = await axios.get(`${API_URL}/files/${fileId}`);
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await axios.delete(`${API_URL}/files/${fileId}`);
    return response.data;
  },

  // Share file
  shareFile: async (fileId, email, accessType = 'view') => {
    const response = await axios.post(`${API_URL}/files/${fileId}/share`, {
      email,
      accessType,
    });
    return response.data;
  },

  // Revoke access
  revokeAccess: async (fileId, userId) => {
    const response = await axios.post(`${API_URL}/files/${fileId}/revoke/${userId}`);
    return response.data;
  },

  // Verify file integrity
  verifyFile: async (fileId) => {
    const response = await axios.get(`${API_URL}/files/${fileId}/verify`);
    return response.data;
  },

  // Download file
  downloadFile: async (fileId) => {
    const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get user stats
  getUserStats: async () => {
    const response = await axios.get(`${API_URL}/users/stats`);
    return response.data;
  },

  // Get user activity logs
  getUserActivityLogs: async (page = 1, limit = 5) => {
    const response = await axios.get(`${API_URL}/users/activity-logs`, {
      params: { page, limit },
    });
    return response.data;
  }
};

export default fileService;
