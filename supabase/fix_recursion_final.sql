-- FIX: Resolve Infinite Recursion in RLS Policies
-- This replaces the recursive policies with a safe SECURITY DEFINER function.

-- 1. Create a secure helper to check the current user's role without triggering RLS loops
CREATE OR REPLACE FUNCTION public.get_my_claim_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- 2. Drop ALL potentially recursive policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Tutors can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Students can view tutor profiles" ON profiles;

-- 3. Recreate them using the non-recursive helper function

-- Admin Policies
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_my_claim_role() = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_my_claim_role() = 'admin');

-- Tutor Policy (Can view Students)
CREATE POLICY "Tutors can view student profiles"
  ON profiles FOR SELECT
  USING (
    role = 'student' AND get_my_claim_role() = 'tutor'
  );

-- Student Policy (Can view Tutors)
CREATE POLICY "Students can view tutor profiles"
  ON profiles FOR SELECT
  USING (
    role = 'tutor' AND get_my_claim_role() = 'student'
  );

