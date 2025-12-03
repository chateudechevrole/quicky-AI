-- Update reports table to support file uploads and comments
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS comments TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Ensure status column has correct constraints if not already
ALTER TABLE reports
DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE reports
ADD CONSTRAINT reports_status_check 
CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed'));

-- Add RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON reports;

-- 1. Users can create reports (students or tutors)
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by_id);

-- 2. Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
TO authenticated
USING (auth.uid() = created_by_id);

-- 3. Admins can view all reports
CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Admins can update all reports
CREATE POLICY "Admins can update all reports"
ON reports FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Create storage bucket for report attachments if not exists
-- Note: You need to create 'report_attachments' bucket in Supabase Dashboard and make it Private (recommended) or Public.
-- We'll set up policies assuming it exists.

DROP POLICY IF EXISTS "Reporters can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view attachments" ON storage.objects;

-- Allow reporters to upload
CREATE POLICY "Reporters can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report_attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view attachments
CREATE POLICY "Admins can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'report_attachments' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

