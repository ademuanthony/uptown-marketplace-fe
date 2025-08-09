'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCardIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import invoiceService, { Invoice } from '../../services/invoice';
import WalletPaymentModal from './WalletPaymentModal';

interface InvoicePaymentPageProps {
  invoiceId: string;
}

const InvoicePaymentPage: React.FC<InvoicePaymentPageProps> = ({ invoiceId }) => {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const invoiceData = await invoiceService.getInvoice(invoiceId);
      setInvoice(invoiceData);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    if (method === 'wallet') {
      setShowWalletModal(true);
    }
  };

  const handleWalletPaymentSuccess = (updatedInvoice: Invoice) => {
    setInvoice(updatedInvoice);
    setShowWalletModal(false);
    setSelectedPaymentMethod('');
  };

  const handleTraditionalPayment = async (method: 'crypto' | 'bank_transfer' | 'card') => {
    if (!invoice) return;

    try {
      setPaymentLoading(true);
      
      const paymentData = await invoiceService.initiatePayment(
        invoice.id,
        method,
        'user@example.com', // TODO: Get from user context
        {
          network: method === 'crypto' ? 'polygon' : undefined,
          returnUrl: method !== 'crypto' ? `${window.location.origin}/invoices/${invoice.id}/payment-result` : undefined,
        }
      );

      // Handle different payment method responses
      if (method === 'crypto') {
        // Redirect to crypto payment page or show crypto payment details
        console.log('Crypto payment initiated:', paymentData);
      } else {
        // Redirect to payment provider (Paystack/Stripe)
        if (paymentData && typeof paymentData === 'object' && 'authorization_url' in paymentData) {
          window.location.href = (paymentData as any).authorization_url;
        }
      }
    } catch (err) {
      console.error('Failed to initiate payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = invoiceService.getStatusColor(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const canPayInvoice = (invoice: Invoice) => {
    return invoiceService.canPayInvoice(invoice);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Invoice</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Not Found</h3>
          <p className="text-gray-600 mb-4">The requested invoice could not be found.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            ← Back to Invoices
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Payment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Invoice #{invoice.number}</h2>
                  <p className="text-gray-600 mt-1">{invoice.title}</p>
                </div>
                {getStatusBadge(invoice.status)}
              </div>

              {/* Invoice Description */}
              {invoice.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{invoice.description}</p>
                </div>
              )}

              {/* Line Items */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Items</h3>
                <div className="space-y-3">
                  {invoice.line_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-gray-900">{item.description}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {item.unit_price.display}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{item.total_price.display}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{invoice.sub_total.display}</span>
                </div>
                {invoice.tax_amount.amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{invoice.tax_amount.display}</span>
                  </div>
                )}
                {invoice.discount_amount.amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-red-600">-{invoice.discount_amount.display}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{invoice.total_amount.display}</span>
                </div>
              </div>

              {/* Payment Deadline */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">
                    Payment deadline: {new Date(invoice.payment_deadline).toLocaleDateString()}
                  </span>
                </div>
                {invoice.is_expired && (
                  <p className="text-red-600 text-sm mt-2">⚠️ This invoice has expired</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>

              {!canPayInvoice(invoice) ? (
                <div className="text-center py-8">
                  <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Cannot Pay Invoice</h4>
                  <p className="text-gray-600 text-sm">
                    {invoice.status === 'paid' ? 'This invoice has already been paid.' :
                     invoice.is_expired ? 'This invoice has expired.' :
                     'This invoice is not available for payment.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Wallet Payment */}
                  <button
                    onClick={() => handlePaymentMethodSelect('wallet')}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center">
                      <CreditCardIcon className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Wallet Balance</h4>
                        <p className="text-sm text-gray-600">Pay instantly from your wallet</p>
                      </div>
                    </div>
                  </button>

                  {/* Crypto Payment */}
                  <button
                    onClick={() => handleTraditionalPayment('crypto')}
                    disabled={paymentLoading}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Cryptocurrency</h4>
                        <p className="text-sm text-gray-600">USDT, POL on Polygon network</p>
                      </div>
                    </div>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    onClick={() => handleTraditionalPayment('bank_transfer')}
                    disabled={paymentLoading}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <BanknotesIcon className="h-6 w-6 text-purple-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Bank Transfer</h4>
                        <p className="text-sm text-gray-600">Direct bank transfer</p>
                      </div>
                    </div>
                  </button>

                  {/* Card Payment */}
                  <button
                    onClick={() => handleTraditionalPayment('card')}
                    disabled={paymentLoading}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center">
                      <CreditCardIcon className="h-6 w-6 text-orange-600 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">Credit/Debit Card</h4>
                        <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
                      </div>
                    </div>
                  </button>

                  {paymentLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Processing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Status */}
            {invoice.status === 'paid' && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Payment Received</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Paid on {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Payment Modal */}
      <WalletPaymentModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        invoice={invoice}
        onPaymentSuccess={handleWalletPaymentSuccess}
      />
    </div>
  );
};

export default InvoicePaymentPage;