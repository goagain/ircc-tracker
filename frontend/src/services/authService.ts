import axios, { AxiosResponse } from 'axios';
import { User, UserRole } from '../types/user';

const API_BASE_URL = '/api';

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
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  }

  async register(email: string, password: string): Promise<RegisterResponse> {
    const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, {
      email,
      password
    });
    return response.data;
  }

  async verifyToken(token: string): Promise<AxiosResponse<VerifyTokenResponse>> {
    return axios.post('/api/auth/verify-token', { token });
  }

  async getAdminStats(): Promise<AxiosResponse<any>> {
    return axios.get('/api/admin/dashboard', {
      headers: this.getAuthHeader()
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>(
      `${API_BASE_URL}/auth/change-password`,
      {
        currentPassword,
        newPassword
      },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  // Get current user information
  getCurrentUser(): User | null {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
    localStorage.removeItem('token');
  }
}

const authService = new AuthService();
export default authService; 