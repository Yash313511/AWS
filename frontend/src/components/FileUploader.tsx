import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, X, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  isUploading: boolean;
  maxSizeMb?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  selectedFile,
  onFileSelect,
  isUploading,
  maxSizeMb = 100,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrorMessage(`File exceeds the maximum limit of ${maxSizeMb}MB (${formatFileSize(file.size)}).`);
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file is empty (0 Bytes).');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setErrorMessage(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        id="file-input"
        disabled={isUploading}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
              : 'border-border hover:border-slate-500 bg-surface hover:bg-surface-secondary/60'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          id="dropzone-area"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface-secondary border border-border text-blue-400'
              }`}
            >
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-200">
                {isDragging ? 'Drop file to upload' : 'Drop file here, or click to browse'}
              </p>
              <p className="text-xs text-slate-400">
                Any file type up to <span className="font-semibold text-slate-300">{maxSizeMb}MB</span>
              </p>
            </div>

            <button
              type="button"
              className="mt-2 px-4 py-2 text-xs font-medium text-slate-200 bg-surface-secondary border border-border rounded-lg hover:bg-slate-800 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select from device
            </button>
          </div>
        </div>
      ) : (
        /* Selected File Display Card */
        <div
          className="border border-border bg-surface rounded-xl p-5 flex items-center justify-between gap-4 transition-all"
          id="selected-file-card"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <FileIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>•</span>
                <span className="truncate max-w-[150px] sm:max-w-[220px]">
                  {selectedFile.type || 'Unknown type'}
                </span>
              </div>
            </div>
          </div>

          {!isUploading && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-surface-secondary rounded-lg transition-colors shrink-0"
              aria-label="Remove file"
              id="remove-file-btn"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-3 rounded-lg"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
