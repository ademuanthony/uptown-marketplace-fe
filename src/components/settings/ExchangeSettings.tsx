'use client';

import { useState, useEffect } from 'react';
import { TrashIcon, PlusIcon, BeakerIcon, LinkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import SettingsCard from './SettingsCard';
import AddExchangeModal from './AddExchangeModal';
import { exchangeService, MaskedExchangeCredentials } from '@/services/exchange';

export default function ExchangeSettings() {
  const [exchanges, setExchanges] = useState<MaskedExchangeCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadExchanges = async () => {
    setIsLoading(true);
    try {
      const data = await exchangeService.getExchangeCredentials();
      setExchanges(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load exchanges';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExchanges();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exchange configuration?')) {
      return;
    }

    setDeletingId(id);
    try {
      await exchangeService.deleteExchangeCredentials(id);
      toast.success('Exchange configuration deleted successfully');
      await loadExchanges();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete exchange';
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const result = await exchangeService.testExchangeConnection(id);
      if (result.success) {
        toast.success('Connection successful!');
      } else {
        toast.error(result.message || 'Connection failed');
      }
      await loadExchanges(); // Reload to update connection status
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test connection';
      toast.error(errorMessage);
    } finally {
      setTestingId(null);
    }
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getExchangeDisplayName = (exchange: string) => {
    const displayNames: Record<string, string> = {
      binance: 'Binance',
      bybit: 'Bybit',
      hyperliquid: 'Hyperliquid',
      okx: 'OKX',
      bitget: 'Bitget',
    };
    return displayNames[exchange] || exchange;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Exchange Configurations</h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage your exchange API connections for trading bots and portfolio tracking.
        </p>

        <SettingsCard
          title="Connected Exchanges"
          icon={<LinkIcon className="h-5 w-5" />}
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Exchange
            </button>
          }
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : exchanges.length === 0 ? (
            <div className="text-center py-8">
              <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exchanges connected</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first exchange.</p>
              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Exchange
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {exchanges.map(exchange => (
                <div
                  key={exchange.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getConnectionStatusIcon(exchange.connection_status)}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {exchange.account_name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {getExchangeDisplayName(exchange.exchange)}
                          </span>
                          {exchange.is_testnet && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Testnet
                            </span>
                          )}
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            API Key: {exchange.masked_api_key}
                          </span>
                        </div>
                        {exchange.last_connected && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last connected: {new Date(exchange.last_connected).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestConnection(exchange.id)}
                        disabled={testingId === exchange.id}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testingId === exchange.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-700 mr-2"></div>
                            Testing...
                          </>
                        ) : (
                          <>
                            <BeakerIcon className="h-4 w-4 mr-1" />
                            Test
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(exchange.id)}
                        disabled={deletingId === exchange.id}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === exchange.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700 mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {exchange.permissions && exchange.permissions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {exchange.permissions.map(permission => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SettingsCard>

        {isModalOpen && (
          <AddExchangeModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={loadExchanges}
          />
        )}
      </div>
    </div>
  );
}