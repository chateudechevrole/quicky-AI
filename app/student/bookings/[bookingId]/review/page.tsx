'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const POSITIVE_BEHAVIOR_TAGS = [
  'Very patient',
  'Explains clearly',
  'Friendly and supportive',
  'Helped my child understand quickly',
  'Good teaching attitude',
  'Encouraging and motivating',
  'Good communication',
  'My child enjoyed the session',
  'Professional and well-prepared',
  'Made the lesson fun',
];

const IMPROVEMENT_BEHAVIOR_TAGS = [
  'Needs clearer explanation',
  'Not patient enough',
  'Slow response in chat',
  'Lesson felt rushed',
  'Not engaging',
  'Difficult to understand',
  'Unfriendly tone',
  'Unprepared for lesson',
  'Child felt uncomfortable',
  'Other issues',
];

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;
  const supabase = createClient();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingReview, setCheckingReview] = useState(true);
  const [existingReview, setExistingReview] = useState<any>(null);

  // Check if review already exists on component mount
  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: review } = await supabase
          .from('booking_reviews')
          .select('*')
          .eq('booking_id', bookingId)
          .single();

        if (review) {
          setExistingReview(review);
          // Redirect back to booking details if review already exists
          setTimeout(() => {
            router.push(`/student/bookings/${bookingId}`);
          }, 2000);
        }
      } catch (err) {
        console.error('Error checking review:', err);
      } finally {
        setCheckingReview(false);
      }
    };

    checkExistingReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Determine which tags to show based on rating
  const availableTags = useMemo(() => {
    return rating === 5 ? POSITIVE_BEHAVIOR_TAGS : IMPROVEMENT_BEHAVIOR_TAGS;
  }, [rating]);

  // Reset selected tags when rating changes
  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setSelectedTags([]); // Clear selected tags when rating changes
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if review already exists
    if (existingReview) {
      setError('You have already submitted a review for this booking.');
      return;
    }

    // Validation: at least 1 tag required
    if (selectedTags.length === 0) {
      setError('Please select at least one behavior tag');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Get booking to get tutor_id
      const { data: booking } = await supabase
        .from('bookings')
        .select('tutor_id')
        .eq('id', bookingId)
        .eq('student_id', user.id)
        .single();

      if (!booking) {
        setError('Booking not found');
        setLoading(false);
        return;
      }

      // Create review with behavior_tags
      const { error: reviewError } = await supabase
        .from('booking_reviews')
        .insert({
          booking_id: bookingId,
          student_id: user.id,
          tutor_id: booking.tutor_id,
          rating,
          comment,
          behavior_tags: selectedTags,
        });

      if (reviewError) {
        setError(reviewError.message);
        setLoading(false);
        return;
      }

      router.push(`/student/bookings/${bookingId}`);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  if (checkingReview) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">Checking...</p>
        </div>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-yellow-900 mb-4">Review Already Submitted</h1>
          <p className="text-yellow-800 mb-4">
            You have already submitted a review for this booking. You can only rate a tutor once per booking.
          </p>
          <p className="text-sm text-yellow-700 mb-4">
            Your rating: {existingReview.rating} stars
          </p>
          <button
            onClick={() => router.push(`/student/bookings/${bookingId}`)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Back to Booking Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Tutor</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className={`text-3xl ${
                  star <= rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">Selected: {rating} out of 5</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Behavior Tags * (Select at least one)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {availableTags.map((tag) => (
              <label
                key={tag}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{tag}</span>
              </label>
            ))}
          </div>
          {selectedTags.length === 0 && (
            <p className="text-sm text-red-600 mt-1">Please select at least one behavior tag</p>
          )}
          {selectedTags.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Selected: {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || selectedTags.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

