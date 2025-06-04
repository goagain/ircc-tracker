import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api'
  : '/api';

class CredentialService {
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
    );

    // Response interceptor - handle errors
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

  // Upload IRCC credentials
  async uploadCredential(irccUsername, irccPassword, notificationEmail, applicationType) {
    try {
      const response = await this.api.post('/credentials/', {
        ircc_username: irccUsername,
        ircc_password: irccPassword,
        notification_email: notificationEmail,
        application_type: applicationType
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update IRCC credentials
  async updateCredential(credentialId, irccPassword, notificationEmail) {
    try {
      const response = await this.api.put(`/credentials/${credentialId}`, {
        ircc_password: irccPassword,
        notification_email: notificationEmail
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get current user's credentials list
  async getMyCredentials() {
    try {
      const response = await this.api.get('/credentials/my-credentials');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete credentials
  async deleteCredential(irccUsername) {
    try {
      const response = await this.api.delete('/credentials/delete', {
        data: {
          ircc_username: irccUsername,
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Admin get all credentials
  async getAllCredentials() {
    try {
      const response = await this.api.get('/credentials/all');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Test encryption functionality
  async testEncryption(testText) {
    try {
      const response = await this.api.post('/credentials/test-encryption', {
        test_text: testText,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get a single credential
  async getCredential(credentialId) {
    try {
      const response = await this.api.get(`/credentials/${credentialId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Trigger immediate status check
  async triggerCheckAll() {
    try {
      const response = await this.api.post('/admin/check-all');
      return response;
    } catch (error) {
      throw error;
    }
  }
  async sendTestEmail() {
    try {
      const response = await this.api.post('/admin/test-email');
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Test email sending

export default new CredentialService(); 