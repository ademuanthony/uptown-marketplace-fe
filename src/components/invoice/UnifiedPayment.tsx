'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCodeSVG from 'react-qr-code';
import {
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PaymentMethodSelector, { PaymentMethod } from './PaymentMethodSelector';
import WalletPaymentModal from './WalletPaymentModal';
import invoiceService, { Invoice } from '@/services/invoice';
import { Money } from '@/types/api';

interface UnifiedPaymentProps {
  invoiceId: string;
  totalAmount: Money;
  userEmail: string;
  onPaymentComplete?: () => void;
}

// Backend response type (snake_case)
interface BackendPaymentResponse {
  transaction_id: string;
  provider: string;
  provider_reference: string;
  authorization_url?: string;
  client_secret?: string;
  status: string;
  amount: {
    amount: number;
    currency: string;
    display: string;
  };
  expires_at?: string;
  instructions: {
    provider: string;
    method: string;
    instructions: string[];
    testCards?: Array<{
      number: string;
      brand: string;
      cvv: string;
      expiry: string;
      purpose: string;
    }>;
  };
  // Crypto-specific fields
  wallet_address?: string;
  network?: string;
  qr_code?: string;
  required_confirmations?: number;
}

interface PaymentDetails {
  transactionId: string;
  provider: string;
  providerReference: string;
  authorizationUrl?: string;
  clientSecret?: string;
  status: string;
  amount: {
    amount: number;
    currency: string;
    display: string;
  };
  expiresAt?: string;
  instructions: {
    provider: string;
    method: string;
    instructions: string[];
    testCards?: Array<{
      number: string;
      brand: string;
      cvv: string;
      expiry: string;
      purpose: string;
    }>;
  };
  // Crypto-specific fields
  walletAddress?: string;
  network?: string;
  qrCode?: string;
  requiredConfirms?: number;
}

interface BackendPaymentStatus {
  transaction_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: {
    amount: number;
    currency: string;
    display: string;
  };
  fee?: {
    amount: number;
    currency: string;
    display: string;
  };
}

interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: {
    amount: number;
    currency: string;
    display: string;
  };
  fee?: {
    amount: number;
    currency: string;
    display: string;
  };
  providerData?: Record<string, unknown>;
  processedAt?: string;
  walletCredited: boolean;
}

