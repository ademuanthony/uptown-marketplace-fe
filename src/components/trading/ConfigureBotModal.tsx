'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  tradingBotService,
  UpdateBotConfigInput,
  TradingBot,
  SupportedStrategy,
  StrategyType,
} from '@/services/tradingBot';
import StrategyConfigForm from './StrategyConfigForm';

interface ConfigureBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bot: TradingBot;
}

// Removed unused POPULAR_SYMBOLS constant

// Default strategies fallback when backend is not available
const getDefaultStrategies = (): SupportedStrategy[] =>
  [
    {
      type: 'alpha_compounder',
      name: 'Alpha Compounder',
      description:
        'Compound gains by taking profits at specified levels while allowing controlled pullbacks',
      risk_level: 'medium',
      supported_modes: ['spot', 'futures'],
      configuration_schema: {
        take_profit_percentage: { required: true, type: 'number', min: 0.1, max: 100 },
        pull_back_percentage: { required: true, type: 'number', min: 0.1, max: 50 },
      },
      min_balance: 50,
      recommended_symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
    },
    {
      type: 'grid_trading',
      name: 'Grid Trading',
      description:
        'Place multiple buy and sell orders at predetermined intervals around current price',
      risk_level: 'low',
      supported_modes: ['spot'],
      configuration_schema: {
        grid_size: { required: true, type: 'number', min: 3, max: 50 },
        grid_spacing: { required: true, type: 'number', min: 0.1, max: 10 },
        investment_per_order: { required: true, type: 'number', min: 1 },
        profit_per_grid: { required: true, type: 'number', min: 0.1, max: 5 },
      },
      min_balance: 100,
      recommended_symbols: ['BTCUSDT', 'ETHUSDT'],
    },
    {
      type: 'dca',
      name: 'Dollar Cost Averaging',
      description: 'Systematically buy assets at regular intervals regardless of price',
      risk_level: 'low',
      supported_modes: ['spot'],
      configuration_schema: {
        buy_interval_hours: { required: true, type: 'number', min: 1, max: 168 },
        buy_amount: { required: true, type: 'number', min: 1 },
        max_orders: { required: true, type: 'number', min: 1, max: 100 },
        safety_orders: { required: true, type: 'number', min: 0, max: 20 },
      },
      min_balance: 25,
      recommended_symbols: ['BTCUSDT', 'ETHUSDT'],
    },
  ].map(
    strategy =>
      ({
        ...strategy,
        // Ensure all properties exist with safe defaults
        type: strategy.type as StrategyType,
        name: strategy.name || 'Unknown Strategy',
        description: strategy.description || 'No description available',
        risk_level: (strategy.risk_level || 'medium') as 'low' | 'medium' | 'high',
        supported_modes: (strategy.supported_modes || ['spot']) as ('spot' | 'futures')[],
        configuration_schema: strategy.configuration_schema || {},
        min_balance: strategy.min_balance || 0,
        recommended_symbols: strategy.recommended_symbols || [],
      }) as SupportedStrategy,
  );

