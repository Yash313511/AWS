import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  id: string;
  original_filename: string;
  s3_key: string;
  gridfs_id: string; // MongoDB ObjectId hex string for GridFS lookup
  file_size: number;
  content_type: string;
  download_count: number;
  status: 'active' | 'deleted' | 'expired';
  created_at: Date;
}

const fileSchema = new Schema<IFile>(
  {
    id: { type: String, required: true, unique: true, index: true },
    original_filename: { type: String, required: true },
    s3_key: { type: String, required: true, unique: true, index: true },
    gridfs_id: { type: String, required: true, index: true },
    file_size: { type: Number, required: true },
    content_type: { type: String, required: true, default: 'application/octet-stream' },
    download_count: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'deleted', 'expired'], default: 'active', index: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const FileModel = mongoose.model<IFile>('File', fileSchema);
