'use client';

import PaymentDemo from '@/components/invoice/PaymentDemo';

export default function PaymentDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Unified Payment System Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Experience our flexible payment system with support for cryptocurrency, bank transfers, and card payments.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">✨ Features Showcased:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Multi-payment support:</strong> Crypto (USDT), Bank Transfer, Card</li>
              <li>• <strong>Real-time switching:</strong> Change payment methods anytime</li>
              <li>• <strong>Unified interface:</strong> Consistent experience across providers</li>
              <li>• <strong>Auto-detection:</strong> Smart provider identification</li>
              <li>• <strong>Polygon network:</strong> Fast and low-cost crypto transactions</li>
            </ul>
          </div>
        </div>
        
        <PaymentDemo />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This is a demonstration using mock invoice data.</p>
          <p>In production, this would be integrated with actual invoice payments.</p>
        </div>
      </div>
    </div>
  );
}