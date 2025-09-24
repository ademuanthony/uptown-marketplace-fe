'use client';

import React from 'react';
import { CurrencyDollarIcon, WalletIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export type PaymentMethod = 'wallet' | 'crypto' | 'bank_transfer' | 'card';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  processingTime: string;
  fees: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'wallet',
    name: 'Wallet Balance',
    description: 'Pay instantly from your wallet balance',
    icon: WalletIcon,
    processingTime: 'Instant confirmation',
    fees: 'No fees',
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency (USDT)',
    description: 'Pay with USDT on Polygon network',
    icon: CurrencyDollarIcon,
    processingTime: 'Instant confirmation',
    fees: 'Low network fees (~$0.01)',
  },
  // {
  //   id: 'bank_transfer',
  //   name: 'Bank Transfer',
  //   description: 'Direct bank transfer via Paystack',
  //   icon: BanknotesIcon,
  //   processingTime: '5-10 minutes',
  //   fees: 'No additional fees',
  // },
  // {
  //   id: 'card',
  //   name: 'Debit/Credit Card',
  //   description: 'Pay with your debit or credit card',
  //   icon: CreditCardIcon,
  //   processingTime: 'Instant confirmation',
  //   fees: 'Standard processing fees',
  // },
];

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Payment Method</h3>
        <p className="text-sm text-gray-600">
          You can switch payment methods at any time before completing the payment
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paymentMethods.map(method => {
          const isSelected = selectedMethod === method.id;
          const IconComponent = method.icon;

          return (
            <button
              key={method.id}
              onClick={() => onMethodChange(method.id)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div
                  className={`
                  p-2 rounded-lg 
                  ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                `}
                >
                  <IconComponent
                    className={`
                    h-6 w-6 
                    ${isSelected ? 'text-blue-600' : 'text-gray-600'}
                  `}
                  />
                </div>

                <div className="flex-1">
                  <h4
                    className={`
                    font-medium text-base
                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                  `}
                  >
                    {method.name}
                  </h4>
                  <p
                    className={`
                    text-sm mt-1
                    ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                  `}
                  >
                    {method.description}
                  </p>

                  <div className="flex justify-between items-center mt-3 text-xs">
                    <span
                      className={`
                      px-2 py-1 rounded-full
                      ${isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}
                    `}
                    >
                      {method.processingTime}
                    </span>
                    <span
                      className={`
                      ${isSelected ? 'text-blue-600' : 'text-gray-500'}
                    `}
                    >
                      {method.fees}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedMethod === 'wallet' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Instant Payment:</strong> Pay directly from your wallet balance. If you have
            sufficient funds in the required currency, payment will be processed instantly.
          </p>
        </div>
      )}

      {selectedMethod === 'crypto' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Only send USDT on Polygon network. Sending other tokens or
            using wrong network will result in loss of funds.
          </p>
        </div>
      )}

      {(selectedMethod === 'bank_transfer' || selectedMethod === 'card') && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Secure Payment:</strong> All payments are processed securely through Paystack.
            Your payment information is encrypted and never stored on our servers.
          </p>
        </div>
      )}
    </div>
  );
}
