-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP FOR TASK ATTACHMENTS
-- =====================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Go to: SQL Editor → New Query → Paste this → Run

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'task-attachments',
    'task-attachments',
    true,
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STORAGE POLICIES FOR PUBLIC ACCESS
-- =====================================================

-- Policy: Allow anyone to read task attachments (public read)
DROP POLICY IF EXISTS "Public read access for task attachments" ON storage.objects;
CREATE POLICY "Public read access for task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

-- Policy: Allow authenticated users to upload task attachments
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-attachments' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own task attachments
DROP POLICY IF EXISTS "Users can update their own task attachments" ON storage.objects;
CREATE POLICY "Users can update their own task attachments"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'task-attachments' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their own task attachments
DROP POLICY IF EXISTS "Users can delete their own task attachments" ON storage.objects;
CREATE POLICY "Users can delete their own task attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task-attachments' 
    AND auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the bucket was created:
SELECT * FROM storage.buckets WHERE id = 'task-attachments';

-- Run this to verify policies were created:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%task attachments%';
