import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BookingActions from '@/components/BookingActions';
import ReportButton from '@/components/ReportButton';

export default async function StudentBookingDetailPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await requireRole('student');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      tutor:profiles!bookings_tutor_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('id', params.bookingId)
    .eq('student_id', user.id)
    .single();

  if (!booking) {
    notFound();
  }

  // Check if review exists
  const { data: review } = await supabase
    .from('booking_reviews')
    .select('*')
    .eq('booking_id', params.bookingId)
    .single();

  // Check if report exists
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('booking_id', params.bookingId)
    .eq('created_by_id', user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/student/bookings"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to bookings
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h1>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Tutor: </span>
            <span className="text-sm text-gray-900">{booking.tutor?.full_name || 'Tutor'}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Subject: </span>
            <span className="text-sm text-gray-900">{booking.subject}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Grade Level: </span>
            <span className="text-sm text-gray-900">{booking.grade_level}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Language: </span>
            <span className="text-sm text-gray-900">{booking.language}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Duration: </span>
            <span className="text-sm text-gray-900">{booking.duration_minutes} minutes</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Status: </span>
            <span className={`text-sm px-2 py-1 rounded ${
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
              booking.status === 'in_progress' ? 'bg-green-100 text-green-800' :
              booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {booking.status}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Total Amount: </span>
            <span className="text-sm text-gray-900">RM{booking.total_amount?.toFixed(2)}</span>
          </div>
          {booking.start_time && (
            <div>
              <span className="text-sm font-medium text-gray-700">Start Time: </span>
              <span className="text-sm text-gray-900">
                {new Date(booking.start_time).toLocaleString()}
              </span>
            </div>
          )}
          {booking.end_time && (
            <div>
              <span className="text-sm font-medium text-gray-700">End Time: </span>
              <span className="text-sm text-gray-900">
                {new Date(booking.end_time).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <BookingActions booking={booking} userRole="student" />
        </div>

        {booking.status === 'completed' && (
          <div className="flex flex-col gap-4 mt-6 border-t pt-6">
            {!review && (
              <div>
                <Link
                  href={`/student/bookings/${params.bookingId}/review`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-block"
                >
                  Review Tutor
                </Link>
              </div>
            )}
            
            <div>
              <ReportButton 
                bookingId={booking.id}
                studentId={user.id}
                tutorId={booking.tutor_id}
                reporterRole="student"
                existingReport={report}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

