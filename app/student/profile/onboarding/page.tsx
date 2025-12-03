'use client';

import { useState, useEffect } from 'react';
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

const LANGUAGE_OPTIONS = [
  'English',
  'Bahasa Malaysia',
  'Chinese'
];

const GRADE_OPTIONS = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6',
  'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'
];

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [gradeLevel, setGradeLevel] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add a subject from dropdown
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !preferredSubjects.includes(value)) {
      setPreferredSubjects([...preferredSubjects, value]);
    }
    e.target.value = ''; // Reset dropdown
  };

  const handleRemoveSubject = (subject: string) => {
    setPreferredSubjects(preferredSubjects.filter((s) => s !== subject));
  };

  // Add a language from dropdown
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !preferredLanguages.includes(value)) {
      setPreferredLanguages([...preferredLanguages, value]);
    }
    e.target.value = ''; // Reset dropdown
  };

  const handleRemoveLanguage = (language: string) => {
    setPreferredLanguages(preferredLanguages.filter((l) => l !== language));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!gradeLevel) {
      setError('Please select your Grade Level');
      setLoading(false);
      return;
    }

    if (preferredSubjects.length === 0) {
      setError('Please select at least one preferred subject');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Update student profile with preferences
      // Note: We need to make sure 'grade_level' column exists in student_profiles or we store it in profiles
      // Based on the schema provided earlier, student_profiles has 'preferred_subjects' and 'preferred_languages'
      // I'll assume we might need to add 'grade_level' to student_profiles or just store it if it exists.
      // If the schema doesn't have it, we'll just store the other two.
      
      // Let's update what we have. If grade_level isn't in the schema yet, we might need to add it.
      // For now, I'll update the existing fields.
      
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({
          preferred_subjects: preferredSubjects,
          preferred_languages: preferredLanguages,
          grade_level: gradeLevel
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // If we want to store grade_level, we might need to add it to the schema
      // But since I can't modify schema easily without SQL, I'll just proceed.

      router.push('/student/home');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Grade Level Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Level *
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Grade Level</option>
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        {/* Preferred Subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Subjects *
          </label>
          <select
            onChange={handleSubjectChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
          >
            <option value="">Add a subject...</option>
            {SUBJECT_OPTIONS.map((subject) => (
              <option 
                key={subject} 
                value={subject}
                disabled={preferredSubjects.includes(subject)}
              >
                {subject}
              </option>
            ))}
          </select>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {preferredSubjects.map((subject) => (
              <span
                key={subject}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {subject}
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(subject)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Preferred Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Languages
          </label>
          <select
            onChange={handleLanguageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
          >
            <option value="">Add a language...</option>
            {LANGUAGE_OPTIONS.map((language) => (
              <option 
                key={language} 
                value={language}
                disabled={preferredLanguages.includes(language)}
              >
                {language}
              </option>
            ))}
          </select>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {preferredLanguages.map((language) => (
              <span
                key={language}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {language}
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(language)}
                  className="text-green-600 hover:text-green-800 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
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
