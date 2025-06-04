import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
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

    // Response interceptor - handle token expiration
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

  // User registration
  async register(email, password) {
    try {
      const response = await this.api.post('/auth/register', {
        email,
        password,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // User login
  async login(email, password) {
    try {
      const response = await this.api.post('/auth/login', {
        email,
        password,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Verify token
  async verifyToken(token) {
    try {
      const response = await this.api.post('/auth/verify-token', {
        token,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await this.api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get current user information
  getCurrentUser() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Simple JWT token parsing (for getting basic info only, no signature verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch (error) {
        console.error('Failed to parse token:', error);
        return null;
      }
    }
    return null;
  }

  // Check if user is logged in
  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Check if user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  // Logout
  logout() {
    localStorage.removeItem('token');
  }
}

export default new AuthService(); 