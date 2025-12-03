import { requireRole } from '@/lib/auth';
import AdminBookingsClient from './AdminBookingsClient';

export default async function AdminBookingsPage() {
  await requireRole('admin');

  return <AdminBookingsClient />;
}

