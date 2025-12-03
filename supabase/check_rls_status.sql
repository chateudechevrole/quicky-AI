-- DIAGNOSTIC: Check current RLS status on profiles table
-- Run this first to see what's currently set up

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'profiles';

-- List all current policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command",
  qual as "USING expression",
  with_check as "WITH CHECK expression"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

