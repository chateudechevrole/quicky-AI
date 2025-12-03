'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ToggleActiveButtonProps {
  userId: string;
  isActive: boolean;
}

export default function ToggleActiveButton({ userId, isActive: initialIsActive }: ToggleActiveButtonProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (!error) {
        setIsActive(!isActive);
        router.refresh();
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        isActive
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-red-100 text-red-800 hover:bg-red-200'
      } disabled:opacity-50`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </button>
  );
}

