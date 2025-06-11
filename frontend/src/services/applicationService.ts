import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Activity, ActivityStatus } from '../types/application';
import tokenService from './tokenService';

const API_BASE_URL = '/api';

interface HistoryRecord {
  time: number;
  isNew: boolean;
  isWaiting: boolean;
  type: string;
  title: {
    en?: string;
    fr?: string;
  };
  text: {
    en?: string;
    fr?: string;
  };
  activity?: string;
}

interface ApplicationDetails {
  uci: string;
  status: ActivityStatus;
  activities: Activity[];
  history: HistoryRecord[];
}

interface ApplicationListResponse {
  applications: ApplicationDetails[];
}

interface ApplicationResponse {
  data: ApplicationDetails;
}

class ApplicationService {
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
        const token = tokenService.getToken();
        if (token) {
          config.headers = config.headers || {};
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
          tokenService.removeToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getApplication(applicationNumber: string): Promise<AxiosResponse<ApplicationResponse>> {
    try {
      const response = await this.api.get<ApplicationResponse>(`/applications/${applicationNumber}/latest`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getApplicationByTimestamp(applicationNumber: string, timestamp: string): Promise<AxiosResponse<ApplicationResponse>> {
    try {
      const response = await this.api.get<ApplicationResponse>(`/applications/${applicationNumber}/${timestamp}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllApplications(): Promise<AxiosResponse<ApplicationListResponse>> {
    try {
      const response = await this.api.get<ApplicationListResponse>('/applications');
      return response;
    } catch (error) {
      throw error;
    }
  }
}

const applicationService = new ApplicationService();
export default applicationService; 