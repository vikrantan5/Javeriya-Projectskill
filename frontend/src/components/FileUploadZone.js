import React, { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const FileUploadZone = ({ onFilesSelected, maxFiles = 5, existingFiles = [] }) => {
  const [files, setFiles] = useState(existingFiles);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: `${file.name}: File size exceeds 10MB limit` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `${file.name}: Invalid file type. Only PDF, DOC, DOCX, ZIP allowed` };
    }

    return { valid: true };
  };

  const handleFiles = (newFiles) => {
    setError('');
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files
    const validationErrors = [];
    const validFiles = [];

    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        validationErrors.push(validation.error);
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.zip"
        onChange={handleChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {dragActive ? (
            <span className="text-indigo-600 font-medium">Drop files here...</span>
          ) : (
            <>
              Drag and drop files here, or{' '}
              <button
                type="button"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                browse
              </button>
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          PDF, DOC, DOCX, ZIP (Max 10MB each, up to {maxFiles} files)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-sm text-blue-600 dark:text-blue-400">Uploading files...</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
