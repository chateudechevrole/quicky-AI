-- Fix tutor_documents bucket access
-- This script ensures all necessary RLS policies are in place for the tutor_documents bucket

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Tutors can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all tutor documents" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can delete own documents" ON storage.objects;

-- Allow tutors to upload their own documents
-- Files must be in a folder named with their user ID
CREATE POLICY "Tutors can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tutor_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow tutors to view their own documents
CREATE POLICY "Tutors can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tutor_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow tutors to update their own documents
CREATE POLICY "Tutors can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tutor_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow tutors to delete their own documents
CREATE POLICY "Tutors can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tutor_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all tutor documents
CREATE POLICY "Admins can view all tutor documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tutor_documents' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

