'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import invoiceService, { type Invoice } from '@/services/invoice';
import UnifiedPayment from '@/components/invoice/UnifiedPayment';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'paid':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'cancelled':
    case 'expired':
      return <XMarkIcon className="h-5 w-5 text-red-500" />;
    default:
      return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'paid':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'cancelled':
    case 'expired':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const invoiceId = params.id as string;

  useEffect(() => {
    if (!authLoading && user && invoiceId) {
      loadInvoice();
    }
  }, [user, authLoading, invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await invoiceService.getInvoice(invoiceId);
      setInvoice(invoiceData);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
      router.push('/fuel');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoice || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      setCancelling(true);
      await invoiceService.cancelInvoice(invoice.id, cancelReason);
      toast.success('Invoice cancelled successfully');
      setShowCancelModal(false);
      loadInvoice(); // Reload to get updated status
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      toast.error('Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  const handlePaymentComplete = () => {
    // Reload invoice to check updated status
    loadInvoice();
    toast.success('Payment processing! Please check back in a few minutes.');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-primary-600 mx-auto animate-pulse" />
          <p className="mt-2 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-600">Please log in to view this invoice</p>
          <Link 
            href="/auth/login"
            className="mt-4 inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-600">Invoice not found</p>
          <Link 
            href="/fuel"
            className="mt-4 inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Fuel
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = invoice.status === 'pending' && !invoice.is_expired;
  const canPay = invoiceService.canPayInvoice(invoice);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-primary-600 mr-3" />
                Invoice {invoice.number}
              </h1>
              <p className="mt-2 text-gray-600">{invoice.title}</p>
            </div>
            
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(invoice.status)}`}>
              <div className="flex items-center">
                {getStatusIcon(invoice.status)}
                <span className="ml-1 capitalize">{invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h2>

            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Invoice Number</dt>
                <dd className="text-sm font-medium text-gray-900">{invoice.number}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900">{invoice.description}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Buyer</dt>
                <dd className="text-sm text-gray-900 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {invoice.buyer_name}
                </dd>
                <dd className="text-sm text-gray-500">{invoice.buyer_email}</dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  {new Date(invoice.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>

              {invoice.due_date && (
                <div>
                  <dt className="text-sm text-gray-500">Due Date</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(invoice.due_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm text-gray-500">Payment Deadline</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(invoice.payment_deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
            </dl>

            {/* Line Items */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Items</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.line_items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.unit_price.display}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{item.total_price.display}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm text-gray-900">{invoice.sub_total.display}</dd>
                </div>
                {invoice.tax_amount.amount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Tax</dt>
                    <dd className="text-sm text-gray-900">{invoice.tax_amount.display}</dd>
                  </div>
                )}
                {invoice.discount_amount.amount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Discount</dt>
                    <dd className="text-sm text-green-600">-{invoice.discount_amount.display}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-bold text-gray-900">{invoice.total_amount.display}</dd>
                </div>
              </dl>
            </div>

            {/* Actions */}
            <div className="mt-6 flex space-x-3">
              <Link
                href="/fuel"
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-center transition-colors"
              >
                Back to Fuel
              </Link>
              
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel Invoice
                </button>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div>
            {canPay ? (
              <UnifiedPayment 
                invoiceId={invoice.id}
                totalAmount={invoice.total_amount}
                userEmail={user.email || invoice.buyer_email}
                onPaymentComplete={handlePaymentComplete}
              />
            ) : (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Status</h3>
                
                {invoice.status === 'paid' && (
                  <div className="text-center py-6">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-green-600">Payment Completed</p>
                    {invoice.paid_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        Paid on {new Date(invoice.paid_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                )}

                {invoice.status === 'cancelled' && (
                  <div className="text-center py-6">
                    <XMarkIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-red-600">Invoice Cancelled</p>
                    {invoice.cancelled_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        Cancelled on {new Date(invoice.cancelled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {invoice.status === 'expired' && (
                  <div className="text-center py-6">
                    <ClockIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-red-600">Invoice Expired</p>
                    <p className="text-sm text-gray-500 mt-2">
                      This invoice has passed its payment deadline
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Invoice</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for cancelling this invoice:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Enter cancellation reason..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={cancelling}
                >
                  Keep Invoice
                </button>
                <button
                  onClick={handleCancelInvoice}
                  disabled={cancelling || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}