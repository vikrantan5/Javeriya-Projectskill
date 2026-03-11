-- =====================================================
-- SUPABASE STORAGE BUCKETS SETUP FOR PROFILE IMAGES
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for background photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'background-photos',
    'background-photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES FOR PUBLIC ACCESS
-- =====================================================

-- Policy: Allow anyone to read profile photos (public read)
CREATE POLICY "Public read access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Policy: Allow authenticated users to upload their own profile photos
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own profile photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their own profile photos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow anyone to read background photos (public read)
CREATE POLICY "Public read access for background photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'background-photos');

-- Policy: Allow authenticated users to upload their own background photos
CREATE POLICY "Authenticated users can upload background photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'background-photos' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own background photos
CREATE POLICY "Users can update their own background photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'background-photos' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to delete their own background photos
CREATE POLICY "Users can delete their own background photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'background-photos' 
    AND auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify buckets were created:
-- SELECT * FROM storage.buckets WHERE id IN ('profile-photos', 'background-photos');
