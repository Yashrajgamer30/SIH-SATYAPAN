import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, AlertTriangle } from 'lucide-react';

export interface FileDropzoneProps {
  label?: string;
  helperText?: string;
  maxSizeMB?: number;
  accept?: string;
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  label = "Upload Regulatory Document",
  helperText = "Accepted formats: PDF, JPG, PNG up to 10MB (Digitally signed PDFs preferred)",
  maxSizeMB = 10,
  accept = ".pdf,.jpg,.jpeg,.png",
  onFileSelect,
  disabled = false,
  className = ""
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum allowed size of ${maxSizeMB}MB.`);
      setSelectedFile(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-12 font-semibold text-gov-text mb-1">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 outline-none
          ${isDragOver 
            ? 'border-saffron-500 bg-saffron-50' 
            : 'border-gov-border bg-gov-surface hover:border-navy-500 hover:bg-gov-subtle'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gov-subtle' : ''}
          focus-visible:ring-2 focus-visible:ring-saffron-500
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          aria-label={label}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between p-3 bg-navy-50 border border-navy-500/30 rounded text-left">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="w-8 h-8 text-navy-700 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="text-14 font-bold text-navy-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-12 text-gov-muted tabular-nums">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR Scrutiny
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 hover:bg-white rounded-full text-gov-muted hover:text-danger transition-colors cursor-pointer"
              title="Remove file"
              aria-label="Remove uploaded file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-navy-50 flex items-center justify-center text-navy-700">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-14 font-semibold text-gov-text">
                <span className="text-navy-700 underline font-bold">Click to browse</span> or drag & drop document
              </p>
              <p className="text-12 text-gov-muted mt-1">
                {helperText}
              </p>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="mt-1.5 text-12 font-medium text-danger flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};
