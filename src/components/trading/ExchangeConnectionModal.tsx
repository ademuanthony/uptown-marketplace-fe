'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { tradingBotService, ExchangeName } from '@/services/tradingBot';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Form validation schema
const exchangeConnectionSchema = z.object({
  exchange: z.enum(['binance', 'bybit', 'okx', 'bitget', 'hyperliquid']),
  accountName: z.string().min(1, 'Account name is required'),
  apiKey: z.string().min(1, 'API Key is required'),
  apiSecret: z.string().min(1, 'API Secret is required'),
  passphrase: z.string().optional(),
  isTestnet: z.boolean().default(false),
  startingBalance: z.number().min(1, 'Starting balance must be at least $1').default(100),
});

type ExchangeConnectionForm = z.infer<typeof exchangeConnectionSchema>;

interface ExchangeConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  botType: 'alpha-compounder' | 'xpat-trader' | null;
}

const exchanges = [
  {
    id: 'binance' as ExchangeName,
    name: 'Binance',
    logo: '🟡',
    description: "World's largest crypto exchange",
    requiresPassphrase: false,
  },
  {
    id: 'bybit' as ExchangeName,
    name: 'Bybit',
    logo: '🟠',
    description: 'Popular derivatives trading platform',
    requiresPassphrase: false,
  },
  {
    id: 'okx' as ExchangeName,
    name: 'OKX',
    logo: '🔵',
    description: 'Leading crypto exchange and Web3 ecosystem',
    requiresPassphrase: true,
  },
  {
    id: 'bitget' as ExchangeName,
    name: 'Bitget',
    logo: '🟢',
    description: 'Copy trading and derivatives platform',
    requiresPassphrase: false,
  },
  {
    id: 'hyperliquid' as ExchangeName,
    name: 'Hyperliquid',
    logo: '🟣',
    description: 'High-performance DEX for perpetuals',
    requiresPassphrase: false,
  },
];

