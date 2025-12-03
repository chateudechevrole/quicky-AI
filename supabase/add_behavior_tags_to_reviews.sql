-- Add behavior_tags column to booking_reviews table
ALTER TABLE booking_reviews
ADD COLUMN IF NOT EXISTS behavior_tags TEXT[];

