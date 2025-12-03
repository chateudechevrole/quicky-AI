'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface Tutor {
  id: string;
  bio: string;
  subjects: string[];
  grades: string[];
  languages: string[];
  hourly_rate: number;
  rating_average: number;
  rating_count: number;
  is_online: boolean;
  verification_status: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface StudentDashboardClientProps {
  initialTutors: Tutor[];
  hasActiveBooking: boolean;
}

const GRADE_LEVELS = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6',
  'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'
];

const SUBJECTS = [
  'Bahasa Melayu', 'English', 'Mathematics', 'Science', 'Sejarah',
  'Biology', 'Chemistry', 'Physics', 'Additional Mathematics'
];

const LANGUAGES = [
  'Chinese', 'English', 'Bahasa Malaysia'
];

export default function StudentDashboardClient({ initialTutors, hasActiveBooking }: StudentDashboardClientProps) {
  const supabase = createClient();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  // Helper function to get public URL from avatar_url (which might be a path or full URL)
  const getAvatarUrl = (avatarUrl: string | null): string | null => {
    if (!avatarUrl) return null;
    // If it's already a full URL, return it
    if (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob:')) {
      return avatarUrl;
    }
    // Otherwise, it's a path - get the public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
    return data.publicUrl;
  };

  // Filter and rank tutors
  const filteredTutors = useMemo(() => {
    // 1. Basic Filtering
    let filtered = initialTutors.filter(tutor => {
      // Filter by verification status (only approved tutors should be visible ideally, but for now let's show all online)
      // Actually, user req: "tutor with most applied criteria will appear on screen"
      
      // Strict filtering vs Matching score? 
      // "student can use the filter list to find the most fitable tutor"
      // Usually means "Show only matches" or "Rank matches".
      // Let's implement STRICT filtering first: if you select 'Math', you MUST offer 'Math'.
      
      if (selectedGrade && !tutor.grades?.includes(selectedGrade)) return false;
      if (selectedSubject && !tutor.subjects?.includes(selectedSubject)) return false;
      if (selectedLanguage && !tutor.languages?.includes(selectedLanguage)) return false;
      
      return true;
    });

    // 2. Ranking (optional refinement based on user request "most fitable")
    // Since we are strictly filtering, they are all "fitable". 
    // We can sort by rating or online status (though all here are online).
    // Let's sort by rating_average desc.
    return filtered.sort((a, b) => b.rating_average - a.rating_average);

  }, [initialTutors, selectedGrade, selectedSubject, selectedLanguage]);

  if (hasActiveBooking) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-yellow-800 mb-4">Active Class in Progress</h2>
        <p className="text-yellow-700 mb-6">
          You currently have an ongoing class or a pending booking. 
          Please complete your current session before booking a new tutor.
        </p>
        <Link 
          href="/student/bookings" 
          className="inline-block bg-yellow-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Tutors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="">All Grades</option>
              {GRADE_LEVELS.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="">All Subjects</option>
              {SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="">All Languages</option>
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tutors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutors.length > 0 ? (
          filteredTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="flex items-center gap-4 mb-4">
                {tutor.profiles.avatar_url ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                    <Image 
                      src={getAvatarUrl(tutor.profiles.avatar_url)!} 
                      alt={tutor.profiles.full_name} 
                      fill 
                      sizes="48px"
                      style={{ objectFit: 'cover' }} 
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {tutor.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {tutor.profiles.full_name}
                  </h3>
                  <div className="flex items-center text-yellow-500 text-sm">
                    <span className="mr-1">★</span>
                    {tutor.rating_average > 0 ? tutor.rating_average.toFixed(1) : 'New'}
                    <span className="text-gray-400 ml-1">({tutor.rating_count})</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 flex-grow">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Subjects: </span>
                  <span className="text-gray-600 line-clamp-2">
                    {tutor.subjects?.join(', ') || 'None'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Grades: </span>
                  <span className="text-gray-600 line-clamp-2">
                    {tutor.grades?.join(', ') || 'None'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Languages: </span>
                  <span className="text-gray-600 line-clamp-1">
                    {tutor.languages?.join(', ') || 'None'}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-lg">
                    RM{tutor.hourly_rate?.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/hr</span>
                  </span>
                </div>
              </div>

              <Link
                href={`/student/tutor/${tutor.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View Details
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No tutors found matching your criteria.</p>
            <button 
              onClick={() => {
                setSelectedGrade('');
                setSelectedSubject('');
                setSelectedLanguage('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

