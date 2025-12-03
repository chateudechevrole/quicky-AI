-- Fix: Add missing INSERT policy for profiles table
-- This allows users to create their own profile during signup

-- Drop the policy if it already exists (to avoid errors if running multiple times)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create the INSERT policy
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

