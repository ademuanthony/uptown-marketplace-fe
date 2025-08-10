'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import invoiceService, { Invoice, AvailableBalance } from '../../services/invoice';

interface WalletPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onPaymentSuccess: (invoice: Invoice) => void;
}

const WalletPaymentModal: React.FC<WalletPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableBalances();
    }
  }, [isOpen]);

  const loadAvailableBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const balances = await invoiceService.getAvailableBalances();
      setAvailableBalances(balances);
      
      // Auto-select the best currency for payment
      const matchingCurrency = balances.find(b => 
        b.currency === invoice.currency && canPayWithCurrency(b)
      );
      const sufficientUSDBalance = balances.find(b => canPayWithCurrency(b));
      
      if (matchingCurrency) {
        // Prefer exact currency match with sufficient balance
        setSelectedCurrency(matchingCurrency.currency);
      } else if (sufficientUSDBalance) {
        // Use any currency with sufficient USD value
        setSelectedCurrency(sufficientUSDBalance.currency);
      } else if (balances.length > 0) {
        // Default to first available balance
        setSelectedCurrency(balances[0].currency);
      }
    } catch (err) {
      console.error('Failed to load available balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet balances');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedCurrency) {
      setError('Please select a payment currency');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      
      const result = await invoiceService.payWithWallet(invoice.id, selectedCurrency);
      
      if (result.success) {
        onPaymentSuccess(result.invoice);
        onClose();
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(numAmount);
    }
    return `${numAmount.toLocaleString()} ${currency}`;
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USD':
        return '💵';
      case 'USDT':
        return '₮';
      case 'POL':
        return '🔷';
      default:
        return '💰';
    }
  };

  const canPayWithCurrency = (balance: AvailableBalance) => {
    // Convert invoice amount to USD for comparison
    const invoiceAmountUSD = invoice.total_amount.amount / 10000; // Convert cents to dollars
    
    if (balance.currency === invoice.currency) {
      // Same currency - direct comparison
      const availableAmount = parseFloat(balance.balance);
      const invoiceAmount = parseFloat(invoice.total_amount.display.replace(/[^0-9.-]+/g, ''));
      return availableAmount >= invoiceAmount;
    } else if (invoice.currency === 'USD' || invoice.currency === 'usd') {
      // Invoice is in USD, compare with wallet's USD value
      return balance.usd_value >= invoiceAmountUSD;
    } else {
      // Different currencies - use USD value for cross-currency comparison
      // This allows payment with any currency that has sufficient USD equivalent value
      return balance.usd_value >= invoiceAmountUSD;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CreditCardIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pay with Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={processing}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Invoice Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice #{invoice.number}</span>
                <span className="font-medium text-gray-900">{invoice.total_amount.display}</span>
              </div>
              <div className="text-gray-600">{invoice.title}</div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading wallet balances...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Wallet Selection */}
          {!loading && availableBalances.length === 0 && (
            <div className="text-center py-8">
              <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Balance</h3>
              <p className="text-gray-600">
                You don&apos;t have any available wallet balance to pay this invoice.
                Please deposit funds to your wallet first.
              </p>
            </div>
          )}

          {!loading && availableBalances.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Select Payment Method</h3>
                {invoice.currency !== 'USD' && (
                  <p className="text-xs text-gray-600 mt-1">
                    You can pay with any currency that has sufficient USD equivalent value
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                {availableBalances.map((balance) => {
                  const canPay = canPayWithCurrency(balance);
                  return (
                    <div
                      key={balance.currency}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCurrency === balance.currency
                          ? 'border-blue-500 bg-blue-50'
                          : canPay
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      }`}
                      onClick={() => canPay && setSelectedCurrency(balance.currency)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCurrencyIcon(balance.currency)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{balance.currency} Wallet</div>
                            <div className="text-sm text-gray-600">
                              Balance: {formatCurrency(balance.balance, balance.currency)}
                            </div>
                            {balance.usd_value > 0 && (
                              <div className="text-xs text-gray-500">
                                ≈ ${balance.usd_value.toFixed(2)} USD
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {canPay ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                          )}
                          
                          {selectedCurrency === balance.currency && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!canPay && (
                        <div className="mt-2 text-xs text-yellow-700">
                          {balance.currency === invoice.currency 
                            ? 'Insufficient balance for this invoice'
                            : `Insufficient USD value: $${balance.usd_value.toFixed(2)} available, $${(invoice.total_amount.amount / 100).toFixed(2)} required`
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Button */}
          {!loading && availableBalances.length > 0 && (
            <div className="mt-6 flex space-x-3">
              <button
                onClick={onClose}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handlePayment}
                disabled={!selectedCurrency || processing}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="h-4 w-4" />
                    <span>Pay Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPaymentModal;