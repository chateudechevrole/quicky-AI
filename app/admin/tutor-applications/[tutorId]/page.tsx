import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TutorApprovalActions from '@/components/TutorApprovalActions';

export default async function TutorApplicationDetailPage({
  params,
}: {
  params: { tutorId: string };
}) {
  await requireRole('admin');
  const supabase = await createClient();

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select(`
      *,
      profiles:profiles!tutor_profiles_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('id', params.tutorId)
    .single();

  if (!tutor) {
    notFound();
  }

  // Helper to get public URL (assuming policies allow read)
  const getFileUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('tutor_documents').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin/tutor-applications"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to applications
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Application: {tutor.profiles?.full_name}
            </h1>
            <p className="text-gray-600">{tutor.profiles?.email}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            tutor.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            tutor.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {tutor.verification_status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
            <p className="text-gray-700 text-sm">{tutor.bio}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Hourly Rate:</span> RM{tutor.hourly_rate}</p>
              <p><span className="font-medium">Subjects:</span> {tutor.subjects?.join(', ')}</p>
              <p><span className="font-medium">Grades:</span> {tutor.grades?.join(', ')}</p>
              <p><span className="font-medium">Languages:</span> {tutor.languages?.join(', ')}</p>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-2">IC / ID</h3>
            {tutor.ic_url ? (
              <a
                href={getFileUrl(tutor.ic_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View Document
              </a>
            ) : (
              <span className="text-red-500 text-sm">Not uploaded</span>
            )}
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Certificate</h3>
            {tutor.certificate_url ? (
              <a
                href={getFileUrl(tutor.certificate_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View Document
              </a>
            ) : (
              <span className="text-red-500 text-sm">Not uploaded</span>
            )}
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Bank Statement</h3>
            {tutor.bank_statement_url ? (
              <a
                href={getFileUrl(tutor.bank_statement_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View Document
              </a>
            ) : (
              <span className="text-red-500 text-sm">Not uploaded</span>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <TutorApprovalActions
            tutorId={tutor.id}
            currentStatus={tutor.verification_status}
          />
        </div>
      </div>
    </div>
  );
}

