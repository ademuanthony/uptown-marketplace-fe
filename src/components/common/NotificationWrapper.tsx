'use client';

import { useAuth } from '@/hooks/useAuth';
import PendingInvoiceNotification from './PendingInvoiceNotification';

export default function NotificationWrapper() {
  const { user, loading } = useAuth();

  // Only show notifications for authenticated users
  if (loading || !user) {
    return null;
  }

  return <PendingInvoiceNotification />;
}