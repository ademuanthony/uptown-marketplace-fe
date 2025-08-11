'use client';

import { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { DepositCurrency as Currency, NetworkType } from '../../services/deposits';
import withdrawalService, {
  WithdrawalRequest,
  NetworkFee,
  WithdrawalLimits,
  AddressBookEntry,
} from '../../services/withdrawals';
import walletService from '../../services/wallet';

interface WithdrawalFormProps {
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
  initialCurrency?: Currency;
  className?: string;
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({
  onSuccess,
  onCancel,
  initialCurrency = 'USDT',
  className = '',
}) => {
  const [formData, setFormData] = useState<Partial<WithdrawalRequest>>({
    currency: initialCurrency,
    amount: 0,
    recipient_address: '',
    network: 'polygon',
    description: '',
  });

  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [networkFee, setNetworkFee] = useState<NetworkFee | null>(null);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingFee, setLoadingFee] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [addressValidation, setAddressValidation] = useState<{
    is_valid: boolean;
    warnings?: string[];
  } | null>(null);

  const [showAddressBook, setShowAddressBook] = useState(false);
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  const [addressBookName, setAddressBookName] = useState('');

  const supportedCurrencies: Currency[] = ['USDT', 'POL'];
  const supportedNetworks = withdrawalService.getSupportedWithdrawalMethods();

  const loadInitialData = async () => {
    try {
      const [balanceData, addressBookData] = await Promise.all([
        walletService.getWalletSummary(),
        withdrawalService.getAddressBook(),
      ]);

      // Find the wallet for the selected currency
      const wallet = balanceData.wallets.find(w => w.currency === formData.currency);
      setAvailableBalance(wallet ? wallet.available.display : 0);

      setAddressBook(addressBookData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadWithdrawalLimits = async () => {
    if (!formData.currency) return;

    try {
      const limitsData = await withdrawalService.getWithdrawalLimits(formData.currency);
      setLimits(limitsData);
    } catch (err) {
      console.error('Failed to load withdrawal limits:', err);
    }
  };

  const loadNetworkFee = async () => {
    if (!formData.currency || !formData.network || !formData.amount) return;

    try {
      setLoadingFee(true);
      const fee = await withdrawalService.getNetworkFee(
        formData.currency,
        formData.network,
        formData.amount,
      );
      setNetworkFee(fee);
    } catch (err) {
      console.error('Failed to load network fee:', err);
    } finally {
      setLoadingFee(false);
    }
  };

  const validateAddress = async () => {
    if (!formData.recipient_address || !formData.network || !formData.currency) return;

    try {
      const validation = await withdrawalService.validateWithdrawalAddress(
        formData.recipient_address,
        formData.currency,
        formData.network,
      );
      setAddressValidation(validation);
    } catch (err) {
      console.error('Address validation failed:', err);
      setAddressValidation({ is_valid: false, warnings: ['Address validation failed'] });
    }
  };

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.currency) {
      loadWithdrawalLimits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.currency]);

  useEffect(() => {
    if (formData.currency && formData.network && formData.amount && formData.amount > 0) {
      loadNetworkFee();
    } else {
      setNetworkFee(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.currency, formData.network, formData.amount]);

  useEffect(() => {
    if (formData.recipient_address && formData.network && formData.currency) {
      validateAddress();
    } else {
      setAddressValidation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.recipient_address, formData.network]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount is required and must be positive';
    } else if (limits && formData.amount < limits.minimum_amount) {
      errors.amount = `Minimum withdrawal is ${limits.minimum_amount} ${formData.currency}`;
    } else if (limits && formData.amount > limits.maximum_amount) {
      errors.amount = `Maximum withdrawal is ${limits.maximum_amount} ${formData.currency}`;
    } else if (formData.amount > availableBalance) {
      errors.amount = 'Insufficient balance';
    } else if (limits && formData.amount > limits.remaining_today) {
      errors.amount = `Daily limit exceeded. Remaining: ${limits.remaining_today} ${formData.currency}`;
    }

    if (!formData.recipient_address) {
      errors.recipient_address = 'Recipient address is required';
    } else if (addressValidation && !addressValidation.is_valid) {
      errors.recipient_address = 'Invalid address format';
    }

    if (!formData.network) {
      errors.network = 'Network is required';
    }

    if (saveToAddressBook && !addressBookName.trim()) {
      errors.addressBookName = 'Please provide a name for the address book entry';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: WithdrawalRequest = {
        currency: formData.currency!,
        amount: formData.amount!,
        recipient_address: formData.recipient_address!,
        network: formData.network!,
        description: formData.description || `${formData.currency} withdrawal`,
      };

      const withdrawal = await withdrawalService.createWithdrawal(request);

      // Save to address book if requested
      if (saveToAddressBook && addressBookName.trim()) {
        try {
          await withdrawalService.addToAddressBook(
            addressBookName.trim(),
            formData.recipient_address!,
            formData.currency!,
            formData.network!,
          );
        } catch (err) {
          console.warn('Failed to save to address book:', err);
        }
      }

      if (onSuccess) {
        onSuccess(withdrawal.id);
      }
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof WithdrawalRequest,
    value: string | number | undefined,
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const selectFromAddressBook = (entry: AddressBookEntry) => {
    setFormData(prev => ({
      ...prev,
      recipient_address: entry.address,
      network: entry.network,
      currency: entry.currency,
    }));
    setShowAddressBook(false);
  };

  const getAvailableNetworks = () => {
    const currencyMethods = supportedNetworks.find(m => m.currency === formData.currency);
    return currencyMethods?.networks || [];
  };

  const getTotalAmount = () => {
    if (!formData.amount || !networkFee) return 0;
    return formData.amount + networkFee.fee_amount;
  };

  const getCurrencyIcon = (currency: Currency) => {
    const icons = {
      USDT: '💰',
      POL: '🔷',
      USD: '💵',
    };
    return icons[currency] || '💰';
  };

  const getNetworkColor = (network: NetworkType) => {
    const colors = {
      polygon: 'text-purple-600',
      ethereum: 'text-blue-600',
      bsc: 'text-yellow-600',
      arbitrum: 'text-blue-600',
      optimism: 'text-red-600',
      avalanche: 'text-red-600',
    };
    return colors[network] || 'text-gray-600';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <CurrencyDollarIcon className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
          <p className="text-sm text-gray-600">Send cryptocurrency to external wallet</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Withdrawal Failed</h4>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Currency</label>
          <div className="grid grid-cols-2 gap-3">
            {supportedCurrencies.map(currency => (
              <button
                key={currency}
                type="button"
                onClick={() => handleInputChange('currency', currency)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.currency === currency
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCurrencyIcon(currency)}</span>
                  <span className="font-medium">{currency}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Network Selection */}
        {formData.currency && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Network</label>
            <div className="space-y-2">
              {getAvailableNetworks().map(network => (
                <label key={network.network} className="flex items-center">
                  <input
                    type="radio"
                    name="network"
                    value={network.network}
                    checked={formData.network === network.network}
                    onChange={e => handleInputChange('network', e.target.value as NetworkType)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex items-center justify-between w-full">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{network.name}</span>
                      <span className={`ml-2 text-xs ${getNetworkColor(network.network)}`}>
                        Min: {network.min_amount} {formData.currency}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{network.fee_estimate}</span>
                  </div>
                </label>
              ))}
            </div>
            {validationErrors.network && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.network}</p>
            )}
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              min="0"
              value={formData.amount || ''}
              onChange={e => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              placeholder={`Enter amount in ${formData.currency}`}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-sm text-gray-500">{formData.currency}</span>
            </div>
          </div>
          {validationErrors.amount && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.amount}</p>
          )}
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>
              Available: {availableBalance.toFixed(6)} {formData.currency}
            </span>
            {limits && (
              <span>
                Daily limit: {limits.remaining_today.toFixed(6)} {formData.currency}
              </span>
            )}
          </div>
        </div>

        {/* Recipient Address */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
            <button
              type="button"
              onClick={() => setShowAddressBook(!showAddressBook)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <BookOpenIcon className="h-4 w-4" />
              <span>Address Book</span>
            </button>
          </div>

          {showAddressBook && addressBook.length > 0 && (
            <div className="mb-3 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {addressBook
                  .filter(entry => entry.currency === formData.currency)
                  .map(entry => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => selectFromAddressBook(entry)}
                      className="w-full text-left p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{entry.name}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            {entry.address.substring(0, 20)}...
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{entry.network}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={formData.recipient_address || ''}
            onChange={e => handleInputChange('recipient_address', e.target.value)}
            placeholder="Enter recipient wallet address"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />

          {validationErrors.recipient_address && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.recipient_address}</p>
          )}

          {addressValidation && (
            <div
              className={`mt-2 flex items-start space-x-2 text-sm ${
                addressValidation.is_valid ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {addressValidation.is_valid ? (
                <CheckIcon className="h-4 w-4 mt-0.5" />
              ) : (
                <XMarkIcon className="h-4 w-4 mt-0.5" />
              )}
              <div>
                <span>{addressValidation.is_valid ? 'Valid address' : 'Invalid address'}</span>
                {addressValidation.warnings &&
                  addressValidation.warnings.map((warning, index) => (
                    <div key={index} className="text-yellow-600">
                      {warning}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Save to Address Book */}
        {formData.recipient_address && addressValidation?.is_valid && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={saveToAddressBook}
                onChange={e => setSaveToAddressBook(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Save to address book</span>
            </label>

            {saveToAddressBook && (
              <div className="mt-3">
                <input
                  type="text"
                  value={addressBookName}
                  onChange={e => setAddressBookName(e.target.value)}
                  placeholder="Enter a name for this address"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {validationErrors.addressBookName && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.addressBookName}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={formData.description || ''}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Add a note for this withdrawal"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Fee Information */}
        {networkFee && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-blue-800">Transaction Summary</h4>
                <div className="space-y-1 text-blue-700">
                  <div className="flex justify-between">
                    <span>Withdrawal Amount:</span>
                    <span>
                      {formData.amount} {formData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fee:</span>
                    <span>
                      {networkFee.fee_amount} {networkFee.fee_currency}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-blue-200 pt-1">
                    <span>Total Deducted:</span>
                    <span>
                      {getTotalAmount().toFixed(6)} {formData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Time:</span>
                    <span className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {networkFee.estimated_time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingFee && (
          <div className="text-center py-2">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Calculating network fees...</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading || loadingFee || !formData.amount || !formData.recipient_address}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Withdraw ${formData.currency || 'Crypto'}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WithdrawalForm;
