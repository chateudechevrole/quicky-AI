import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function TutorMessagesPage() {
  await requireRole('tutor');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get bookings for this tutor
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      student:profiles!bookings_student_id_fkey (
        id,
        full_name
      )
    `)
    .eq('tutor_id', user.id)
    .in('status', ['pending', 'accepted', 'in_progress', 'completed'])
    .order('created_at', { ascending: false });

  // Get last message for each booking
  const threads = await Promise.all(
    (bookings || []).map(async (booking: any) => {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get unread notifications
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .contains('data', { booking_id: booking.id });

      return {
        booking,
        lastMessage: messages?.[0],
        unreadCount: count || 0,
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="bg-white rounded-lg shadow divide-y">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <Link
              key={thread.booking.id}
              href={`/classroom/${thread.booking.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {thread.booking.student?.full_name || 'Student'}
                    </h3>
                    {thread.booking.status === 'pending' && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        New booking request
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      thread.booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      thread.booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      thread.booking.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {thread.booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Subject: {thread.booking.subject}
                  </p>
                  {thread.lastMessage && (
                    <p className="text-sm text-gray-500 truncate">
                      {thread.lastMessage.content}
                    </p>
                  )}
                </div>
                {thread.unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center text-gray-600">
            No messages yet.
          </div>
        )}
      </div>
    </div>
  );
}

