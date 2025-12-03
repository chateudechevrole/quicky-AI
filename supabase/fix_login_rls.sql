-- FIX: Allow authenticated users to read their own profile (required for login)
-- This is the minimal RLS needed for login to work

-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "Public view for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Tutors can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Students can view tutor profiles" ON profiles;

-- CRITICAL: Allow users to read their OWN profile (needed for login role check)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow ALL authenticated users to read ALL profiles (simplest for development)
-- This ensures login and navigation work smoothly
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Keep INSERT policy (for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Keep UPDATE policy (for profile edits)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

