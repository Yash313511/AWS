import axios from 'axios';
import {
  UploadResponse,
  TransferInfoResponse,
  VerifyResponse,
  DownloadResponse,
  HealthStatus,
} from '../types';

const apiBase = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';

const apiClient = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export const apiService = {
  /**
   * Check backend and database health status
   */
  async checkHealth(): Promise<HealthStatus> {
    const response = await apiClient.get<HealthStatus>('/health');
    return response.data;
  },

  /**
   * Uploads a file with real-time progress callback
   */
  async uploadFile(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data;
  },

  /**
   * Fetches public metadata for a transfer code
   */
  async getTransfer(transferCode: string): Promise<TransferInfoResponse> {
    const response = await apiClient.get<TransferInfoResponse>(
      `/transfers/${encodeURIComponent(transferCode)}`
    );
    return response.data;
  },

  /**
   * Verifies PIN against transfer code
   */
  async verifyTransfer(transferCode: string, pin: string): Promise<VerifyResponse> {
    const response = await apiClient.post<VerifyResponse>('/transfers/verify', {
      transferCode,
      pin,
    });
    return response.data;
  },

  /**
   * Requests a short-lived S3 presigned download URL
   */
  async requestDownloadUrl(transferCode: string, pin: string): Promise<DownloadResponse> {
    const response = await apiClient.post<DownloadResponse>(
      `/transfers/${encodeURIComponent(transferCode)}/download`,
      { pin }
    );
    return response.data;
  },
};
