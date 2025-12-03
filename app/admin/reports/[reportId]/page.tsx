import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ReportActions from '@/components/ReportActions';
import { notFound } from 'next/navigation';

export default async function AdminReportDetailPage({
  params,
}: {
  params: { reportId: string };
}) {
  await requireRole('admin');
  const supabase = await createClient();

  const { data: report } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reports_created_by_id_fkey (
        full_name,
        email,
        role
      ),
      reported_user:profiles!reports_against_user_id_fkey (
        full_name,
        email,
        role
      ),
      booking:bookings!reports_booking_id_fkey (
        id,
        status,
        created_at
      )
    `)
    .eq('id', params.reportId)
    .single();

  if (!report) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin/reports"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to reports
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            report.status === 'open' ? 'bg-red-100 text-red-800' :
            report.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {report.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Reporter
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-semibold text-gray-900">{report.reporter?.full_name}</p>
              <p className="text-sm text-gray-600">{report.reporter?.email}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase">{report.role_of_reporter}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Reported User
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-semibold text-gray-900">{report.reported_user?.full_name}</p>
              <p className="text-sm text-gray-600">{report.reported_user?.email}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase">{report.reported_user?.role}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Report Content
          </h3>
          <div className="border border-gray-200 rounded-md p-4">
            <div className="mb-4">
              <span className="font-medium text-gray-900">Reason: </span>
              <span className="text-gray-700">{report.reason}</span>
            </div>
            <div>
              <span className="font-medium text-gray-900 block mb-2">Comments:</span>
              <p className="text-gray-700 whitespace-pre-wrap">{report.comments}</p>
            </div>
            {report.file_url && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="font-medium text-gray-900 block mb-2">Attachment:</span>
                {/* We'll assume it's an image for now, or provide a download link */}
                {/* Need a way to get signed URL if bucket is private, or public URL */}
                {/* For now, simple link */}
                <p className="text-sm text-blue-600 break-all">
                  File attached: {report.file_url} (Access via Storage)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Related Booking
          </h3>
          <div className="border border-gray-200 rounded-md p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-900">Booking ID: {report.booking_id}</p>
              <p className="text-sm text-gray-600">Status: {report.booking?.status}</p>
              <p className="text-sm text-gray-600">
                Date: {new Date(report.booking?.created_at).toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/admin/bookings/${report.booking_id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Booking →
            </Link>
          </div>
        </div>

        <ReportActions 
          reportId={report.id} 
          currentStatus={report.status} 
          adminNotes={report.admin_notes} 
        />
      </div>
    </div>
  );
}
