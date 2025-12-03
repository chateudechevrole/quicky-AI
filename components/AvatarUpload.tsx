'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface AvatarUploadProps {
  uid: string;
  url: string | null;
  onUpload: (url: string) => void;
}

export default function AvatarUpload({ uid, url, onUpload }: AvatarUploadProps) {
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    // Get public URL immediately during initialization if possible
    const { data } = supabase.storage.from('avatars').getPublicUrl(url);
    return data.publicUrl;
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (url) {
      // If the url is already a full URL (e.g. from getPublicUrl), use it.
      // If it's a path, get the public URL.
      if (url.startsWith('http') || url.startsWith('blob:')) {
        setAvatarUrl(url);
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(url);
        setAvatarUrl(data.publicUrl);
      }
    }
  }, [url]);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${uid}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      onUpload(filePath);
      
      // Update local state with public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert('Error uploading avatar!');
      console.log(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {avatarUrl ? (
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            sizes="128px"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      ) : (
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}
      <div className="relative">
        <label
          htmlFor="single"
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Picture'}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
}

