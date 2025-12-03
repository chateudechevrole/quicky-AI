'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AvatarUpload from './AvatarUpload';

interface ProfileFormProps {
  profile: any;
  studentProfile?: any;
  tutorProfile?: any;
  role: 'student' | 'tutor';
}

export default function ProfileForm({ profile, studentProfile, tutorProfile, role }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient(); // Move this up
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Student-specific fields
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>(
    studentProfile?.preferred_subjects || []
  );
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(
    studentProfile?.preferred_languages || []
  );

  // Tutor-specific fields
  const [bio, setBio] = useState(tutorProfile?.bio || '');
  const [subjects, setSubjects] = useState<string[]>(tutorProfile?.subjects || []);
  const [grades, setGrades] = useState<string[]>(tutorProfile?.grades || []);
  const [languages, setLanguages] = useState<string[]>(tutorProfile?.languages || []);
  const [hourlyRate, setHourlyRate] = useState(tutorProfile?.hourly_rate || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // Update role-specific profile
      if (role === 'student') {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .update({
            preferred_subjects: preferredSubjects,
            preferred_languages: preferredLanguages,
          })
          .eq('id', user.id);

        if (studentError) {
          setError(studentError.message);
          setLoading(false);
          return;
        }
      } else if (role === 'tutor') {
        const { error: tutorError } = await supabase
          .from('tutor_profiles')
          .update({
            bio,
            subjects,
            grades,
            languages,
            hourly_rate: hourlyRate,
          })
          .eq('id', user.id);

        if (tutorError) {
          setError(tutorError.message);
          setLoading(false);
          return;
        }
      }

      setSuccess('Profile updated successfully!');
      setLoading(false);
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const addToArray = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    if (value.trim() && !array.includes(value.trim())) {
      setArray([...array, value.trim()]);
    }
  };

  const removeFromArray = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    setArray(array.filter((item) => item !== value));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
        <AvatarUpload 
          uid={profile.id}
          url={avatarUrl}
          onUpload={(url) => setAvatarUrl(url)}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            id="fullName"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {role === 'student' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Subjects
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {preferredSubjects.map((subject) => (
                  <span
                    key={subject}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeFromArray(preferredSubjects, setPreferredSubjects, subject)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add subject"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray(preferredSubjects, setPreferredSubjects, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Languages
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {preferredLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeFromArray(preferredLanguages, setPreferredLanguages, lang)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add language (e.g., EN, BM)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray(preferredLanguages, setPreferredLanguages, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </>
        )}

        {role === 'tutor' && (
          <>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {subjects.map((subject) => (
                  <span
                    key={subject}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeFromArray(subjects, setSubjects, subject)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add subject"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray(subjects, setSubjects, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grades</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {grades.map((grade) => (
                  <span
                    key={grade}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {grade}
                    <button
                      type="button"
                      onClick={() => removeFromArray(grades, setGrades, grade)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add grade level"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray(grades, setGrades, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeFromArray(languages, setLanguages, lang)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add language"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray(languages, setLanguages, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate ($)
              </label>
              <input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
