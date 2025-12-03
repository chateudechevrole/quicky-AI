'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface OnlineToggleProps {
  tutorId: string;
  isOnline: boolean;
  disabled?: boolean;
}

export default function OnlineToggle({ tutorId, isOnline: initialIsOnline, disabled = false }: OnlineToggleProps) {
  const [isOnline, setIsOnline] = useState(initialIsOnline);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled) return;
    
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tutor_profiles')
        .update({ is_online: !isOnline })
        .eq('id', tutorId);

      if (!error) {
        setIsOnline(!isOnline);
      }
    } catch (err) {
      console.error('Error toggling online status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Online Status</h2>
        <p className="text-sm text-gray-600">
          {isOnline
            ? 'You are currently online and visible to students'
            : 'You are offline and not visible to students'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading || disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isOnline ? 'bg-green-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isOnline ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

