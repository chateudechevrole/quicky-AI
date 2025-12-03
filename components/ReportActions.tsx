'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ReportActionsProps {
  reportId: string;
  currentStatus: string;
  adminNotes?: string;
}

export default function ReportActions({ reportId, currentStatus, adminNotes }: ReportActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(adminNotes || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const updateReport = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this report as ${newStatus.replace('_', ' ')}?`)) return;
    
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      setStatus(newStatus);
      setMessage('Report updated successfully.');
      router.refresh();
    } catch (err: any) {
      setMessage('Error updating report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h3>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Admin Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Internal notes regarding this report..."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {status !== 'in_review' && status !== 'resolved' && status !== 'dismissed' && (
          <button
            onClick={() => updateReport('in_review')}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Mark In Review
          </button>
        )}
        
        {status !== 'resolved' && (
          <button
            onClick={() => updateReport('resolved')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Resolve
          </button>
        )}

        {status !== 'dismissed' && (
          <button
            onClick={() => updateReport('dismissed')}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

