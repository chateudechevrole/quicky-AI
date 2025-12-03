-- Add columns for early end class request
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS early_end_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_end_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_end_requested_at TIMESTAMPTZ;

