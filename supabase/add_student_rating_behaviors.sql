-- Add behavior/manner columns to student_ratings table
ALTER TABLE student_ratings
ADD COLUMN IF NOT EXISTS behaviors TEXT[] DEFAULT '{}';

-- Common behavior/manner options that tutors can select:
-- 'punctual', 'respectful', 'engaged', 'prepared', 'communicative', 
-- 'cooperative', 'attentive', 'disruptive', 'unprepared', 'inattentive'

