import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import OnlineToggle from '@/components/OnlineToggle';
import Link from 'next/link';

export default async function TutorDashboardPage() {
  await requireRole('tutor');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get tutor profile
  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check verification status
  if (tutorProfile?.verification_status === 'pending') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">Application Under Review</h1>
          <p className="text-yellow-700 mb-6">
            Thank you for submitting your documents. Our admin team is currently reviewing your application.
            You will be able to access your dashboard and start teaching once your application is approved.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/tutor/profile" className="text-yellow-800 underline hover:text-yellow-900">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tutorProfile?.verification_status === 'rejected') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Application Rejected</h1>
          <p className="text-red-700 mb-6">
            We&apos;re sorry, but your application to become a tutor has been rejected.
            Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  // Only show dashboard if verification_status is 'approved' (or null for legacy users)
  // For new flow, we might want to force approval. Assuming legacy users are ok or set to approved.

  // ... Rest of dashboard code (same as before) ...
  // I need to copy the previous dashboard code here and wrap it in the else block or return early above.

  // Get today's bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('tutor_id', user.id)
    .gte('created_at', today.toISOString());

  // Get total completed bookings
  const { count: totalCompleted } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', user.id)
    .eq('status', 'completed');

  // Get classes completed this month
  // Use end_time if available, otherwise fall back to updated_at for bookings that were completed
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  // Count bookings completed this month - check both end_time and updated_at
  const { data: completedBookingsThisMonth } = await supabase
    .from('bookings')
    .select('end_time, updated_at')
    .eq('tutor_id', user.id)
    .eq('status', 'completed');
  
  const completedThisMonth = completedBookingsThisMonth?.filter((booking) => {
    const completionDate = booking.end_time 
      ? new Date(booking.end_time) 
      : new Date(booking.updated_at);
    return completionDate >= startOfMonth;
  }).length || 0;

  // Get total earnings
  const { data: earningsData } = await supabase
    .from('bookings')
    .select('tutor_earnings')
    .eq('tutor_id', user.id)
    .eq('status', 'completed');

  const totalEarnings = earningsData?.reduce((sum, b) => sum + (b.tutor_earnings || 0), 0) || 0;

  // Get unread notifications
  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  // Get pending bookings
  const { data: pendingBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      student:profiles!bookings_student_id_fkey (
        full_name
      )
    `)
    .eq('tutor_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  // Check for in-progress bookings
  const { data: inProgressBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      student:profiles!bookings_student_id_fkey (
        full_name
      )
    `)
    .eq('tutor_id', user.id)
    .eq('status', 'in_progress')
    .order('start_time', { ascending: false })
    .limit(1);

  const hasInProgressClass = inProgressBookings && inProgressBookings.length > 0;
  const currentBooking = hasInProgressClass ? inProgressBookings[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Status Card - Show In Progress if class is active */}
      {hasInProgressClass && currentBooking ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Class In Progress</h2>
              <p className="text-sm text-blue-700">
                You are currently teaching {currentBooking.student?.full_name || 'a student'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Subject: {currentBooking.subject} | Started: {currentBooking.start_time ? new Date(currentBooking.start_time).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <Link
              href={`/classroom/${currentBooking.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Go to Classroom
            </Link>
          </div>
        </div>
      ) : null}

      {/* Online Toggle - Disabled when class is in progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <OnlineToggle 
          tutorId={user.id} 
          isOnline={tutorProfile?.is_online || false}
          disabled={hasInProgressClass}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Today&apos;s Classes</h3>
          <p className="text-3xl font-bold text-gray-900">{todayBookings?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Classes Completed This Month</h3>
          <p className="text-3xl font-bold text-gray-900">{completedThisMonth || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Completed</h3>
          <p className="text-3xl font-bold text-gray-900">{totalCompleted || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-gray-900">RM{totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Pending Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Booking Requests</h2>
        {pendingBookings && pendingBookings.length > 0 ? (
          <div className="space-y-4">
            {pendingBookings.map((booking: any) => (
              <div
                key={booking.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.student?.full_name || 'Student'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {booking.subject} - {booking.duration_minutes} minutes
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.created_at).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/tutor/bookings/${booking.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No pending booking requests.</p>
        )}
      </div>
    </div>
  );
}
