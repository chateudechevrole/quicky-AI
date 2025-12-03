import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          QuickTutor
        </h1>
        <p className="text-xl text-gray-700 mb-2">
          Instant tutoring, like Grab but for tutors
        </p>
        <p className="text-lg text-gray-600 mb-12">
          No scheduling needed. Get help right now from tutors who are online.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup?role=student"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            I am a Student
          </Link>
          <Link
            href="/signup?role=tutor"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            I am a Tutor
          </Link>
          <Link
            href="/admin/login"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Admin Login
          </Link>
        </div>

        <div className="mt-12">
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Already have an account? Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

