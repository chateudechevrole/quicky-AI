import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/ProfileForm';

export default async function StudentProfilePage() {
  await requireRole('student');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <ProfileForm
          profile={profile}
          studentProfile={studentProfile}
          role="student"
        />
      </div>

      {studentProfile && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ratings</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700">Average Rating: </span>
              <span className="text-sm text-gray-900">
                {studentProfile.rating_average > 0
                  ? `${studentProfile.rating_average.toFixed(1)} / 5.0`
                  : 'No ratings yet'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Total Ratings: </span>
              <span className="text-sm text-gray-900">{studentProfile.rating_count || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

