const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

class MLService {
  constructor() {
    this.client = axios.create({
      baseURL: ML_API_URL,
      timeout: 3000
    });
  }
  
  async checkHealth() {
    try {
        const response = await this.client.get('/health');
        return response.data;
    } catch (error) {
        return { status: 'unavailable', models_loaded: false };
    }
}
  async classifyFile(fileStats) {
    try {
      const response = await this.client.post('/classify-file', fileStats);
      return response.data;
    } catch (error) {
      console.error('ML classify-file error:', error.message);
      return { malicious: 0, probability: 0, error: true };
    }
  }

  async detectAbnormalSharing(sharingStats) {
    try {
      const response = await this.client.post('/detect-abnormal-sharing', sharingStats);
      return response.data;
    } catch (error) {
      console.error('ML detect-abnormal-sharing error:', error.message);
      return { abnormal: 0, risk: 'low', error: true };
    }
  }
}

module.exports = new MLService();