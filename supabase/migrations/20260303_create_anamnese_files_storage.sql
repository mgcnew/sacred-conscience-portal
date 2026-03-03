-- Migration: Create storage bucket for anamnese document photos
-- Date: 2026-03-03
-- Purpose: Allow users to upload photos of their identification documents in the anamnesis form

-- Step 1: Create bucket (not public - sensitive documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'anamnese-files',
  'anamnese-files',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: RLS Policies

-- Users can upload to their own folder
CREATE POLICY "Users can upload their own anamnese documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'anamnese-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own documents
CREATE POLICY "Users can view their own anamnese documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anamnese-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update (upsert) their own documents
CREATE POLICY "Users can update their own anamnese documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'anamnese-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all documents
CREATE POLICY "Admins can view all anamnese documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anamnese-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role = 'admin'
  )
);
