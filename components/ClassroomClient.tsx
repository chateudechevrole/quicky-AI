'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import StudentRatingForm from './StudentRatingForm';
import ReportModal from './ReportModal';

interface ClassroomClientProps {
  booking: any;
  messages: any[];
  currentUserId: string;
  userRole: 'student' | 'tutor' | 'admin';
  existingStudentRating?: any;
  existingReview?: any;
}

export default function ClassroomClient({
  booking: initialBooking,
  messages: initialMessages,
  currentUserId,
  userRole,
  existingStudentRating,
  existingReview,
}: ClassroomClientProps) {
  const router = useRouter();
  const [booking, setBooking] = useState(initialBooking);
  const [messages, setMessages] = useState(initialMessages);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Calculate time remaining and check if timer expired
  useEffect(() => {
    if (booking.status === 'in_progress' && booking.start_time && booking.duration_minutes) {
      const startTime = new Date(booking.start_time).getTime();
      const durationMs = booking.duration_minutes * 60 * 1000;
      const endTime = startTime + durationMs;
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          setTimerExpired(true);
        } else {
          setTimerExpired(false);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [booking]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to booking changes (for early end requests)
  useEffect(() => {
    const channel = supabase
      .channel(`booking-updates:${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`,
        },
        (payload) => {
          setBooking((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking.id]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`booking:${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${booking.id}`,
        },
        (payload) => {
          // Fetch updated message with sender info
          supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                full_name
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMessages((prev) => [...prev, data]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        booking_id: booking.id,
        sender_id: currentUserId,
        content: messageInput.trim(),
        type: 'user',
      });

      if (!error) {
        setMessageInput('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartClass = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (!error) {
        setBooking((prev) => ({
          ...prev,
          status: 'in_progress',
          start_time: new Date().toISOString(),
        }));
        router.refresh();
      }
    } catch (err) {
      console.error('Error starting class:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEarlyEnd = async () => {
    if (!confirm('Request to end class early? The tutor will need to approve.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          early_end_requested: true,
          early_end_requested_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('student_id', currentUserId);

      if (!error) {
        setBooking((prev) => ({
          ...prev,
          early_end_requested: true,
          early_end_requested_at: new Date().toISOString(),
        }));

        // Create system message
        await supabase.from('messages').insert({
          booking_id: booking.id,
          sender_id: null,
          content: 'Student has requested to end the class early. Waiting for tutor approval.',
          type: 'system',
        });

        router.refresh();
      }
    } catch (err) {
      console.error('Error requesting early end:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEarlyEnd = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          early_end_approved: true,
        })
        .eq('id', booking.id);

      if (!error) {
        setBooking((prev) => ({
          ...prev,
          early_end_approved: true,
        }));

        // Create system message
        await supabase.from('messages').insert({
          booking_id: booking.id,
          sender_id: null,
          content: 'Tutor has approved the early end request. Class can now be ended.',
          type: 'system',
        });

        router.refresh();
      }
    } catch (err) {
      console.error('Error approving early end:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectEarlyEnd = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          early_end_requested: false,
          early_end_approved: false,
          early_end_requested_at: null,
        })
        .eq('id', booking.id);

      if (!error) {
        setBooking((prev) => ({
          ...prev,
          early_end_requested: false,
          early_end_approved: false,
          early_end_requested_at: null,
        }));

        // Create system message
        await supabase.from('messages').insert({
          booking_id: booking.id,
          sender_id: null,
          content: 'Tutor has rejected the early end request. Class will continue.',
          type: 'system',
        });

        router.refresh();
      }
    } catch (err) {
      console.error('Error rejecting early end:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndClass = async () => {
    // Tutors can only end if timer expired OR student requested and tutor approved
    if (userRole === 'tutor') {
      const canEnd = timerExpired || (booking.early_end_requested && booking.early_end_approved);
      
      if (!canEnd) {
        alert('You can only end the class when the timer expires or after approving a student\'s early end request.');
        return;
      }
    }

    // Skip confirmation if timer expired (auto-end)
    if (!timerExpired && !confirm('Are you sure you want to end the class?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          early_end_requested: false,
          early_end_approved: false,
        })
        .eq('id', booking.id);

      if (!error) {
        setBooking((prev) => ({
          ...prev,
          status: 'completed',
          end_time: new Date().toISOString(),
          early_end_requested: false,
          early_end_approved: false,
        }));
        
        // Create system message
        await supabase.from('messages').insert({
          booking_id: booking.id,
          sender_id: null,
          content: 'Class has ended.',
          type: 'system',
        });

        router.refresh();
      }
    } catch (err) {
      console.error('Error ending class:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClass = async () => {
    if (!confirm('Are you sure you want to cancel this class?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)
        .eq('student_id', currentUserId);

      if (!error) {
        router.push(`/student/bookings/${booking.id}`);
      }
    } catch (err) {
      console.error('Error cancelling class:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const otherUser = userRole === 'student' ? booking.tutor : booking.student;
  const canTutorEnd = timerExpired || (booking.early_end_requested && booking.early_end_approved);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Class with {otherUser?.full_name || 'User'}
              </h1>
              <p className="text-sm text-gray-600">
                Subject: {booking.subject} | Status: {booking.status}
              </p>
            </div>
            <Link
              href={userRole === 'student' ? '/student/bookings' : '/tutor/bookings'}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back
            </Link>
          </div>

          {/* Timer */}
          {booking.status === 'in_progress' && timeRemaining !== null && (
            <div className="mt-4 flex justify-between items-center">
              <div className={`p-3 rounded flex-1 mr-4 ${timerExpired ? 'bg-green-50' : 'bg-blue-50'}`}>
                <p className={`text-sm font-medium ${timerExpired ? 'text-green-900' : 'text-blue-900'}`}>
                  Time Remaining: {formatTime(timeRemaining)}
                  {timerExpired && ' (Timer Expired)'}
                </p>
              </div>
              {userRole === 'student' && (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Report Tutor
                </button>
              )}
            </div>
          )}

          {/* Early End Request Status */}
          {booking.status === 'in_progress' && booking.early_end_requested && (
            <div className="mt-4">
              <div className={`p-3 rounded ${
                booking.early_end_approved 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm font-medium ${
                  booking.early_end_approved ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {userRole === 'student' 
                    ? booking.early_end_approved 
                      ? 'Tutor has approved your early end request. Class can now be ended.'
                      : 'You have requested to end the class early. Waiting for tutor approval...'
                    : booking.early_end_approved
                      ? 'You have approved the student\'s early end request. You can now end the class.'
                      : 'Student has requested to end the class early. Please approve or reject.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-4 flex-wrap">
            {/* Only tutors can start the class */}
            {booking.status === 'accepted' && userRole === 'tutor' && (
              <button
                onClick={handleStartClass}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Start Class
              </button>
            )}
            
            {/* Students can request early end */}
            {booking.status === 'in_progress' && 
             userRole === 'student' && 
             !booking.early_end_requested && 
             !timerExpired && (
              <button
                onClick={handleRequestEarlyEnd}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Request to End Class Early
              </button>
            )}

            {/* Tutors can approve/reject early end request */}
            {booking.status === 'in_progress' && 
             userRole === 'tutor' && 
             booking.early_end_requested && 
             !booking.early_end_approved && (
              <>
                <button
                  onClick={handleApproveEarlyEnd}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Approve Early End
                </button>
                <button
                  onClick={handleRejectEarlyEnd}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Reject Request
                </button>
              </>
            )}

            {/* Only tutors can end the class (when timer expired or approved) */}
            {booking.status === 'in_progress' && 
             userRole === 'tutor' && 
             canTutorEnd && (
              <button
                onClick={handleEndClass}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                End Class Now
              </button>
            )}

            {/* Students can cancel before class starts */}
            {(booking.status === 'pending' || booking.status === 'accepted') &&
              userRole === 'student' && (
                <button
                  onClick={handleCancelClass}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel Class
                </button>
              )}
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'system'
                    ? 'bg-gray-100 text-gray-700 mx-auto text-center'
                    : message.sender_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.type === 'user' && (
                  <p className="text-xs font-semibold mb-1">
                    {message.sender?.full_name || 'Unknown'}
                  </p>
                )}
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {booking.status === 'completed' && userRole === 'student' && !existingReview && (
          <div className="border-t p-4 bg-green-50">
            <p className="text-green-800 mb-2">Class has ended.</p>
            <Link
              href={`/student/bookings/${booking.id}/review`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-block"
            >
              Rate this Tutor
            </Link>
          </div>
        )}

        {booking.status === 'completed' && userRole === 'student' && existingReview && (
          <div className="border-t p-4 bg-green-50">
            <p className="text-green-800 mb-2">Class has ended.</p>
            <p className="text-sm text-green-700">
              You have already rated this tutor ({existingReview.rating} stars).
            </p>
          </div>
        )}

        {booking.status === 'completed' && userRole === 'tutor' && !existingStudentRating && (
          <div className="border-t p-4 bg-green-50">
            <StudentRatingForm 
              bookingId={booking.id} 
              studentId={booking.student_id || booking.student?.id} 
            />
          </div>
        )}

        {booking.status === 'completed' && userRole === 'tutor' && existingStudentRating && (
          <div className="border-t p-4 bg-green-50">
            <p className="text-green-800 mb-2">Class has ended.</p>
            <p className="text-sm text-green-700">
              You have rated this student ({existingStudentRating.rating} stars).
            </p>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        bookingId={booking.id}
        studentId={booking.student_id || booking.student?.id}
        tutorId={booking.tutor_id || booking.tutor?.id}
        reporterRole={userRole as 'student' | 'tutor'}
      />
    </div>
  );
}