export default function ConfigureBotModal({
  isOpen,
  onClose,
  onSuccess,
  bot,
}: ConfigureBotModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [supportedStrategies, setSupportedStrategies] = useState<SupportedStrategy[]>([]);

  const [formData, setFormData] = useState<UpdateBotConfigInput>({
    name: bot.name,
    description: bot.description,
    strategy: bot.strategy,
    starting_balance: bot.starting_balance,
  });

  const [selectedStrategy, setSelectedStrategy] = useState<SupportedStrategy | null>(null);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const strategiesData = await tradingBotService.getSupportedStrategies().catch(() => []);

      // Ensure strategiesData is an array and provide fallback if empty
      const strategies =
        Array.isArray(strategiesData) && strategiesData.length > 0
          ? strategiesData
          : getDefaultStrategies();

      setSupportedStrategies(strategies);

      // Find and set the current strategy
      const currentStrategy = strategies.find(s => s.type === bot.strategy.type);
      if (currentStrategy) {
        setSelectedStrategy(currentStrategy);
      }
    } catch (_error) {
      toast.error('Failed to load strategy information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form data when modal opens
      setFormData({
        name: bot.name,
        description: bot.description,
        strategy: bot.strategy,
        starting_balance: bot.starting_balance,
      });
      setCurrentStep(1);
      loadInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, bot]);

  useEffect(() => {
    if (supportedStrategies.length > 0) {
      const strategy = supportedStrategies.find(s => s.type === formData.strategy?.type);
      setSelectedStrategy(strategy || null);
    }
  }, [formData.strategy?.type, supportedStrategies]);

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate basic info
      if (!formData.name?.trim()) {
        toast.error('Bot name is required');
        return;
      }
      if (!formData.starting_balance || formData.starting_balance <= 0) {
        toast.error('Starting balance must be greater than 0');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!formData.strategy) {
      toast.error('Strategy configuration is missing');
      return;
    }

    // Validate strategy configuration
    if (selectedStrategy?.type === 'alpha_compounder') {
      const config = formData.strategy.config;
      const symbolsConfig = config.symbols as Array<{
        symbol: string;
        take_profit_percentage: number;
        pull_back_percentage: number;
      }>;

      if (!symbolsConfig || !Array.isArray(symbolsConfig) || symbolsConfig.length === 0) {
        toast.error('Strategy configuration is missing. Please configure the strategy parameters.');
        return;
      }

      // Validate each symbol's configuration
      for (const symbolConfig of symbolsConfig) {
        const takeProfitPercentage = Number(symbolConfig.take_profit_percentage);
        const pullBackPercentage = Number(symbolConfig.pull_back_percentage);

        if (!takeProfitPercentage || takeProfitPercentage <= 0) {
          toast.error(`Take profit percentage must be greater than 0 for ${symbolConfig.symbol}`);
          return;
        }
        if (takeProfitPercentage > 100) {
          toast.error(`Take profit percentage cannot exceed 100% for ${symbolConfig.symbol}`);
          return;
        }
        if (!pullBackPercentage || pullBackPercentage <= 0) {
          toast.error(`Pull back percentage must be greater than 0 for ${symbolConfig.symbol}`);
          return;
        }
        if (pullBackPercentage > 50) {
          toast.error(`Pull back percentage cannot exceed 50% for ${symbolConfig.symbol}`);
          return;
        }
        if (takeProfitPercentage <= pullBackPercentage) {
          toast.error(
            `Take profit percentage must be greater than pull back percentage for ${symbolConfig.symbol}`,
          );
          return;
        }
      }
    } else if (selectedStrategy) {
      // Generic validation for other strategies
      const schema = selectedStrategy.configuration_schema;
      if (schema && typeof schema === 'object' && Object.keys(schema).length > 0) {
        const typedSchema = schema as Record<string, { required?: boolean }>;
        const requiredFields = Object.keys(typedSchema).filter(key => typedSchema[key]?.required);

        for (const field of requiredFields) {
          if (!formData.strategy?.config[field]) {
            toast.error(`${field.replace('_', ' ')} is required for this strategy`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      await tradingBotService.updateBotConfig(bot.id, formData);
      toast.success('Bot configuration updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update bot configuration';
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
                      Configure Trading Bot: {bot.name}
                    </Dialog.Title>

                    {/* Progress Steps */}
                    <div className="mt-6 mb-8">
                      <div className="flex items-center justify-center">
                        {[1, 2].map(step => (
                          <div key={step} className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                currentStep >= step
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                              {step}
                            </div>
                            {step < 2 && (
                              <div
                                className={`w-16 h-0.5 ${
                                  currentStep > step ? 'bg-primary-600' : 'bg-gray-300'
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Basic Info</span>
                        <span>Strategy Configuration</span>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Step 1: Basic Information */}
                        {currentStep === 1 && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label
                                  htmlFor="name"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Bot Name *
                                </label>
                                <input
                                  type="text"
                                  id="name"
                                  value={formData.name || ''}
                                  onChange={e =>
                                    setFormData(prev => ({ ...prev, name: e.target.value }))
                                  }
                                  placeholder="e.g., My BTCUSDT Bot"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  required
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="starting_balance"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Starting Balance (USDT) *
                                </label>
                                <input
                                  type="number"
                                  id="starting_balance"
                                  min="1"
                                  step="0.01"
                                  value={formData.starting_balance || 0}
                                  onChange={e =>
                                    setFormData(prev => ({
                                      ...prev,
                                      starting_balance: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Description
                              </label>
                              <textarea
                                id="description"
                                rows={3}
                                value={formData.description || ''}
                                onChange={e =>
                                  setFormData(prev => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Optional description for your bot"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>

                            {/* Read-only Bot Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">
                                Current Configuration
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500">
                                    Strategy
                                  </label>
                                  <div className="text-sm text-gray-900">
                                    {bot.strategy.type.replace('_', ' ').toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500">
                                    Trading Mode
                                  </label>
                                  <div className="text-sm text-gray-900">
                                    {bot.trading_mode.toUpperCase()}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500">
                                    Symbols
                                  </label>
                                  <div className="text-sm text-gray-900">
                                    {bot.symbols.join(', ')}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-gray-500">
                                Note: Strategy, Trading Mode, and Symbols cannot be changed after
                                creation.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 2: Strategy Configuration */}
                        {currentStep === 2 && selectedStrategy && (
                          <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              Configure Strategy
                            </h4>
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                              <div className="flex">
                                <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-blue-800">
                                    {selectedStrategy.name} Strategy
                                  </h3>
                                  <p className="mt-1 text-sm text-blue-700">
                                    {selectedStrategy.description}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {formData.strategy && (
                              <StrategyConfigForm
                                strategy={selectedStrategy}
                                config={formData.strategy.config}
                                symbols={bot.symbols}
                                onChange={config =>
                                  setFormData(prev => ({
                                    ...prev,
                                    strategy: prev.strategy
                                      ? { ...prev.strategy, config }
                                      : undefined,
                                  }))
                                }
                              />
                            )}
                          </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6">
                          <button
                            type="button"
                            onClick={currentStep === 1 ? onClose : handleBack}
                            className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            {currentStep === 1 ? 'Cancel' : 'Back'}
                          </button>

                          {currentStep < 2 ? (
                            <button
                              type="button"
                              onClick={handleNext}
                              className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={isSubmitting}
                              className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Updating...
                                </>
                              ) : (
                                'Update Configuration'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
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
