import mongoose, { Document, Schema } from 'mongoose';

export interface ITransfer extends Document {
  id: string;
  file_id: string;
  transfer_code: string;
  pin_hash: string;
  download_count: number;
  status: 'active' | 'deleted';
  created_at: Date;
  last_accessed_at: Date | null;
}

const transferSchema = new Schema<ITransfer>(
  {
    id: { type: String, required: true, unique: true, index: true },
    file_id: { type: String, required: true, index: true },
    transfer_code: { type: String, required: true, unique: true, uppercase: true, index: true },
    pin_hash: { type: String, required: true },
    download_count: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'deleted'], default: 'active', index: true },
    created_at: { type: Date, default: Date.now },
    last_accessed_at: { type: Date, default: null },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const TransferModel = mongoose.model<ITransfer>('Transfer', transferSchema);
