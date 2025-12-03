'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TutorDocumentsPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<{
    ic: File | null;
    certificate: File | null;
    bankStatement: File | null;
  }>({
    ic: null,
    certificate: null,
    bankStatement: null,
  });

  const handleFileChange = (key: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const uploadFile = async (userId: string, file: File, folder: string) => {
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('tutor_documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    if (!files.ic || !files.certificate || !files.bankStatement) {
      setError('Please upload all required documents.');
      setUploading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Upload files
      const icPath = await uploadFile(user.id, files.ic, 'ic');
      const certPath = await uploadFile(user.id, files.certificate, 'certificates');
      const bankPath = await uploadFile(user.id, files.bankStatement, 'bank_statements');

      // Update profile
      const { error: updateError } = await supabase
        .from('tutor_profiles')
        .update({
          ic_url: icPath,
          certificate_url: certPath,
          bank_statement_url: bankPath,
          verification_status: 'pending',
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/tutor/dashboard');
    } catch (err: any) {
      console.error('Error uploading documents:', err);
      setError(err.message || 'Failed to upload documents. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Verification Documents</h1>
      <p className="text-gray-600 mb-8">
        To verify your tutor account, please upload the following documents.
        These will be reviewed by our admin team.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identification Card (IC) *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange('ic')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Highest Education Certificate *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange('certificate')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Statement (Header only) *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange('bankStatement')}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          <p className="text-xs text-gray-500 mt-1">For payout verification</p>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}

