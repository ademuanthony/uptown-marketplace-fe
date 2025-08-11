'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  XMarkIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { DepositCurrency, NetworkType } from '../../services/deposits';
import depositService from '../../services/deposits';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCurrency?: DepositCurrency;
  initialNetwork?: NetworkType;
}

interface NetworkOption {
  id: number;
  name: string;
  type: NetworkType;
  currencies: DepositCurrency[];
}

const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  initialCurrency = 'USDT',
  initialNetwork = 'polygon',
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<DepositCurrency>(initialCurrency);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>(initialNetwork);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [networks] = useState<NetworkOption[]>(depositService.getSupportedNetworks());

  useEffect(() => {
    if (isOpen) {
      generateDepositAddress();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedCurrency, selectedNetwork]);

  const generateDepositAddress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDepositAddress('');
      setQrCodeDataUrl('');
      
      console.log('Generating deposit address for:', selectedCurrency, selectedNetwork);
      
      const network = networks.find(n => n.type === selectedNetwork);
      if (!network) {
        throw new Error(`Unsupported network: ${selectedNetwork}`);
      }

      console.log('Using network:', network);
      const address = await depositService.getOrCreateDepositAddress(selectedCurrency, network.id);
      console.log('Received deposit address:', address);
      
      if (!address || !address.address) {
        throw new Error('No address returned from server');
      }
      
      setDepositAddress(address.address);

      // Generate QR code
      console.log('Generating QR code for address:', address.address);
      const qrCode = await depositService.generateDepositQRCode(
        address.address,
        selectedCurrency,
        selectedNetwork,
      );
      console.log('Generated QR code:', qrCode);
      setQrCodeDataUrl(qrCode.qr_code_data_url);
    } catch (err) {
      console.error('Failed to generate deposit address:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate deposit address';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedCurrency, selectedNetwork, networks]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleCurrencyChange = (currency: DepositCurrency) => {
    setSelectedCurrency(currency);
    
    // Find a compatible network for this currency
    const compatibleNetwork = networks.find(n => n.currencies.includes(currency));
    if (compatibleNetwork && compatibleNetwork.type !== selectedNetwork) {
      setSelectedNetwork(compatibleNetwork.type);
    }
  };

  const getAvailableNetworks = () => networks.filter(network => network.currencies.includes(selectedCurrency));

  const getCurrentNetwork = () => networks.find(n => n.type === selectedNetwork);

  const getExplorerUrl = () => {
    if (!depositAddress) return '';
    return depositService.getExplorerUrl(selectedNetwork, depositAddress);
  };

  const getDepositInstructions = () => depositService.getDepositInstructions(selectedCurrency, selectedNetwork);

  const getMinimumDeposit = () => depositService.getMinimumDepositAmount(selectedCurrency);

  const getCurrencyIcon = (currency: DepositCurrency) => {
    const icons = {
      USDT: '💰',
      POL: '🔷',
    };
    return icons[currency] || '💰';
  };

  const getNetworkColor = (network: NetworkType) => {
    const colors = {
      polygon: 'text-purple-600 bg-purple-50 border-purple-200',
    };
    return colors[network] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Deposit Cryptocurrency
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Currency Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Currency
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-2 gap-3">
              {['USDT', 'POL'].map(currency => (
                <button
                  key={currency}
                  onClick={() => handleCurrencyChange(currency as DepositCurrency)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedCurrency === currency
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCurrencyIcon(currency as DepositCurrency)}</span>
                    <span className="font-medium">{currency}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Network Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Network
            </label>
            <div className="space-y-2">
              {getAvailableNetworks().map(network => (
                <button
                  key={network.type}
                  onClick={() => setSelectedNetwork(network.type)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedNetwork === network.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{network.name}</div>
                      <div className="text-sm text-gray-500">Chain ID: {network.id}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getNetworkColor(network.type)}`}>
                      {network.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={generateDepositAddress}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Generating deposit address...</span>
              </div>
            </div>
          ) : depositAddress ? (
            <div className="space-y-6">
              {/* QR Code and Address */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex flex-col items-center space-y-4">
                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-lg shadow-md border">
                    {qrCodeDataUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48">
                          <Image
                            src={qrCodeDataUrl}
                            alt="Deposit Address QR Code"
                            fill
                            className="rounded border object-contain"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Scan with your wallet app
                        </p>
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                        <QrCodeIcon className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 text-center">
                          QR Code will appear here
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deposit Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white border-2 border-gray-300 rounded-lg p-4 font-mono text-sm break-all shadow-sm">
                        <div className="text-gray-900 font-medium">
                          {depositAddress || 'Generating address...'}
                        </div>
                      </div>
                      <button
                        onClick={handleCopyAddress}
                        disabled={!depositAddress}
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        title="Copy address to clipboard"
                      >
                        {copied ? (
                          <CheckIcon className="h-5 w-5" />
                        ) : (
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-sm text-green-600 mt-2 font-medium">✓ Address copied to clipboard!</p>
                    )}
                  </div>

                  {/* Explorer Link */}
                  {getExplorerUrl() && (
                    <a
                      href={getExplorerUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <span>View on {getCurrentNetwork()?.name} Explorer</span>
                      <LinkIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Deposit Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-800">Deposit Information</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p><strong>Network:</strong> {getCurrentNetwork()?.name}</p>
                      <p><strong>Currency:</strong> {selectedCurrency}</p>
                      <p><strong>Minimum Deposit:</strong> {getMinimumDeposit()} {selectedCurrency}</p>
                      <p><strong>Processing Time:</strong> 5-30 minutes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-yellow-800">Important Instructions</h4>
                    <ul className="space-y-1 text-sm text-yellow-700">
                      {getDepositInstructions().map((instruction, index) => (
                        <li key={index}>• {instruction}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCopyAddress}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Address
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Generating deposit address...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return modalContent;
};

export default DepositModal;