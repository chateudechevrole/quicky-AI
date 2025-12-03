'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface BookingActionsProps {
  booking: any;
  userRole: 'student' | 'tutor';
}

export default function BookingActions({ booking, userRole }: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'accepted' })
        .eq('id', booking.id)
        .eq('tutor_id', user.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Create notification for student
      await supabase.from('notifications').insert({
        user_id: booking.student_id,
        type: 'booking_accepted',
        data: {
          booking_id: booking.id,
          tutor_name: user.email,
        },
      });

      // Create system message
      await supabase.from('messages').insert({
        booking_id: booking.id,
        sender_id: null,
        content: 'Your tutor accepted the booking. You can start chatting now.',
        type: 'system',
      });

      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', booking.id)
        .eq('tutor_id', user.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Create notification for student
      await supabase.from('notifications').insert({
        user_id: booking.student_id,
        type: 'booking_rejected',
        data: {
          booking_id: booking.id,
          tutor_name: user.email,
        },
      });

      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleStartClass = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push(`/classroom/${booking.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)
        .eq('student_id', user.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Create notification for tutor
      await supabase.from('notifications').insert({
        user_id: booking.tutor_id,
        type: 'class_cancelled',
        data: {
          booking_id: booking.id,
        },
      });

      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (userRole === 'tutor') {
    if (booking.status === 'pending') {
      return (
        <div className="flex gap-4">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      );
    } else if (booking.status === 'accepted' || booking.status === 'in_progress') {
      return (
        <Link
          href={`/classroom/${booking.id}`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Enter Classroom
        </Link>
      );
    }
  } else if (userRole === 'student') {
    if (booking.status === 'pending' || booking.status === 'accepted') {
      return (
        <div className="flex gap-4">
          {(booking.status === 'accepted' || booking.status === 'in_progress') && (
            <Link
              href={`/classroom/${booking.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Enter Classroom
            </Link>
          )}
          {booking.status !== 'in_progress' && (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Cancel Class'}
            </button>
          )}
        </div>
      );
    } else if (booking.status === 'in_progress') {
      return (
        <Link
          href={`/classroom/${booking.id}`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Enter Classroom
        </Link>
      );
    }
  }

  return null;
}

