-- LOOSEN RLS TO UNBLOCK DEVELOPMENT
-- This removes complex role checks and allows any logged-in user to read basic profile info.

-- 1. Drop ALL complicated/recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Tutors can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Students can view tutor profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 2. Allow ANY authenticated user to VIEW all profiles
-- (This solves the "who can see whom" logic errors)
CREATE POLICY "Public view for authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow users to INSERT their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Allow Admins to UPDATE any profile (using a simpler check)
-- This assumes you know the admin ID manually, or just relies on the user ID check above for now.
-- To keep it simple and working, we'll just stick to "Update Own" for now.
-- If you need admins to edit others, we can add that back later once the basics work.

