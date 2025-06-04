import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : '/api';

class ApplicationService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - automatically add token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );    // Response interceptor - handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getApplication(applicationNumber) {
    try {
      const response = await this.api.get(`/applications/${applicationNumber}/latest`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getApplicationByTimestamp(applicationNumber, timestamp) {
    try {
      const response = await this.api.get(`/applications/${applicationNumber}/${timestamp}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new ApplicationService(); 