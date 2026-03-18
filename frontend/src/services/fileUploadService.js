import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (we'll use environment variables or fetch from backend)
let supabaseClient = null;

const initializeSupabase = async () => {
  if (supabaseClient) return supabaseClient;
  
  try {
    // Fetch Supabase config from backend
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    const response = await fetch(`${backendUrl}/api/storage/config`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch storage config');
    }
    
    const config = await response.json();
    supabaseClient = createClient(config.url, config.key);
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    throw error;
  }
};

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - The bucket name (default: 'task-attachments')
 * @param {string} folder - Optional folder path
 * @returns {Promise<Object>} - Returns object with url and path
 */
export const uploadFile = async (file, bucket = 'task-attachments', folder = '') => {
  try {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed. Only PDF, DOC, DOCX, and ZIP files are accepted');
    }

    const supabase = await initializeSupabase();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files
 * @param {FileList|Array<File>} files - Files to upload
 * @param {string} bucket - The bucket name
 * @param {string} folder - Optional folder path
 * @returns {Promise<Array>} - Returns array of upload results
 */
export const uploadMultipleFiles = async (files, bucket = 'task-attachments', folder = '') => {
  try {
    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => uploadFile(file, bucket, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple file upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The file path in storage
 * @param {string} bucket - The bucket name
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath, bucket = 'task-attachments') => {
  try {
    const supabase = await initializeSupabase();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};

/**
 * Get file info
 * @param {File} file
 * @returns {Object}
 */
export const getFileInfo = (file) => {
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
  const isValid = file.size <= 10 * 1024 * 1024;
  
  return {
    name: file.name,
    size: file.size,
    sizeFormatted: `${sizeInMB} MB`,
    type: file.type,
    isValid,
    error: isValid ? null : 'File size exceeds 10MB limit'
  };
};

export default {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getFileInfo
};