export default function ExchangeConnectionModal({
  isOpen,
  onClose,
  botType,
}: ExchangeConnectionModalProps) {
  const [step, setStep] = useState<'exchange' | 'credentials' | 'testing' | 'setup'>('exchange');
  const [selectedExchange, setSelectedExchange] = useState<ExchangeName | null>(null);
  const [, setIsConnecting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ExchangeConnectionForm>({
    resolver: zodResolver(exchangeConnectionSchema),
    defaultValues: {
      isTestnet: false,
      startingBalance: 100,
    },
  });

  // const watchedExchange = watch('exchange');
  // const watchedIsTestnet = watch('isTestnet');

  const handleExchangeSelect = (exchange: ExchangeName) => {
    setSelectedExchange(exchange);
    setValue('exchange', exchange);
    setStep('credentials');
  };

  const handleBotInitialization = async (data: ExchangeConnectionForm) => {
    if (!botType) return;

    setIsInitializing(true);
    try {
      // First, create exchange credentials (this would need to be implemented)
      // For now, we'll simulate this step
      const mockCredentialsId = 'mock-credentials-id';

      // Initialize the default bot
      const bot = await tradingBotService.initializeDefaultBot({
        exchange_credentials_id: mockCredentialsId,
        bot_type: botType,
        name: `My ${botType === 'alpha-compounder' ? 'Alpha Compounder' : 'XPat Trader'}`,
        starting_balance: data.startingBalance,
      });

      toast.success(
        `${botType === 'alpha-compounder' ? 'Alpha Compounder' : 'XPat Trader'} bot initialized successfully!`,
      );

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['trading-bots'] });
      queryClient.invalidateQueries({ queryKey: ['trading-bots', 'default'] });

      onClose();
      reset();
      setStep('exchange');
      setSelectedExchange(null);

      // Optionally redirect to the bot page
      if (bot?.id) {
        setTimeout(() => {
          window.location.href = `/trading-bots/${bot.id}`;
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initialize bot');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCredentialsSubmit = async (data: ExchangeConnectionForm) => {
    if (step === 'credentials') {
      setStep('testing');
      setIsConnecting(true);

      try {
        // Simulate connection testing (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsConnecting(false);
        setStep('setup');
      } catch (_error) {
        setIsConnecting(false);
        setStep('credentials');
        toast.error('Failed to connect to exchange. Please check your credentials.');
      }
    } else if (step === 'setup') {
      await handleBotInitialization(data);
    }
  };

  const handleBack = () => {
    if (step === 'credentials') {
      setStep('exchange');
      setSelectedExchange(null);
    } else if (step === 'setup') {
      setStep('credentials');
    }
  };

  const handleModalClose = () => {
    onClose();
    reset();
    setStep('exchange');
    setSelectedExchange(null);
  };

  const selectedExchangeInfo = exchanges.find(ex => ex.id === selectedExchange);

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} size="lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'exchange' && 'Choose Exchange'}
            {step === 'credentials' && 'Connect Exchange'}
            {step === 'testing' && 'Testing Connection'}
            {step === 'setup' &&
              `Setup ${botType === 'alpha-compounder' ? 'Alpha Compounder' : 'XPat Trader'}`}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {step === 'exchange' && 'Select your preferred cryptocurrency exchange'}
            {step === 'credentials' &&
              'Enter your API credentials to connect your exchange account'}
            {step === 'testing' && 'Verifying your exchange connection...'}
            {step === 'setup' && 'Configure your trading bot settings'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['exchange', 'credentials', 'testing', 'setup'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step === stepName
                      ? 'bg-blue-600 text-white'
                      : index < ['exchange', 'credentials', 'testing', 'setup'].indexOf(step)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {index < ['exchange', 'credentials', 'testing', 'setup'].indexOf(step) ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 w-16 ${
                      index < ['exchange', 'credentials', 'testing', 'setup'].indexOf(step)
                        ? 'bg-green-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 'exchange' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {exchanges.map(exchange => (
              <motion.div
                key={exchange.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExchangeSelect(exchange.id)}
                className="cursor-pointer rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{exchange.logo}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{exchange.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exchange.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleSubmit(handleCredentialsSubmit)} className="space-y-6">
            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Name
              </label>
              <input
                {...register('accountName')}
                type="text"
                placeholder="My Trading Account"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.accountName && (
                <p className="mt-1 text-sm text-red-600">{errors.accountName.message}</p>
              )}
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Key
              </label>
              <input
                {...register('apiKey')}
                type="text"
                placeholder="Enter your API key"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.apiKey && (
                <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
              )}
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                API Secret
              </label>
              <input
                {...register('apiSecret')}
                type="password"
                placeholder="Enter your API secret"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.apiSecret && (
                <p className="mt-1 text-sm text-red-600">{errors.apiSecret.message}</p>
              )}
            </div>

            {/* Passphrase (for OKX) */}
            {selectedExchangeInfo?.requiresPassphrase && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Passphrase
                </label>
                <input
                  {...register('passphrase')}
                  type="password"
                  placeholder="Enter your passphrase"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Testnet Toggle */}
            <div className="flex items-center">
              <input
                {...register('isTestnet')}
                type="checkbox"
                id="testnet"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="testnet" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Use testnet (recommended for testing)
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                Test Connection
              </Button>
            </div>
          </form>
        )}

        {step === 'testing' && (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Testing Exchange Connection
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we verify your API credentials...
            </p>
          </div>
        )}

        {step === 'setup' && (
          <form onSubmit={handleSubmit(handleCredentialsSubmit)} className="space-y-6">
            {/* Starting Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Starting Balance (USD)
              </label>
              <input
                {...register('startingBalance', { valueAsNumber: true })}
                type="number"
                min="1"
                step="0.01"
                placeholder="100"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.startingBalance && (
                <p className="mt-1 text-sm text-red-600">{errors.startingBalance.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This is used for position sizing and risk management calculations.
              </p>
            </div>

            {/* Bot Type Info */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h4 className="font-medium text-blue-900 dark:text-blue-300">
                {botType === 'alpha-compounder'
                  ? 'Alpha Compounder Strategy'
                  : 'XPat Trader Strategy'}
              </h4>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                {botType === 'alpha-compounder'
                  ? 'Advanced momentum trading strategy that identifies and capitalizes on price trends with dynamic position sizing.'
                  : 'Expert pattern recognition strategy that analyzes market patterns and executes trades based on proven technical setups.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                type="submit"
                loading={isInitializing}
                disabled={isInitializing}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {isInitializing ? 'Initializing...' : 'Initialize Bot'}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </Modal>
  );
}
