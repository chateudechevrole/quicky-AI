import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StudentDashboardClient from './StudentDashboardClient';

export default async function StudentHomePage() {
  await requireRole('student');
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Check if student has any active bookings
  // Active = pending, payment_pending, confirmed, ongoing
  const { data: studentBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('student_id', user.id)
    .in('status', ['pending', 'payment_pending', 'confirmed', 'ongoing']);

  const hasActiveBooking = studentBookings && studentBookings.length > 0;

  // 2. Get busy tutors (those who have active bookings)
  // This ensures tutors who are currently booked don't show up
  const { data: busyTutorBookings } = await supabase
    .from('bookings')
    .select('tutor_id')
    .in('status', ['pending', 'payment_pending', 'confirmed', 'ongoing']);

  const busyTutorIds = busyTutorBookings?.map(b => b.tutor_id) || [];

  // 3. Get online tutors
  const { data: tutors } = await supabase
    .from('tutor_profiles')
    .select(`
      *,
      profiles:profiles!tutor_profiles_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('is_online', true)
    .eq('verification_status', 'approved'); 

  // 4. Filter out busy tutors
  const availableTutors = tutors?.filter(tutor => !busyTutorIds.includes(tutor.id)) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Find a Tutor</h1>
        <Link
          href="/student/virtual-tutor"
          className="px-6 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 hover:shadow-md"
        >
          Speak English with Quicky 🤖
        </Link>
      </div>
      
      <StudentDashboardClient 
        initialTutors={availableTutors} 
        hasActiveBooking={hasActiveBooking} 
      />
    </div>
  );
}
