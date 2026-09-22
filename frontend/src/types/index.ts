export interface FileMetadata {
  name: string;
  size: number;
  contentType?: string;
  createdAt?: string;
  downloadCount?: number;
}

export interface UploadResponse {
  success: boolean;
  transferCode: string;
  pin: string;
  file: {
    name: string;
    size: number;
  };
  error?: string;
}

export interface TransferInfoResponse {
  success: boolean;
  transfer: {
    transferCode: string;
    file: FileMetadata;
    status: string;
  };
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  file?: {
    name: string;
    size: number;
    contentType: string;
  };
  error?: string;
}

export interface DownloadResponse {
  success: boolean;
  downloadUrl?: string;
  expiresInSeconds?: number;
  error?: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  database: string;
  timestamp: string;
}
