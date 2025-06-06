import axios from 'axios';

export interface Credential {
  id: string;
  user_id: string;
  ircc_username: string;
  email: string;
  is_active: boolean;
  last_status: string;
  last_checked: string;
  last_timestamp: string;
  application_number: string;
  application_type: string;
}

export interface CredentialResponse {
  credentials: Credential[];
  total: number;
}

export interface CreateCredentialData {
  ircc_username: string;
  ircc_password: string;
  email: string;
  is_active: boolean;
  application_type: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

const API_BASE_URL = '/api';

class CredentialService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getMyCredentials(): Promise<CredentialResponse> {
    const response = await axios.get(`${API_BASE_URL}/credentials/my-credentials`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async getCredential(credentialId: string): Promise<Credential> {
    const response = await axios.get(`${API_BASE_URL}/credentials/${credentialId}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async addCredential(irccUsername: string, email: string): Promise<Credential> {
    const response = await axios.post(
      `${API_BASE_URL}/credentials`,
      { ircc_username: irccUsername, email },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async deleteCredential(irccUsername: string): Promise<void> {
    const response = await axios.delete(`${API_BASE_URL}/credentials/${irccUsername}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async updateCredential(credentialId: string, data: Partial<Credential>): Promise<Credential> {
    const response = await axios.put(
      `${API_BASE_URL}/credentials/${credentialId}`,
      data,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async createCredential(data: CreateCredentialData): Promise<Credential> {
    const response = await axios.post('/api/credentials', data);
    return response.data;
  }
}

export default new CredentialService(); 