export default function UnifiedPayment({
  invoiceId,
  totalAmount,
  userEmail,
  onPaymentComplete,
}: UnifiedPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wallet');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Determine return URL for traditional payments
  const returnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invoice/${invoiceId}/payment-callback`
      : undefined;

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Check payment status
  const checkPaymentStatus = useCallback(
    async (reference?: string) => {
      if (!paymentDetails && !reference) return;

      const paymentRef = reference || paymentDetails?.providerReference;
      if (!paymentRef) return;

      setChecking(true);
      try {
        const data = await invoiceService.checkPaymentStatus(invoiceId, paymentRef);
        if (data) {
          // Cast to backend response type
          const statusData = data as BackendPaymentStatus;

          // Map backend response to frontend interface
          const mappedStatus: PaymentStatus = {
            transactionId: statusData.transaction_id,
            status: statusData.status,
            amount: statusData.amount,
            fee: statusData.fee,
            walletCredited: false, // Default value, update based on actual backend response if available
          };

          setPaymentStatus(mappedStatus);

          // Check if payment is completed
          if (statusData.status === 'completed') {
            stopPolling();
            toast.success('Payment completed successfully!');
            if (onPaymentComplete) {
              onPaymentComplete();
            }
          } else if (statusData.status === 'processing') {
            toast.loading('Payment is being processed...');
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      } finally {
        setChecking(false);
      }
    },
    [invoiceId, paymentDetails, onPaymentComplete, stopPolling],
  );

  // Start polling for payment status (crypto payments)
  const startPolling = (reference: string) => {
    // Initial check
    checkPaymentStatus(reference);

    // Poll every 10 seconds
    const interval = setInterval(() => {
      checkPaymentStatus(reference);
    }, 10000);

    setPollingInterval(interval);
  };

  // Load invoice data on component mount
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const invoiceData = await invoiceService.getInvoice(invoiceId);
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Failed to load invoice:', error);
        toast.error('Failed to load invoice details');
      }
    };

    loadInvoice();
  }, [invoiceId]);

  // Initiate payment with selected method
  const initiatePayment = async () => {
    if (selectedMethod === 'wallet') {
      // For wallet payments, show the wallet modal instead
      setShowWalletModal(true);
      return;
    }

    setLoading(true);
    try {
      // Call the invoice service for non-wallet payments
      const data = await invoiceService.initiatePayment(invoiceId, selectedMethod, userEmail, {
        network: selectedMethod === 'crypto' ? 'polygon' : undefined,
        returnUrl: selectedMethod !== 'crypto' ? returnUrl : undefined,
      });
      if (data) {
        console.info('Payment response from backend:', data); // Debug log

        // Cast to backend response type
        const backendData = data as BackendPaymentResponse;

        // Map snake_case backend response to camelCase frontend interface
        const mappedData: PaymentDetails = {
          transactionId: backendData.transaction_id,
          provider: backendData.provider,
          providerReference: backendData.provider_reference,
          authorizationUrl: backendData.authorization_url,
          clientSecret: backendData.client_secret,
          status: backendData.status,
          amount: backendData.amount,
          expiresAt: backendData.expires_at,
          instructions: backendData.instructions,
          // Crypto-specific fields
          walletAddress: backendData.wallet_address,
          network: backendData.network,
          qrCode: backendData.qr_code,
          requiredConfirms: backendData.required_confirmations,
        };

        console.info('Mapped payment data:', mappedData); // Debug log
        setPaymentDetails(mappedData);

        // Handle different payment methods
        if (selectedMethod === 'crypto') {
          startPolling(mappedData.providerReference);
        } else if (selectedMethod === 'bank_transfer' || selectedMethod === 'card') {
          // For Paystack, redirect to authorization URL
          if (mappedData.authorizationUrl) {
            window.location.href = mappedData.authorizationUrl;
            return;
          }
        }
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
      console.error('Payment initiation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Copy wallet address to clipboard (crypto payments)
  const copyToClipboard = async () => {
    if (!paymentDetails?.walletAddress) return;

    try {
      await navigator.clipboard.writeText(paymentDetails.walletAddress);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  // Handle payment method change
  const handleMethodChange = (method: PaymentMethod) => {
    // Clear existing payment details when switching methods
    if (selectedMethod !== method) {
      setPaymentDetails(null);
      setPaymentStatus(null);
      stopPolling();
    }
    setSelectedMethod(method);
  };

  // Go back to method selection
  const goBackToSelection = () => {
    setPaymentDetails(null);
    setPaymentStatus(null);
    stopPolling();
  };

  // Handle wallet payment success
  const handleWalletPaymentSuccess = (updatedInvoice: Invoice) => {
    setInvoice(updatedInvoice);
    setShowWalletModal(false);
    toast.success('Invoice paid successfully with wallet!');
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopPolling();
    },
    [stopPolling],
  );

  // Handle payment callback (for traditional payments)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const status = urlParams.get('status');

    if (reference && status) {
      // Payment callback received, check status
      checkPaymentStatus(reference);
    }
  }, [checkPaymentStatus]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {!paymentDetails ? (
        // Payment method selection
        <>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Payment</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount to Pay</span>
                <span className="text-2xl font-bold text-gray-900">{totalAmount.display}</span>
              </div>
            </div>
          </div>

          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onMethodChange={handleMethodChange}
            disabled={loading}
          />

          <button
            onClick={initiatePayment}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Initiating Payment...
              </span>
            ) : (
              `Pay with ${
                selectedMethod === 'wallet'
                  ? 'Wallet Balance'
                  : selectedMethod === 'crypto'
                    ? 'Cryptocurrency'
                    : selectedMethod === 'bank_transfer'
                      ? 'Bank Transfer'
                      : 'Card'
              }`
            )}
          </button>
        </>
      ) : (
        // Payment details view
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedMethod === 'crypto'
                ? 'Crypto Payment'
                : selectedMethod === 'bank_transfer'
                  ? 'Bank Transfer'
                  : 'Card Payment'}
            </h3>
            <button
              onClick={goBackToSelection}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Change Method
            </button>
          </div>

          {selectedMethod === 'crypto' && paymentDetails.walletAddress && (
            // Crypto payment view
            <div>
              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 mb-1">Amount to Pay</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(paymentDetails.amount.amount / 1000000).toFixed(2)} USDT
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                  <span>
                    on {paymentDetails.network?.charAt(0).toUpperCase()}
                    {paymentDetails.network?.slice(1)} Network
                  </span>
                  {paymentDetails.requiredConfirms && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {paymentDetails.requiredConfirms} confirmations required
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-4">
                <div className="text-sm text-gray-600 mb-2">Scan with your wallet app</div>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <QRCodeSVG
                    value={paymentDetails.qrCode || paymentDetails.walletAddress}
                    size={200}
                    level="H"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  QR code includes amount, token, and network information
                </div>
              </div>

              {/* Wallet Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send USDT or POL to this Address
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
                    title="Copy address"
                  >
                    {copied ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Details Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-blue-900">Payment Summary</span>
                </div>
                <div className="text-sm text-blue-800 space-y-1 ml-4">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-mono">
                      {(paymentDetails.amount.amount / 1000000).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span className="capitalize">{paymentDetails.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token:</span>
                    <span>USDT (Tether USD)</span>
                  </div>
                </div>
              </div>

              {/* Test Mode Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                  <div className="text-sm">
                    <div className="font-medium text-orange-800">Demo Mode</div>
                    <div className="text-orange-700">
                      This is a placeholder address for testing. Do not send real funds.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(selectedMethod === 'bank_transfer' || selectedMethod === 'card') && (
            // Traditional payment view
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <ArrowTopRightOnSquareIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-blue-900">Redirecting to Paystack</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Complete your payment securely through Paystack&apos;s platform
                    </div>
                  </div>
                </div>
              </div>

              {paymentDetails.authorizationUrl && (
                <a
                  href={paymentDetails.authorizationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                  Complete Payment on Paystack
                </a>
              )}
            </div>
          )}

          {/* Payment Status */}
          {paymentStatus && (
            <div
              className={`rounded-lg p-4 mb-4 ${
                paymentStatus.status === 'completed'
                  ? 'bg-green-50'
                  : paymentStatus.status === 'processing'
                    ? 'bg-yellow-50'
                    : paymentStatus.status === 'failed'
                      ? 'bg-red-50'
                      : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                {paymentStatus.status === 'completed' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
                ) : paymentStatus.status === 'processing' ? (
                  <ClockIcon className="h-6 w-6 text-yellow-500 mr-3 animate-pulse" />
                ) : paymentStatus.status === 'failed' ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                ) : (
                  <ArrowPathIcon className="h-6 w-6 text-gray-500 mr-3 animate-spin" />
                )}

                <div className="flex-1">
                  <div className="font-medium">
                    {paymentStatus.status === 'completed'
                      ? 'Payment Completed!'
                      : paymentStatus.status === 'processing'
                        ? 'Payment Processing...'
                        : paymentStatus.status === 'failed'
                          ? 'Payment Failed'
                          : 'Waiting for Payment...'}
                  </div>

                  {paymentStatus.processedAt && (
                    <div className="text-sm text-gray-600 mt-1">
                      Processed: {new Date(paymentStatus.processedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual Check Button */}
          {selectedMethod === 'crypto' && paymentStatus?.status !== 'completed' && (
            <button
              onClick={() => checkPaymentStatus()}
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
            <p className="font-medium mb-2">Payment Instructions:</p>
            {selectedMethod === 'crypto' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ol className="list-decimal list-inside space-y-2 text-yellow-800">
                  <li>
                    <strong>
                      Send exactly {(paymentDetails.amount.amount / 1000000).toFixed(2)} USDT
                    </strong>{' '}
                    to the address above
                  </li>
                  <li>
                    Use the <strong>{paymentDetails.network?.toUpperCase()} network</strong> - other
                    networks will result in lost funds
                  </li>
                  <li>Scan the QR code with your wallet app for automatic setup</li>
                  <li>
                    Payment will be confirmed after{' '}
                    <strong>{paymentDetails.requiredConfirms} confirmations</strong>
                  </li>
                  <li>
                    <strong>Do not send from exchanges</strong> - use a personal wallet only
                  </li>
                  <li>Payment must be received within the time limit to avoid expiration</li>
                </ol>
              </div>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                {paymentDetails.instructions.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {/* Wallet Payment Modal */}
      {invoice && (
        <WalletPaymentModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          invoice={invoice}
          onPaymentSuccess={handleWalletPaymentSuccess}
        />
      )}
    </div>
  );
}
