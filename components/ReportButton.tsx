'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';

interface ReportButtonProps {
  bookingId: string;
  studentId: string;
  tutorId: string;
  reporterRole: 'student' | 'tutor';
  existingReport?: any;
}

export default function ReportButton({
  bookingId,
  studentId,
  tutorId,
  reporterRole,
  existingReport,
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (existingReport) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          You have reported this session. Status: <span className="font-medium">{existingReport.status}</span>
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-4 text-red-600 hover:text-red-800 text-sm font-medium underline"
      >
        Report This Session
      </button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookingId={bookingId}
        studentId={studentId}
        tutorId={tutorId}
        reporterRole={reporterRole}
      />
    </>
  );
}

