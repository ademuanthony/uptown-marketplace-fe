'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import invoiceService, { Invoice } from '@/services/invoice';

export default function PendingInvoiceNotification() {
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const pathname = usePathname();

  // Don't show on invoice pages
  const isInvoicePage = pathname?.startsWith('/invoices');

  useEffect(() => {
    if (isInvoicePage) {
      setPendingInvoices([]);
      return;
    }

    const fetchPendingInvoices = async () => {
      try {
        setLoading(true);
        const response = await invoiceService.getUserInvoices('pending', 1, 5);
        
        // Check if response and invoices exist
        if (!response || !response.invoices) {
          setPendingInvoices([]);
          return;
        }
        
        const { invoices } = response;
        
        // Filter out dismissed invoices stored in session
        const sessionDismissed = sessionStorage.getItem('dismissedInvoices0');
        const dismissedIds = sessionDismissed ? JSON.parse(sessionDismissed) : [];
        
        const activePendingInvoices = (invoices || []).filter(
          invoice => !dismissedIds.includes(invoice.id),
        );
        
        setPendingInvoices(activePendingInvoices);
        setDismissed(dismissedIds);
      } catch (error) {
        console.error('Failed to fetch pending invoices:', error);
        setPendingInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPendingInvoices();

    // Refresh every 60 seconds
    const interval = setInterval(fetchPendingInvoices, 60000);

    return () => clearInterval(interval);
  }, [pathname, isInvoicePage]);

  const handleDismiss = (invoiceId: string) => {
    // Store dismissed state in session storage
    const newDismissed = [...dismissed, invoiceId];
    sessionStorage.setItem('dismissedInvoices', JSON.stringify(newDismissed));
    
    // Update state
    setDismissed(newDismissed);
    setPendingInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
  };

  // Don't render anything if on invoice page, loading, or no pending invoices
  if (isInvoicePage || loading || pendingInvoices.length === 0) {
    return null;
  }

  // Show only the first pending invoice as a notification bar
  const invoice = pendingInvoices[0];
  if (!invoice) return null;
  const remainingCount = pendingInvoices.length - 1;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-yellow-50 border-b border-yellow-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-yellow-800">
                You have a pending invoice:
              </span>
              <span className="font-medium text-yellow-900">
                {invoice.title}
              </span>
              <span className="text-yellow-700">
                ({invoice.total_amount.display})
              </span>
              {remainingCount > 0 && (
                <span className="text-yellow-600">
                  +{remainingCount} more
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href={`/invoices/${invoice.id}`}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
            >
              View Invoice
            </Link>
            
            {pendingInvoices.length > 1 && (
              <Link
                href="/invoices"
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-800 hover:text-yellow-900 transition-colors"
              >
                View All
              </Link>
            )}
            
            <button
              onClick={() => handleDismiss(invoice.id)}
              className="p-1 rounded-md text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}