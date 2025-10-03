'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingButton from './LoadingButton';
import {
  exchangeService,
  CreateExchangeCredentialsInput,
  SupportedExchange,
  ExchangeName,
} from '@/services/exchange';

interface AddExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddExchangeModal({ isOpen, onClose, onSuccess }: AddExchangeModalProps) {
  const [supportedExchanges, setSupportedExchanges] = useState<SupportedExchange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateExchangeCredentialsInput>({
    account_name: '',
    exchange: 'binance' as ExchangeName,
    api_key: '',
    api_secret: '',
    passphrase: '',
    is_testnet: false,
    permissions: [],
  });

  const [selectedExchange, setSelectedExchange] = useState<SupportedExchange | null>(null);

  const loadSupportedExchanges = async () => {
    setIsLoading(true);
    try {
      const exchanges = await exchangeService.getSupportedExchanges();
      setSupportedExchanges(exchanges);
      if (exchanges.length > 0) {
        const firstExchange = exchanges[0];
        if (firstExchange) {
          setSelectedExchange(firstExchange);
          setFormData(prev => ({ ...prev, exchange: firstExchange.name }));
        }
      }
    } catch (_error) {
      toast.error('Failed to load supported exchanges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupportedExchanges();
  }, []);

  useEffect(() => {
    if (supportedExchanges.length > 0) {
      const exchange = supportedExchanges.find(e => e.name === formData.exchange);
      setSelectedExchange(exchange || null);
    }
  }, [formData.exchange, supportedExchanges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.account_name.trim()) {
      toast.error('Account name is required');
      return;
    }
    if (!formData.api_key.trim()) {
      toast.error('API key is required');
      return;
    }
    if (!formData.api_secret.trim()) {
      toast.error('API secret is required');
      return;
    }
    if (selectedExchange?.requires_passphrase && !formData.passphrase?.trim()) {
      toast.error('Passphrase is required for this exchange');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateExchangeCredentialsInput = {
        ...formData,
        passphrase: selectedExchange?.requires_passphrase ? formData.passphrase : undefined,
        permissions: selectedExchange?.permissions || [],
      };

      await exchangeService.createExchangeCredentials(input);
      toast.success('Exchange configuration added successfully');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        account_name: '',
        exchange: 'binance' as ExchangeName,
        api_key: '',
        api_secret: '',
        passphrase: '',
        is_testnet: false,
        permissions: [],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add exchange';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-lg">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Add Exchange Configuration
                    </Dialog.Title>

                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                          <label
                            htmlFor="account_name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Account Name
                          </label>
                          <input
                            type="text"
                            id="account_name"
                            value={formData.account_name}
                            onChange={e =>
                              setFormData(prev => ({ ...prev, account_name: e.target.value }))
                            }
                            placeholder="e.g., Main Trading Account"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-base"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="exchange"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Exchange
                          </label>
                          <select
                            id="exchange"
                            value={formData.exchange}
                            onChange={e =>
                              setFormData(prev => ({
                                ...prev,
                                exchange: e.target.value as ExchangeName,
                              }))
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            {supportedExchanges.map(exchange => (
                              <option key={exchange.name} value={exchange.name}>
                                {exchange.display_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="api_key"
                            className="block text-sm font-medium text-gray-700"
                          >
                            API Key
                          </label>
                          <input
                            type="text"
                            id="api_key"
                            value={formData.api_key}
                            onChange={e =>
                              setFormData(prev => ({ ...prev, api_key: e.target.value }))
                            }
                            placeholder="Enter your API key"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-xs font-mono break-all"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="api_secret"
                            className="block text-sm font-medium text-gray-700"
                          >
                            API Secret
                          </label>
                          <input
                            type="password"
                            id="api_secret"
                            value={formData.api_secret}
                            onChange={e =>
                              setFormData(prev => ({ ...prev, api_secret: e.target.value }))
                            }
                            placeholder="Enter your API secret"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-xs font-mono"
                            required
                          />
                        </div>

                        {selectedExchange?.requires_passphrase && (
                          <div>
                            <label
                              htmlFor="passphrase"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Passphrase
                            </label>
                            <input
                              type="password"
                              id="passphrase"
                              value={formData.passphrase}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, passphrase: e.target.value }))
                              }
                              placeholder="Enter your passphrase"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-xs font-mono"
                              required={selectedExchange?.requires_passphrase}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Required for {selectedExchange?.display_name}
                            </p>
                          </div>
                        )}

                        {selectedExchange?.supports_testnet && (
                          <div className="flex items-center">
                            <input
                              id="is_testnet"
                              type="checkbox"
                              checked={formData.is_testnet}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, is_testnet: e.target.checked }))
                              }
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label
                              htmlFor="is_testnet"
                              className="ml-2 block text-sm text-gray-700"
                            >
                              Use Testnet
                            </label>
                          </div>
                        )}

                        <div className="rounded-md bg-blue-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <InformationCircleIcon
                                className="h-5 w-5 text-blue-400"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">Security Notice</h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc space-y-1 pl-5">
                                  <li>Only use API keys with trading permissions you need</li>
                                  <li>Never share your API keys with anyone</li>
                                  <li>Enable IP whitelist on your exchange if available</li>
                                  <li>Your API keys are encrypted before storage</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                          <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                          <LoadingButton
                            type="submit"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                          >
                            Add Exchange
                          </LoadingButton>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
