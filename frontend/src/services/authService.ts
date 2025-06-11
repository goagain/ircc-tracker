import { AxiosResponse } from 'axios';
import { User, UserRole } from '../types/user';
import tokenService from './tokenService';
import api from './api';

interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

interface RegisterResponse {
  message: string;
}

interface VerifyTokenResponse {
  valid: boolean;
  user: User;
  message: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password
    });
    
    if (response.data.token) {
      tokenService.setToken(response.data.token);
    }
    
    return response.data;
  }

  async register(email: string, password: string): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', {
      email,
      password
    });
    return response.data;
  }

  async verifyToken(token: string): Promise<AxiosResponse<VerifyTokenResponse>> {
    return api.post<VerifyTokenResponse>('/auth/verify-token', { token });
  }

  async getAdminStats(): Promise<AxiosResponse<any>> {
    return api.get('/admin/dashboard');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  // Get current user information
  getCurrentUser(): User | null {
    const token = tokenService.getToken();
    if (token) {
      try {
        // Simple JWT token parsing (for getting basic info only, no signature verification)
        const payload = JSON.parse(atob(token.split('.')[1])) as User;
        return payload;
      } catch (error) {
        console.error('Failed to parse token:', error);
        return null;
      }
    }
    return null;
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    const token = tokenService.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as User;
      const currentTime = Date.now() / 1000;
      return payload.exp ? payload.exp > currentTime : false;
    } catch (error) {
      return false;
    }
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === 'admin' : false;
  }

  // Logout
  logout(): void {
    tokenService.removeToken();
  }
}

const authService = new AuthService();
export default authService; 