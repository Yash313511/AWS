export type CloudWatchEvent =
  | 'UPLOAD_SUCCESS'
  | 'UPLOAD_FAILURE'
  | 'TRANSFER_CREATED'
  | 'TRANSFER_VERIFICATION_FAILED'
  | 'DOWNLOAD_REQUESTED'
  | 'DOWNLOAD_SUCCESS'
  | 'DOWNLOAD_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SECURITY_ALERT'
  | 'GRIDFS_UPLOAD'
  | 'GRIDFS_DELETE'
  | 'GRIDFS_DELETE_ERROR';

interface LogPayload {
  event: CloudWatchEvent;
  transferCode?: string;
  fileId?: string;
  gridfsId?: string;
  s3Key?: string;
  contentType?: string;
  fileSize?: number;
  ipHash?: string;
  durationMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export const logger = {
  info: (event: CloudWatchEvent, data?: Omit<LogPayload, 'event'>) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event,
      ...data,
    };
    console.log(JSON.stringify(entry));
  },
  warn: (event: CloudWatchEvent, data?: Omit<LogPayload, 'event'>) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      event,
      ...data,
    };
    console.warn(JSON.stringify(entry));
  },
  error: (event: CloudWatchEvent, data?: Omit<LogPayload, 'event'> & { error?: string }) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      event,
      ...data,
    };
    console.error(JSON.stringify(entry));
  },
};
