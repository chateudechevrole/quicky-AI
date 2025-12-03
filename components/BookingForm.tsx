'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface BookingFormProps {
  tutorId: string;
  tutorRate: number;
  tutorSubjects: string[];
  tutorGrades: string[];
  tutorLanguages: string[];
}

export default function BookingForm({ 
  tutorId, 
  tutorRate, 
  tutorSubjects = [], 
  tutorGrades = [], 
  tutorLanguages = [] 
}: BookingFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [language, setLanguage] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateCosts = () => {
    const hours = durationMinutes / 60;
    const totalAmount = tutorRate * hours;
    const platformFee = totalAmount * 0.1; // 10% platform fee
    const tutorEarnings = totalAmount - platformFee;
    return { totalAmount, platformFee, tutorEarnings };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!subject || !gradeLevel || !language) {
      setError('Please select a subject, grade level, and language.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { totalAmount, platformFee, tutorEarnings } = calculateCosts();

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          student_id: user.id,
          tutor_id: tutorId,
          status: 'pending',
          subject,
          grade_level: gradeLevel,
          language,
          duration_minutes: durationMinutes,
          total_amount: totalAmount,
          platform_fee: platformFee,
          tutor_earnings: tutorEarnings,
        })
        .select()
        .single();

      if (bookingError) {
        setError(bookingError.message);
        setLoading(false);
        return;
      }

      // Create notification for tutor
      await supabase.from('notifications').insert({
        user_id: tutorId,
        type: 'booking_request',
        data: {
          booking_id: booking.id,
          student_name: user.email, // You can fetch full name from profile if needed
        },
      });

      // Create system message
      await supabase.from('messages').insert({
        booking_id: booking.id,
        sender_id: null,
        content: `New booking request from student`,
        type: 'system',
      });

      router.push(`/student/bookings/${booking.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const { totalAmount, platformFee, tutorEarnings } = calculateCosts();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject *
        </label>
        <select
          id="subject"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Select a subject...</option>
          {tutorSubjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">
          Grade Level *
        </label>
        <select
          id="gradeLevel"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        >
          <option value="">Select a grade level...</option>
          {tutorGrades.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
          Language *
        </label>
        <select
          id="language"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">Select a language...</option>
          {tutorLanguages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
          Duration (minutes) *
        </label>
        <select
          id="duration"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
          <option value={75}>1 hour 15 minutes</option>
          <option value={90}>1.5 hours</option>
          <option value={105}>1 hour 45 minutes</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-700">Tutor Rate:</span>
          <span className="text-sm font-medium">RM{tutorEarnings.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-700">Platform Fee (10%):</span>
          <span className="text-sm font-medium">RM{platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="text-sm font-semibold text-gray-900">Total:</span>
          <span className="text-sm font-bold text-gray-900">RM{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Confirm and Book'}
      </button>
    </form>
  );
}
