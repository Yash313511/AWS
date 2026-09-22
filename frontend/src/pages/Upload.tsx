import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowUpRight, Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import { ProgressBar } from '../components/ProgressBar';
import { apiService } from '../services/api';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const response = await apiService.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });

      if (response.success) {
        // Navigate to success screen with transfer credentials
        navigate('/success', {
          state: {
            transferCode: response.transferCode,
            pin: response.pin,
            fileName: response.file.name,
            fileSize: response.file.size,
          },
        });
      } else {
        setErrorMessage(response.error || 'Failed to upload file. Please try again.');
        setIsUploading(false);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const message =
        err.response?.data?.error ||
        (err.message === 'Network Error'
          ? 'Unable to connect to server. Check your network connection and verify the backend is running.'
          : 'An unexpected error occurred during upload. Please try again.');
      setErrorMessage(message);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto px-4 py-8 sm:py-12 w-full">
      {/* Back button & header */}
      <div className="mb-6 space-y-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Upload a File
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Select a file to securely transmit. You will receive a transfer code and PIN to download it on your other device.
        </p>
      </div>

      <div className="space-y-6">
        {/* File Dropzone & Selector */}
        <FileUploader
          selectedFile={file}
          onFileSelect={setFile}
          isUploading={isUploading}
          maxSizeMb={25}
        />

        {/* Real-time Upload Progress */}
        {isUploading && file && (
          <ProgressBar progress={uploadProgress} fileName={file.name} />
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs sm:text-sm"
            role="alert"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-rose-200">Upload failed</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {file && !isUploading && (
          <button
            type="button"
            onClick={handleUpload}
            id="start-upload-btn"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Upload Securely</span>
          </button>
        )}

        {/* Trust Badges */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Storage</span>
          </div>
          <span>MongoDB Atlas ACL</span>
          <span>Bcrypt PIN Salted</span>
        </div>
      </div>
    </div>
  );
};
