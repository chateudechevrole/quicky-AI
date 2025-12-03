import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ClassroomClient from '@/components/ClassroomClient';

export default async function ClassroomPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get booking
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      student:profiles!bookings_student_id_fkey (
        id,
        full_name
      ),
      tutor:profiles!bookings_tutor_id_fkey (
        id,
        full_name
      )
    `)
    .eq('id', params.bookingId)
    .single();

  if (!booking) {
    notFound();
  }

  // Check if user is authorized (either student or tutor)
  if (user.role === 'student' && booking.student_id !== user.id) {
    redirect('/not-authorized');
  }
  if (user.role === 'tutor' && booking.tutor_id !== user.id) {
    redirect('/not-authorized');
  }
  if (user.role === 'admin') {
    // Admins can view any classroom
  }

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        id,
        full_name
      )
    `)
    .eq('booking_id', params.bookingId)
    .order('created_at', { ascending: true });

  // Check if tutor has rated this student (for completed classes)
  let existingStudentRating = null;
  if (user.role === 'tutor' && booking.status === 'completed') {
    const { data } = await supabase
      .from('student_ratings')
      .select('*')
      .eq('booking_id', params.bookingId)
      .eq('tutor_id', user.id)
      .single();
    existingStudentRating = data;
  }

  // Check if student has rated this tutor (for completed classes)
  let existingReview = null;
  if (user.role === 'student' && booking.status === 'completed') {
    const { data } = await supabase
      .from('booking_reviews')
      .select('*')
      .eq('booking_id', params.bookingId)
      .single();
    existingReview = data;
  }

  return (
    <ClassroomClient
      booking={booking}
      messages={messages || []}
      currentUserId={user.id}
      userRole={user.role}
      existingStudentRating={existingStudentRating}
      existingReview={existingReview}
    />
  );
}

