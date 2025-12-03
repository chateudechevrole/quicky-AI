import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BookingForm from '@/components/BookingForm';

export default async function TutorProfilePage({
  params,
}: {
  params: { tutorId: string };
}) {
  await requireRole('student');
  const supabase = await createClient();

  // Get tutor profile
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

  // Get reviews
  const { data: reviews } = await supabase
    .from('booking_reviews')
    .select(`
      *,
      student:profiles!booking_reviews_student_id_fkey (
        full_name
      )
    `)
    .eq('tutor_id', params.tutorId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/student/home"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to tutors
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {tutor.profiles?.full_name || 'Tutor'}
        </h1>

        {tutor.bio && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-700">{tutor.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-sm font-medium text-gray-700">Subjects: </span>
            <span className="text-sm text-gray-600">
              {tutor.subjects?.join(', ') || 'Not specified'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Grades: </span>
            <span className="text-sm text-gray-600">
              {tutor.grades?.join(', ') || 'Not specified'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Languages: </span>
            <span className="text-sm text-gray-600">
              {tutor.languages?.join(', ') || 'Not specified'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Hourly Rate: </span>
            <span className="text-sm text-gray-600">RM{tutor.hourly_rate?.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Rating: </span>
            <span className="text-sm text-gray-600">
              {tutor.rating_average > 0
                ? `${tutor.rating_average.toFixed(1)} (${tutor.rating_count} reviews)`
                : 'No ratings yet'}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Status: </span>
            <span className={`text-sm ${tutor.is_online ? 'text-green-600' : 'text-gray-600'}`}>
              {tutor.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <BookingForm 
          tutorId={params.tutorId} 
          tutorRate={tutor.hourly_rate || 0}
          tutorSubjects={tutor.subjects || []}
          tutorGrades={tutor.grades || []}
          tutorLanguages={tutor.languages || []}
        />
      </div>

      {/* Reviews section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900">
                    {review.student?.full_name || 'Student'}
                  </span>
                  <span className="text-yellow-500">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                )}
                {review.behavior_tags && review.behavior_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {review.behavior_tags.map((tag: string) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          review.rating === 5
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
