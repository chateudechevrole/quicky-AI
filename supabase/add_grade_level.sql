-- Add grade_level column to student_profiles table
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS grade_level TEXT;

