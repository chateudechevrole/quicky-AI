'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SUBJECT_OPTIONS = [
  'Bahasa Melayu',
  'English',
  'Mathematics',
  'Science',
  'Sejarah',
  'Biology',
  'Chemistry',
  'Physics',
  'Additional Mathematics'
];

const GRADE_OPTIONS = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6',
  'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'
];

const LANGUAGE_OPTIONS = [
  'English',
  'Bahasa Malaysia',
  'Chinese'
];

export default function TutorOnboardingPage() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddToArray = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    if (value && !array.includes(value)) {
      setArray([...array, value]);
    }
  };

  const handleRemoveFromArray = (array: string[], setArray: (arr: string[]) => void, value: string) => {
    setArray(array.filter((item) => item !== value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { error: updateError } = await supabase
        .from('tutor_profiles')
        .update({
          bio,
          subjects,
          grades,
          languages,
          hourly_rate: hourlyRate,
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push('/tutor/profile/documents');
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Tutor Profile</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio *
          </label>
          <textarea
            id="bio"
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell students about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subjects *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
            onChange={(e) => {
              handleAddToArray(subjects, setSubjects, e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">Select a subject...</option>
            {SUBJECT_OPTIONS.map((subject) => (
              <option key={subject} value={subject} disabled={subjects.includes(subject)}>
                {subject}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <span
                key={subject}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {subject}
                <button
                  type="button"
                  onClick={() => handleRemoveFromArray(subjects, setSubjects, subject)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grades *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
            onChange={(e) => {
              handleAddToArray(grades, setGrades, e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">Select a grade level...</option>
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade} disabled={grades.includes(grade)}>
                {grade}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {grades.map((grade) => (
              <span
                key={grade}
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {grade}
                <button
                  type="button"
                  onClick={() => handleRemoveFromArray(grades, setGrades, grade)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages *</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
            onChange={(e) => {
              handleAddToArray(languages, setLanguages, e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">Select a language...</option>
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language} value={language} disabled={languages.includes(language)}>
                {language}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {lang}
                <button
                  type="button"
                  onClick={() => handleRemoveFromArray(languages, setLanguages, lang)}
                  className="text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
            Hourly Rate (RM) *
          </label>
          <input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}
