import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function AdminBookingDetailPage({
  params,
}: {
  params: { bookingId: string };
}) {
  await requireRole('admin');
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      student:profiles!bookings_student_id_fkey (
        id,
        full_name,
        email
      ),
      tutor:profiles!bookings_tutor_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('id', params.bookingId)
    .single();

  if (!booking) {
    notFound();
  }

  // Get reviews
  const { data: studentReview } = await supabase
    .from('booking_reviews')
    .select(`
      *,
      student:profiles!booking_reviews_student_id_fkey (
        full_name
      )
    `)
    .eq('booking_id', params.bookingId)
    .single();

  const { data: tutorRating } = await supabase
    .from('student_ratings')
    .select(`
      *,
      tutor:profiles!student_ratings_tutor_id_fkey (
        full_name
      )
    `)
    .eq('booking_id', params.bookingId)
    .single();

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        full_name
      )
    `)
    .eq('booking_id', params.bookingId)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin/bookings"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to bookings
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h1>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Student: </span>
            <span className="text-sm text-gray-900">{booking.student?.full_name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Tutor: </span>
            <span className="text-sm text-gray-900">{booking.tutor?.full_name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Subject: </span>
            <span className="text-sm text-gray-900">{booking.subject}</span>
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
            <span className="text-sm text-gray-900">${booking.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Ratings Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ratings</h2>
        
        {studentReview && (
          <div className="mb-4 pb-4 border-b">
            <h3 className="font-semibold text-gray-900 mb-2">Student → Tutor Review</h3>
            <p className="text-sm text-gray-700">
              Rating: {'★'.repeat(studentReview.rating)}{'☆'.repeat(5 - studentReview.rating)}
            </p>
            {studentReview.comment && (
              <p className="text-sm text-gray-600 mt-1">{studentReview.comment}</p>
            )}
          </div>
        )}

        {tutorRating && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Tutor → Student Rating</h3>
            <p className="text-sm text-gray-700">
              Rating: {'★'.repeat(tutorRating.rating)}{'☆'.repeat(5 - tutorRating.rating)}
            </p>
          </div>
        )}

        {!studentReview && !tutorRating && (
          <p className="text-gray-600">No ratings yet.</p>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
        {messages && messages.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.map((message: any) => (
              <div key={message.id} className="border rounded p-2">
                <p className="text-xs text-gray-500">
                  {message.sender?.full_name || 'System'} - {new Date(message.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-gray-900">{message.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No messages.</p>
        )}
      </div>
    </div>
  );
}

