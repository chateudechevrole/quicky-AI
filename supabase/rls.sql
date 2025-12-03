-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Everyone can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to check admin status (avoids circular dependency in RLS)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Tutors can view student profiles (for booking context)
CREATE POLICY "Tutors can view student profiles"
  ON profiles FOR SELECT
  USING (
    role = 'student' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Students can view tutor profiles (public)
CREATE POLICY "Students can view tutor profiles"
  ON profiles FOR SELECT
  USING (
    role = 'tutor' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- ============================================
-- TUTOR_PROFILES POLICIES
-- ============================================

-- Tutors can view and edit their own profile
CREATE POLICY "Tutors can view own profile"
  ON tutor_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Tutors can update own profile"
  ON tutor_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Tutors can insert own profile"
  ON tutor_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Students can view tutor profiles (public)
CREATE POLICY "Students can view tutor profiles"
  ON tutor_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage tutor profiles"
  ON tutor_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STUDENT_PROFILES POLICIES
-- ============================================

-- Students can view and edit their own profile
CREATE POLICY "Students can view own profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Students can insert own profile"
  ON student_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tutors can view student profiles (for booking context)
CREATE POLICY "Tutors can view student profiles"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage student profiles"
  ON student_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- BOOKINGS POLICIES
-- ============================================

-- Students can view their own bookings
CREATE POLICY "Students can view own bookings"
  ON bookings FOR SELECT
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Students can create bookings
CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Students can update their own bookings (cancel, etc.)
CREATE POLICY "Students can update own bookings"
  ON bookings FOR UPDATE
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Tutors can view their own bookings
CREATE POLICY "Tutors can view own bookings"
  ON bookings FOR SELECT
  USING (
    tutor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Tutors can update bookings where they are tutor (accept/reject)
CREATE POLICY "Tutors can update own bookings"
  ON bookings FOR UPDATE
  USING (
    tutor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- BOOKING_REVIEWS POLICIES
-- ============================================

-- Students can view reviews (public)
CREATE POLICY "Anyone can view booking reviews"
  ON booking_reviews FOR SELECT
  USING (true);

-- Students can insert reviews for their own bookings
CREATE POLICY "Students can create reviews for own bookings"
  ON booking_reviews FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND student_id = auth.uid()
    )
  );

-- Only admins can update or delete reviews
CREATE POLICY "Admins can manage booking reviews"
  ON booking_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STUDENT_RATINGS POLICIES
-- ============================================

-- Tutors can view student ratings
CREATE POLICY "Tutors can view student ratings"
  ON student_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Students can view their own ratings
CREATE POLICY "Students can view own ratings"
  ON student_ratings FOR SELECT
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Tutors can insert ratings for bookings where they are tutor
CREATE POLICY "Tutors can create ratings for own bookings"
  ON student_ratings FOR INSERT
  WITH CHECK (
    tutor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND tutor_id = auth.uid()
    )
  );

-- Only admins can update or delete ratings
CREATE POLICY "Admins can manage student ratings"
  ON student_ratings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- REPORTS POLICIES
-- ============================================

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (created_by_id = auth.uid());

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (created_by_id = auth.uid());

-- Admins can view and manage all reports
CREATE POLICY "Admins can manage all reports"
  ON reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- PAYOUTS POLICIES
-- ============================================

-- Tutors can view their own payouts
CREATE POLICY "Tutors can view own payouts"
  ON payouts FOR SELECT
  USING (
    tutor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'tutor'
    )
  );

-- Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts"
  ON payouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Students can view messages for their bookings
CREATE POLICY "Students can view own booking messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND student_id = auth.uid()
    )
  );

-- Students can send messages in their bookings
CREATE POLICY "Students can send messages in own bookings"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND student_id = auth.uid()
    )
  );

-- Tutors can view messages for their bookings
CREATE POLICY "Tutors can view own booking messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND tutor_id = auth.uid()
    )
  );

-- Tutors can send messages in their bookings
CREATE POLICY "Tutors can send messages in own bookings"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id AND tutor_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System can create notifications (handled via service role in API routes)
-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

