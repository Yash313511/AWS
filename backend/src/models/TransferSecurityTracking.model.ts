import mongoose, { Document, Schema } from 'mongoose';

export interface ITransferSecurityTracking extends Document {
  transfer_code: string;
  failed_attempts: number;
  last_attempt_at: Date;
  locked_until: Date | null;
}

const transferSecurityTrackingSchema = new Schema<ITransferSecurityTracking>(
  {
    transfer_code: { type: String, required: true, unique: true, uppercase: true, index: true },
    failed_attempts: { type: Number, default: 1 },
    last_attempt_at: { type: Date, default: Date.now },
    locked_until: { type: Date, default: null },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const TransferSecurityTrackingModel = mongoose.model<ITransferSecurityTracking>(
  'TransferSecurityTracking',
  transferSecurityTrackingSchema
);
