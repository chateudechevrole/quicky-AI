import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ToggleActiveButton from '@/components/ToggleActiveButton';

export default async function AdminUserDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  await requireRole('admin');
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .single();

  if (!user) {
    notFound();
  }

  // Get role-specific data
  let roleData = null;
  if (user.role === 'tutor') {
    const { data } = await supabase
      .from('tutor_profiles')
      .select('*')
      .eq('id', params.userId)
      .single();
    roleData = data;
  } else if (user.role === 'student') {
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', params.userId)
      .single();
    roleData = data;
  }

  // Get bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .or(`student_id.eq.${params.userId},tutor_id.eq.${params.userId}`)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin/users"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to users
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Details</h1>

        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Name: </span>
            <span className="text-sm text-gray-900">{user.full_name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Email: </span>
            <span className="text-sm text-gray-900">{user.email}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Role: </span>
            <span className={`text-sm px-2 py-1 rounded ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
              user.role === 'tutor' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {user.role}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Status: </span>
            <ToggleActiveButton userId={user.id} isActive={user.is_active} />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Created: </span>
            <span className="text-sm text-gray-900">
              {new Date(user.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {roleData && user.role === 'tutor' && (
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tutor Profile</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Rating: </span>
                <span className="text-sm text-gray-900">
                  {roleData.rating_average > 0
                    ? `${roleData.rating_average.toFixed(1)} (${roleData.rating_count} reviews)`
                    : 'No ratings'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Hourly Rate: </span>
                <span className="text-sm text-gray-900">RM{roleData.hourly_rate?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {roleData && user.role === 'student' && (
          <div className="mt-6 pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Profile</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Rating: </span>
                <span className="text-sm text-gray-900">
                  {roleData.rating_average > 0
                    ? `${roleData.rating_average.toFixed(1)} (${roleData.rating_count} ratings)`
                    : 'No ratings'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Bookings</h2>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-2">
            {bookings.map((booking: any) => (
              <div key={booking.id} className="border rounded p-3">
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Booking #{booking.id.slice(0, 8)} - {booking.subject} - {booking.status}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No bookings found.</p>
        )}
      </div>
    </div>
  );
}

