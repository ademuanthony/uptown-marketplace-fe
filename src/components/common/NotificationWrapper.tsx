'use client';

import { useAuth } from '@/hooks/useAuth';
import PendingInvoiceNotification from './PendingInvoiceNotification';

export default function NotificationWrapper() {
  const { user, isLoading } = useAuth();

  // Only show notifications for authenticated users
  if (isLoading || !user) {
    return null;
  }

  return <PendingInvoiceNotification />;
}