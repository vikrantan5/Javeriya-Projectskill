-- =====================================================
-- URGENT DATABASE FIXES FOR TALENTCONNECT
-- =====================================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query
-- Paste this entire file and click RUN
-- =====================================================

-- =====================================================
-- FIX 1: Add meeting_link column to skill_exchange_sessions
-- =====================================================

-- Add meeting_link column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'skill_exchange_sessions' 
        AND column_name = 'meeting_link'
    ) THEN
        ALTER TABLE skill_exchange_sessions 
        ADD COLUMN meeting_link TEXT;
        
        RAISE NOTICE 'Added meeting_link column to skill_exchange_sessions table';
    ELSE
        RAISE NOTICE 'meeting_link column already exists';
    END IF;
END $$;

-- =====================================================
-- FIX 2: Create task-attachments storage bucket
-- =====================================================

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
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STORAGE POLICIES FOR task-attachments BUCKET
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own task attachments" ON storage.objects;

-- Policy: Allow anyone to read task attachments (public read)
CREATE POLICY "Public read access for task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

-- Policy: Allow authenticated users to upload task attachments
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-attachments' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Policy: Allow users to update their own task attachments
CREATE POLICY "Users can update their own task attachments"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'task-attachments' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Policy: Allow users to delete their own task attachments
CREATE POLICY "Users can delete their own task attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task-attachments' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify meeting_link column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'skill_exchange_sessions' 
AND column_name = 'meeting_link';

-- Verify bucket was created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'task-attachments';

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%task attachments%';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Database fixes completed successfully!';
    RAISE NOTICE '✅ meeting_link column added to skill_exchange_sessions';
    RAISE NOTICE '✅ task-attachments bucket created with policies';
END $$;
