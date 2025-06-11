import { AxiosResponse } from 'axios';
import api from './api';

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

class CredentialService {
  async getMyCredentials(): Promise<CredentialResponse> {
    const response = await api.get<CredentialResponse>('/credentials/my-credentials');
    return response.data;
  }

  async getCredential(credentialId: string): Promise<Credential> {
    const response = await api.get<Credential>(`/credentials/${credentialId}`);
    return response.data;
  }

  async getAllCredentials(): Promise<CredentialResponse> {
    const response = await api.get<CredentialResponse>('/credentials/all');
    return response.data;
  }

  async deleteCredential(irccUsername: string): Promise<void> {
    await api.delete(`/credentials/${irccUsername}`);
  }

  async updateCredential(credentialId: string, data: Partial<Credential>): Promise<Credential> {
    const response = await api.put<Credential>(`/credentials/${credentialId}`, data);
    return response.data;
  }

  async createCredential(data: CreateCredentialData): Promise<Credential> {
    const response = await api.post<Credential>('/credentials/', data);
    return response.data;
  }
}

export default new CredentialService(); 