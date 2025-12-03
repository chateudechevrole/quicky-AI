import { requireRole } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('student');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userRole="student" 
        userName={user.full_name || undefined}
        userAvatarUrl={user.avatar_url}
      />
      <main>{children}</main>
    </div>
  );
}

