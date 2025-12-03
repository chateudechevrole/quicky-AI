'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  studentId: string;
  tutorId: string;
  reporterRole: 'student' | 'tutor';
}

const REPORT_REASONS = [
  'Inappropriate behavior',
  'Late arrival / No show',
  'Technical issues',
  'Poor teaching quality',
  'Other',
];

export default function ReportModal({
  isOpen,
  onClose,
  bookingId,
  studentId,
  tutorId,
  reporterRole,
}: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [comments, setComments] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl = null;

      // Upload file if present
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('report_attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue without file or throw error? Let's throw for now.
          throw new Error('Failed to upload attachment: ' + uploadError.message);
        }
        
        // We use the path as the URL/reference
        fileUrl = fileName;
      }

      // Create report
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          created_by_id: user.id,
          against_user_id: reporterRole === 'student' ? tutorId : studentId,
          booking_id: bookingId,
          role_of_reporter: reporterRole,
          reason,
          comments,
          file_url: fileUrl,
          status: 'open',
        });

      if (reportError) throw reportError;

      // Create notification for admins (optional implementation detail - DB trigger preferred, but can do here)
      // We'll rely on admin checking dashboard for now, or add notification logic later.

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setComments('');
        setFile(null);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Report {reporterRole === 'student' ? 'Tutor' : 'Student'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-4xl mb-2">✓</div>
            <p className="text-gray-900 font-medium">Report submitted successfully.</p>
            <p className="text-gray-500 text-sm mt-1">Our team will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Comments</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Please describe the issue in detail..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment (Optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500 mt-1">Screenshots or relevant documents.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

