'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface NavbarProps {
  userRole: 'student' | 'tutor' | 'admin';
  userName?: string;
  userAvatarUrl?: string | null;
}

export default function Navbar({ userRole, userName, userAvatarUrl }: NavbarProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch avatar URL if path provided
  useEffect(() => {
    if (userAvatarUrl) {
      if (userAvatarUrl.startsWith('http') || userAvatarUrl.startsWith('blob:')) {
        setAvatarUrl(userAvatarUrl);
      } else {
        // Use getPublicUrl instead of download for better performance and public bucket support
        const { data } = supabase.storage.from('avatars').getPublicUrl(userAvatarUrl);
        setAvatarUrl(data.publicUrl);
      }
    }
  }, [userAvatarUrl]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getNavLinks = () => {
    if (userRole === 'student') {
      return [
        { href: '/student/home', label: 'Home' },
        { href: '/student/messages', label: 'Messages' },
        { href: '/student/bookings', label: 'My Bookings' },
        { href: '/student/profile', label: 'Profile' },
      ];
    } else if (userRole === 'tutor') {
      return [
        { href: '/tutor/dashboard', label: 'Dashboard' },
        { href: '/tutor/messages', label: 'Messages' },
        { href: '/tutor/bookings', label: 'Bookings' },
        { href: '/tutor/profile', label: 'Profile' },
      ];
    } else if (userRole === 'admin') {
      return [
        { href: '/admin/overview', label: 'Overview' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/tutor-applications', label: 'Applications' },
        { href: '/admin/bookings', label: 'Bookings' },
        { href: '/admin/reports', label: 'Reports' },
      ];
    }
    return [];
  };

  const getThemeColor = () => {
    switch (userRole) {
      case 'student': return 'text-blue-600 hover:text-blue-800';
      case 'tutor': return 'text-green-600 hover:text-green-800';
      case 'admin': return 'text-orange-600 hover:text-orange-800';
      default: return 'text-gray-900 hover:text-gray-700';
    }
  };

  const getBrandColor = () => {
    switch (userRole) {
      case 'student': return 'text-blue-600';
      case 'tutor': return 'text-green-600';
      case 'admin': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Conditionally render brand link only if NOT logged in, or show just logo/text if logged in but we removed it per previous request for logged in users */}
            {/* Actually previous request was to REMOVE the global button for logged in users. 
                Since this navbar is for logged in users (userRole prop exists), we hide the main brand link or make it non-clickable/invisible as requested.
                But we still need the nav links. 
            */}
            <div className="hidden sm:flex sm:space-x-8">
              {getNavLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${getThemeColor()}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {userName && (
              <span className="text-sm text-gray-700">Hello, {userName}</span>
            )}
            {avatarUrl ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                <Image 
                  src={avatarUrl} 
                  alt="Avatar" 
                  fill 
                  sizes="32px"
                  style={{ objectFit: 'cover' }} 
                />
              </div>
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                userRole === 'student' ? 'bg-blue-500' : userRole === 'tutor' ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
