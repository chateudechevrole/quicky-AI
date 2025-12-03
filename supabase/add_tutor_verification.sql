-- 1. Add verification columns to tutor_profiles
ALTER TABLE tutor_profiles
ADD COLUMN IF NOT EXISTS ic_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS bank_statement_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' 
  CHECK (verification_status IN ('pending', 'approved', 'rejected'));

-- 2. Create a storage bucket for tutor documents
-- Note: You'll need to create the 'tutor_documents' bucket in the Supabase Dashboard manually if this SQL doesn't work (storage API is often separate).
-- But we can set up the policies here assuming the bucket exists.

-- Allow tutors to upload their own documents
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

-- Allow admins to view all tutor documents
-- (Using the same safe admin check as before)
CREATE POLICY "Admins can view all tutor documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tutor_documents' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

