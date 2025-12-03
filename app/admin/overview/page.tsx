import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function AdminOverviewPage() {
  await requireRole('admin');
  const supabase = await createClient();

  // Get stats - count all users regardless of role
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Count students
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Count tutors - ensure we count all tutors with role='tutor'
  const { count: totalTutors } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'tutor');

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Count bookings completed this month - use end_time if available, otherwise updated_at
  const { data: completedBookingsThisMonth } = await supabase
    .from('bookings')
    .select('end_time, updated_at')
    .eq('status', 'completed');
  
  const completedThisMonth = completedBookingsThisMonth?.filter((booking) => {
    const completionDate = booking.end_time 
      ? new Date(booking.end_time) 
      : new Date(booking.updated_at);
    return completionDate >= startOfMonth;
  }).length || 0;

  // Get revenue stats
  const { data: completedBookings } = await supabase
    .from('bookings')
    .select('total_amount, tutor_earnings, platform_fee')
    .eq('status', 'completed');

  const totalGrossRevenue =
    completedBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
  const totalTutorEarnings =
    completedBookings?.reduce((sum, b) => sum + (b.tutor_earnings || 0), 0) || 0;
  const totalPlatformIncome =
    completedBookings?.reduce((sum, b) => sum + (b.platform_fee || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900">{totalStudents || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tutors</h3>
          <p className="text-3xl font-bold text-gray-900">{totalTutors || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Classes Completed This Month</h3>
          <p className="text-3xl font-bold text-gray-900">{completedThisMonth || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-700">Total Tutor Earnings:</span>
            <span className="font-semibold">RM{totalTutorEarnings.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Total Platform Income:</span>
            <span className="font-semibold">RM{totalPlatformIncome.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-900 font-semibold">Total Gross Revenue:</span>
            <span className="text-gray-900 font-bold">RM{totalGrossRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

