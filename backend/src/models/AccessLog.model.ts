import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessLog extends Document {
  id: string;
  transfer_id: string;
  action: 'VERIFY_SUCCESS' | 'VERIFY_FAILED' | 'DOWNLOAD_PRESIGNED_ISSUED' | 'DOWNLOAD_TOKEN_ISSUED';
  ip_hash: string;
  user_agent: string;
  created_at: Date;
}

const accessLogSchema = new Schema<IAccessLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    transfer_id: { type: String, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: ['VERIFY_SUCCESS', 'VERIFY_FAILED', 'DOWNLOAD_PRESIGNED_ISSUED', 'DOWNLOAD_TOKEN_ISSUED'],
    },
    ip_hash: { type: String, required: true },
    user_agent: { type: String, required: true, default: '' },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const AccessLogModel = mongoose.model<IAccessLog>('AccessLog', accessLogSchema);
