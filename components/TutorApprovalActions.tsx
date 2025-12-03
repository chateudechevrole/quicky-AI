'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TutorApprovalActionsProps {
  tutorId: string;
  currentStatus: string;
}

export default function TutorApprovalActions({ tutorId, currentStatus }: TutorApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateStatus = async (status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status} this tutor?`)) return;
    
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('tutor_profiles')
        .update({ verification_status: status })
        .eq('id', tutorId);

      if (updateError) throw updateError;

      router.refresh();
      router.push('/admin/tutor-applications');
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus !== 'pending') {
    return (
      <p className="text-gray-600">
        This application has already been {currentStatus}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <div className="flex gap-4">
        <button
          onClick={() => updateStatus('approved')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Approve Application'}
        </button>
        <button
          onClick={() => updateStatus('rejected')}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Reject Application'}
        </button>
      </div>
    </div>
  );
}

