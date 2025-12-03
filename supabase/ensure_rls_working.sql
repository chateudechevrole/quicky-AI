-- SAFE FIX: Ensure RLS is working for login
-- This script is safe to run multiple times - it uses IF EXISTS/IF NOT EXISTS

-- 1. Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on profiles (clean slate)
DROP POLICY IF EXISTS "Public view for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Tutors can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Students can view tutor profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3. Create the simplest possible policies that allow login to work

-- Allow ANY authenticated user to SELECT (read) ANY profile
-- This is needed for login to check user role
CREATE POLICY "Allow authenticated users to read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to INSERT their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

