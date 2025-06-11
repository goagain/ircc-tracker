import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import tokenService from './tokenService';

const API_BASE_URL = '/api';

class ApiService {
  private api: AxiosInstance;

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
        console.log('Request interceptor - before token check');
        const token = tokenService.getToken();
        console.log('Token in interceptor:', token);
        
        if (token) {
          // ensure headers object exists
          config.headers = config.headers || new AxiosHeaders();
          // add Authorization header
          config.headers['Authorization'] = `Bearer ${token}`;
          console.log('Final request headers:', config.headers);
          console.log('Request config:', {
            baseURL: config.baseURL,
            url: config.url,
            method: config.method,
            headers: config.headers
          });
        } else {
          console.warn('No token found in request interceptor');
        }

        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Response error:', error);
        if (error.response?.status === 401) {
          console.log('Unauthorized response - removing token');
          // tokenService.removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  // POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  // PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }
}

export default new ApiService(); 