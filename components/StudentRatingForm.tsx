'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface StudentRatingFormProps {
  bookingId: string;
  studentId: string;
}

const BEHAVIOR_OPTIONS = [
  { value: 'punctual', label: 'Punctual', positive: true },
  { value: 'respectful', label: 'Respectful', positive: true },
  { value: 'engaged', label: 'Engaged', positive: true },
  { value: 'prepared', label: 'Prepared', positive: true },
  { value: 'communicative', label: 'Communicative', positive: true },
  { value: 'cooperative', label: 'Cooperative', positive: true },
  { value: 'attentive', label: 'Attentive', positive: true },
  { value: 'disruptive', label: 'Disruptive', positive: false },
  { value: 'unprepared', label: 'Unprepared', positive: false },
  { value: 'inattentive', label: 'Inattentive', positive: false },
];

export default function StudentRatingForm({ bookingId, studentId }: StudentRatingFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBehaviorToggle = (value: string) => {
    setBehaviors((prev) =>
      prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { error: ratingError } = await supabase
        .from('student_ratings')
        .insert({
          booking_id: bookingId,
          tutor_id: user.id,
          student_id: studentId,
          rating,
          behaviors: behaviors.length > 0 ? behaviors : null,
        });

      if (ratingError) {
        setError(ratingError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        Rating submitted successfully!
      </div>
    );
  }

  const positiveBehaviors = BEHAVIOR_OPTIONS.filter((b) => b.positive);
  const negativeBehaviors = BEHAVIOR_OPTIONS.filter((b) => !b.positive);

  return (
    <form onSubmit={handleSubmit} className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Student</h3>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating *
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-4xl transition-colors ${
                star <= rating ? 'text-yellow-500' : 'text-gray-300'
              } hover:text-yellow-400`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">Selected: {rating} out of 5 stars</p>
      </div>

      {/* Behavior/Manner Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Behavior & Manner (Select all that apply)
        </label>
        
        {/* Positive Behaviors */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Positive Behaviors
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {positiveBehaviors.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={behaviors.includes(option.value)}
                  onChange={() => handleBehaviorToggle(option.value)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Negative Behaviors */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Areas for Improvement
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {negativeBehaviors.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={behaviors.includes(option.value)}
                  onChange={() => handleBehaviorToggle(option.value)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}
