'use client';

import { useState } from 'react';
import UnifiedPayment from './UnifiedPayment';

// Demo component showing how to use the unified payment system
export default function PaymentDemo() {
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Mock invoice data
  const mockInvoice = {
    id: 'inv_123456789',
    totalAmount: {
      amount: 5000, // 50.00 USD in cents
      currency: 'USD',
      display: '$50.00',
    },
    userEmail: 'user@example.com',
  };

  const handlePaymentComplete = () => {
    setPaymentCompleted(true);
    console.info('Payment completed successfully!');
  };

  if (paymentCompleted) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Completed!</h3>
          <p className="text-gray-600 mb-4">
            Your payment has been processed successfully.
          </p>
          <button
            onClick={() => setPaymentCompleted(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Another Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Demo</h2>
        <p className="text-gray-600">
          Choose your preferred payment method and complete the transaction
        </p>
      </div>
      
      <UnifiedPayment
        invoiceId={mockInvoice.id}
        totalAmount={mockInvoice.totalAmount}
        userEmail={mockInvoice.userEmail}
        onPaymentComplete={handlePaymentComplete}
      />

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Features Demonstrated:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Multiple payment methods (Crypto, Bank Transfer, Card)</li>
          <li>• Real-time payment method switching</li>
          <li>• Unified payment status tracking</li>
          <li>• Provider auto-detection</li>
          <li>• Responsive UI with loading states</li>
        </ul>
      </div>
    </div>
  );
}