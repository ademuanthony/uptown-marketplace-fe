'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCodeSVG from 'react-qr-code';
import { 
  ClipboardDocumentIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CryptoPaymentProps {
  invoiceId: string;
  totalAmount: {
    amount: number;
    currency: string;
    display: string;
  };
  onPaymentComplete?: () => void;
}

interface PaymentDetails {
  walletAddress: string;
  network: string;
  amountUSDT: string;
  amountInWei: string;
  qrCode: string;
  expiresAt: string;
}

interface PaymentStatus {
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  transactionHash?: string;
  confirmations: number;
  requiredConfirmations: number;
  amountReceived?: string;
  verifiedAt?: string;
}

export default function CryptoPayment({ invoiceId, totalAmount, onPaymentComplete }: CryptoPaymentProps) {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  // Fixed to Polygon network
  const selectedNetwork = 'polygon';
  const networkInfo = { 
    id: 'polygon', 
    name: 'Polygon', 
    icon: '🟣', 
    confirmations: 20, 
    fee: 'Low (~$0.01)', 
  };

  // Initiate crypto payment
  const initiatePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/invoices/${invoiceId}/crypto-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          network: selectedNetwork,
          amount: totalAmount.amount,
          email: 'user@example.com', // This would come from user context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Map the new unified payment response to the old format
        const paymentData = {
          walletAddress: data.data.wallet_address,
          network: data.data.network,
          amountUSDT: (data.data.amount.amount / 100).toFixed(2), // Convert cents to dollars
          amountInWei: data.data.amount.amount.toString(),
          qrCode: data.data.qr_code,
          expiresAt: data.data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        setPaymentDetails(paymentData);
        setPaymentReference(data.data.provider_reference);
        startPolling(); // Start polling for payment status
      }
    } catch (error) {
      toast.error('Failed to generate payment address');
      console.error('Payment initiation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentDetails || !paymentReference) return;
    
    setChecking(true);
    try {
      const response = await fetch(`/api/v1/invoices/${invoiceId}/crypto-payment/status?reference=${encodeURIComponent(paymentReference)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Map the unified payment verification response to the old format
        const statusData: PaymentStatus = {
          status: (data.data.status === 'completed' ? 'confirmed' : 
                  data.data.status === 'processing' ? 'confirming' :
                  data.data.status === 'failed' ? 'failed' : 'pending') as 'pending' | 'confirming' | 'confirmed' | 'failed',
          transactionHash: data.data.provider_data?.transaction_hash,
          confirmations: data.data.provider_data?.confirmations || 0,
          requiredConfirmations: 20, // Default for Polygon
          amountReceived: data.data.amount ? (data.data.amount.amount / 100).toFixed(2) : undefined,
          verifiedAt: data.data.processed_at,
        };
        
        setPaymentStatus(statusData);
        
        // Check if payment is confirmed
        if (statusData.status === 'confirmed') {
          stopPolling();
          toast.success('Payment confirmed successfully!');
          if (onPaymentComplete) {
            onPaymentComplete();
          }
        } else if (statusData.status === 'confirming') {
          toast.loading(`Transaction confirming: ${statusData.confirmations}/${statusData.requiredConfirmations} confirmations`);
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
    } finally {
      setChecking(false);
    }
  }, [invoiceId, paymentDetails, paymentReference, onPaymentComplete, stopPolling]);

  // Start polling for payment status
  const startPolling = () => {
    // Initial check
    checkPaymentStatus();
    
    // Poll every 10 seconds
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 10000);
    
    setPollingInterval(interval);
  };

  // Copy wallet address to clipboard
  const copyToClipboard = async () => {
    if (!paymentDetails) return;
    
    try {
      await navigator.clipboard.writeText(paymentDetails.walletAddress);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  // Cleanup on unmount
  useEffect(() => () => {
      stopPolling();
    }, [stopPolling]);

  // Auto-initiate payment on mount
  useEffect(() => {
    // Remove this effect since network is fixed
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pay with USDT on Polygon</h3>
        <p className="text-sm text-gray-600">
          Send USDT on Polygon network to complete the payment • Low fees (~$0.01)
        </p>
      </div>

      {/* Network Info */}
      <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{networkInfo.icon}</span>
          <div>
            <div className="font-medium text-purple-900">{networkInfo.name} Network</div>
            <div className="text-sm text-purple-700">Fast confirmations • {networkInfo.fee}</div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      {!paymentDetails ? (
        <button
          onClick={initiatePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Generating Payment Address...
            </span>
          ) : (
            'Generate Payment Address'
          )}
        </button>
      ) : (
        <div>
          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 mb-1">Amount to Pay</div>
            <div className="text-2xl font-bold text-gray-900">
              {paymentDetails.amountUSDT} USDT
            </div>
            <div className="text-xs text-gray-500 mt-1">
              on {networkInfo.name} Network
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <QRCodeSVG 
                value={paymentDetails.walletAddress}
                size={200}
                level="H"
              />
            </div>
          </div>

          {/* Wallet Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send to Address
            </label>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <input
                type="text"
                readOnly
                value={paymentDetails.walletAddress}
                className="flex-1 bg-transparent text-sm font-mono text-gray-900 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {copied ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus && (
            <div className={`rounded-lg p-4 mb-4 ${
              paymentStatus.status === 'confirmed' ? 'bg-green-50' :
              paymentStatus.status === 'confirming' ? 'bg-yellow-50' :
              paymentStatus.status === 'failed' ? 'bg-red-50' :
              'bg-gray-50'
            }`}>
              <div className="flex items-center">
                {paymentStatus.status === 'confirmed' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                ) : paymentStatus.status === 'confirming' ? (
                  <ClockIcon className="h-6 w-6 text-yellow-500 mr-3 animate-pulse" />
                ) : paymentStatus.status === 'failed' ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                ) : (
                  <ArrowPathIcon className="h-6 w-6 text-gray-500 mr-3 animate-spin" />
                )}
                
                <div className="flex-1">
                  <div className="font-medium">
                    {paymentStatus.status === 'confirmed' ? 'Payment Confirmed!' :
                     paymentStatus.status === 'confirming' ? 'Transaction Confirming...' :
                     paymentStatus.status === 'failed' ? 'Payment Failed' :
                     'Waiting for Payment...'}
                  </div>
                  
                  {paymentStatus.status === 'confirming' && (
                    <div className="text-sm text-gray-600 mt-1">
                      {paymentStatus.confirmations}/{paymentStatus.requiredConfirmations} confirmations
                    </div>
                  )}
                  
                  {paymentStatus.transactionHash && (
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      TX: {paymentStatus.transactionHash.slice(0, 10)}...{paymentStatus.transactionHash.slice(-8)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Check Button */}
          {paymentStatus?.status !== 'confirmed' && (
            <button
              onClick={checkPaymentStatus}
              disabled={checking}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? (
                <span className="flex items-center justify-center">
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Checking Status...
                </span>
              ) : (
                'Check Payment Status'
              )}
            </button>
          )}

          {/* Instructions */}
          <div className="mt-6 text-sm text-gray-600">
            <p className="font-medium mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the wallet address or scan the QR code</li>
              <li>Send exactly <strong>{paymentDetails.amountUSDT} USDT</strong> on Polygon</li>
              <li>Wait for network confirmations ({networkInfo.confirmations} required)</li>
              <li>Payment will be automatically verified</li>
            </ol>
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Important:</strong> Only send USDT on POLYGON network to this address. 
              Sending other tokens or using wrong network will result in loss of funds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}