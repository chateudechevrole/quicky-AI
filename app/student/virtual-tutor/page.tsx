import { requireRole } from '@/lib/auth';
import VirtualTutorClient from './VirtualTutorClient';

export default async function VirtualTutorPage() {
  await requireRole('student');

  return (
    <div className="min-h-[calc(100vh-64px)] bg-blue-50/50">
      <VirtualTutorClient />
    </div>
  );
}

