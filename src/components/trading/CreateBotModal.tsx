'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  tradingBotService,
  CreateBotInput,
  SupportedStrategy,
  StrategyType,
  TradingMode,
} from '@/services/tradingBot';
import { exchangeService, MaskedExchangeCredentials } from '@/services/exchange';
import StrategyConfigForm from './StrategyConfigForm';

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'ADAUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOTUSDT',
  'DOGEUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'POLUSDT',
  'UNIUSDT',
  'LTCUSDT',
  'BCHUSDT',
  'FILUSDT',
];

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
    {
      type: 'ai_signal',
      name: 'AI Signal Strategy',
      description:
        'Advanced AI-powered trading using chart analysis and technical indicators for high-confidence signals',
      risk_level: 'medium',
      supported_modes: ['spot', 'futures'],
      configuration_schema: {
        main_timeframe: { required: true, type: 'string' },
        higher_timeframe: { required: true, type: 'string' },
        min_signal_strength: { required: true, type: 'number', min: 0.1, max: 1.0 },
        max_positions_count: { required: true, type: 'number', min: 1, max: 10 },
        risk_per_trade: { required: false, type: 'number', min: 0, max: 50 },
        position_size_percent: { required: false, type: 'number', min: 0, max: 100 },
        enable_long_signals: { required: false, type: 'boolean' },
        enable_short_signals: { required: false, type: 'boolean' },
        enable_trailing_stop: { required: false, type: 'boolean' },
        trailing_trigger_percent: { required: false, type: 'number', min: 0.5, max: 50 },
        trailing_stop_percent: { required: false, type: 'number', min: 0.1, max: 20 },
        enable_active_management: { required: false, type: 'boolean' },
      },
      min_balance: 100,
      recommended_symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'],
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
        supported_modes: (strategy.supported_modes || ['spot']) as TradingMode[],
        configuration_schema: strategy.configuration_schema || {},
        min_balance: strategy.min_balance || 0,
        recommended_symbols: strategy.recommended_symbols || [],
      }) as SupportedStrategy,
  );

export default function CreateBotModal({ isOpen, onClose, onSuccess }: CreateBotModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [supportedStrategies, setSupportedStrategies] = useState<SupportedStrategy[]>([]);
  const [exchanges, setExchanges] = useState<MaskedExchangeCredentials[]>([]);

  const [formData, setFormData] = useState<CreateBotInput>({
    name: '',
    description: '',
    exchange_credentials_id: '',
    symbols: [], // Updated to support multiple symbols
    strategy: {
      type: 'alpha_compounder' as StrategyType,
      config: {},
    },
    trading_mode: 'spot' as TradingMode,
    starting_balance: 100,
    max_active_positions: 1, // New field with default value
    // Bot-specific configuration (optional)
    leverage: undefined,
    position_size_percent: undefined,
    max_position_size: undefined,
    use_auto_leverage: undefined,
    risk_per_trade: undefined,
  });

  const [selectedStrategy, setSelectedStrategy] = useState<SupportedStrategy | null>(null);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [strategiesData, exchangesData] = await Promise.all([
        tradingBotService.getSupportedStrategies().catch(() => []),
        exchangeService.getExchangeCredentials(),
      ]);

      // Ensure strategiesData is an array and provide fallback if empty
      const strategies =
        Array.isArray(strategiesData) && strategiesData.length > 0
          ? strategiesData
          : getDefaultStrategies();

      setSupportedStrategies(strategies);
      setExchanges(exchangesData.filter(ex => ex.is_active));

      if (strategies.length > 0) {
        const firstStrategy = strategies[0];
        if (firstStrategy) {
          setSelectedStrategy(firstStrategy);
          setFormData(prev => ({
            ...prev,
            strategy: { type: firstStrategy.type, config: {} },
          }));
        }
      }

      if (exchangesData.length > 0) {
        const firstExchange = exchangesData[0];
        if (firstExchange) {
          setFormData(prev => ({
            ...prev,
            exchange_credentials_id: firstExchange.id,
          }));
        }
      }
    } catch (_error) {
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (supportedStrategies.length > 0) {
      const strategy = supportedStrategies.find(s => s.type === formData.strategy.type);
      setSelectedStrategy(strategy || null);
    }
  }, [formData.strategy.type, supportedStrategies]);

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate basic info
      if (!formData.name.trim()) {
        toast.error('Bot name is required');
        return;
      }
      if (!formData.exchange_credentials_id) {
        toast.error('Please select an exchange');
        return;
      }
      if (!formData.symbols || formData.symbols.length === 0) {
        toast.error('At least one trading symbol is required');
        return;
      }
      if (formData.starting_balance <= 0) {
        toast.error('Starting balance must be greater than 0');
        return;
      }
      if (formData.max_active_positions <= 0) {
        toast.error('Max active positions must be greater than 0');
        return;
      }

      // Validate bot-specific configuration if provided
      if (formData.leverage && (formData.leverage < 1 || formData.leverage > 100)) {
        toast.error('Leverage must be between 1 and 100');
        return;
      }
      // Validate position sizing configuration
      if (formData.position_size_percent !== undefined && formData.position_size_percent < 0) {
        toast.error('Position size percentage cannot be negative');
        return;
      }
      if (formData.position_size_percent !== undefined && formData.position_size_percent > 100) {
        toast.error('Position size percentage cannot exceed 100%');
        return;
      }
      if (formData.risk_per_trade !== undefined && formData.risk_per_trade < 0) {
        toast.error('Risk per trade cannot be negative');
        return;
      }
      if (formData.risk_per_trade !== undefined && formData.risk_per_trade > 100) {
        toast.error('Risk per trade cannot exceed 100%');
        return;
      }
      if (formData.max_position_size && formData.max_position_size < 0) {
        toast.error('Maximum position size cannot be negative');
        return;
      }
    }

    if (currentStep === 2) {
      // Validate strategy selection
      if (!selectedStrategy || !selectedStrategy.type) {
        toast.error('Please select a strategy');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!selectedStrategy) {
      toast.error('Please select a strategy');
      return;
    }

    // Validate strategy configuration
    if (selectedStrategy.type === 'alpha_compounder') {
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
    } else if (selectedStrategy.type === 'ai_signal') {
      // Validate AI signal strategy configuration
      const config = formData.strategy.config;

      // Validate that at least one signal type is enabled
      const enableLongSignals = config.enable_long_signals !== false; // Default to true
      const enableShortSignals = config.enable_short_signals !== false; // Default to true

      if (!enableLongSignals && !enableShortSignals) {
        toast.error('At least one signal type (long or short) must be enabled');
        return;
      }

      // Validate trailing stop configuration if enabled
      if (config.enable_trailing_stop) {
        const trailingTrigger = Number(config.trailing_trigger_percent) || 0;
        const trailingStop = Number(config.trailing_stop_percent) || 0;

        if (trailingTrigger <= 0 || trailingTrigger > 50) {
          toast.error('Trailing trigger percentage must be between 0 and 50');
          return;
        }
        if (trailingStop <= 0 || trailingStop > 20) {
          toast.error('Trailing stop percentage must be between 0 and 20');
          return;
        }
        if (trailingStop >= trailingTrigger) {
          toast.error('Trailing stop percentage must be less than trailing trigger percentage');
          return;
        }
      }
    } else {
      // Generic validation for other strategies
      const schema = selectedStrategy.configuration_schema;
      if (schema && typeof schema === 'object' && Object.keys(schema).length > 0) {
        const typedSchema = schema as Record<string, { required?: boolean }>;
        const requiredFields = Object.keys(typedSchema).filter(key => typedSchema[key]?.required);

        for (const field of requiredFields) {
          if (!formData.strategy.config[field]) {
            toast.error(`${field.replace('_', ' ')} is required for this strategy`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      await tradingBotService.createBot(formData);
      toast.success('Trading bot created successfully');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        name: '',
        description: '',
        exchange_credentials_id: '',
        symbols: [],
        strategy: {
          type: 'alpha_compounder' as StrategyType,
          config: {},
        },
        trading_mode: 'spot' as TradingMode,
        starting_balance: 100,
        max_active_positions: 1,
        // Reset bot-specific configuration
        leverage: undefined,
        position_size_percent: undefined,
        max_position_size: undefined,
        use_auto_leverage: undefined,
        risk_per_trade: undefined,
      });
      setCurrentStep(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trading bot';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getExchangeDisplayName = (exchangeName: string) => {
    const names: Record<string, string> = {
      binance: 'Binance',
      bybit: 'Bybit',
      hyperliquid: 'Hyperliquid',
      okx: 'OKX',
      bitget: 'Bitget',
    };
    return names[exchangeName] || exchangeName;
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
                      Create Trading Bot
                    </Dialog.Title>

                    {/* Progress Steps */}
                    <div className="mt-6 mb-8">
                      <div className="flex items-center justify-center">
                        {[1, 2, 3].map(step => (
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
                            {step < 3 && (
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
                        <span>Strategy</span>
                        <span>Configuration</span>
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
                                  value={formData.name}
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
                                  htmlFor="exchange"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Exchange *
                                </label>
                                <select
                                  id="exchange"
                                  value={formData.exchange_credentials_id}
                                  onChange={e =>
                                    setFormData(prev => ({
                                      ...prev,
                                      exchange_credentials_id: e.target.value,
                                    }))
                                  }
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  required
                                >
                                  <option value="">Select an exchange</option>
                                  {exchanges.map(exchange => (
                                    <option key={exchange.id} value={exchange.id}>
                                      {exchange.account_name} (
                                      {getExchangeDisplayName(exchange.exchange)})
                                    </option>
                                  ))}
                                </select>
                                {exchanges.length === 0 && (
                                  <p className="mt-1 text-xs text-red-600">
                                    No active exchanges found. Please add an exchange in settings
                                    first.
                                  </p>
                                )}
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
                                value={formData.description}
                                onChange={e =>
                                  setFormData(prev => ({ ...prev, description: e.target.value }))
                                }
                                placeholder="Optional description for your bot"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>

                            {/* Multi-Symbol Selection */}
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trading Symbols * (Select one or more)
                              </label>
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {POPULAR_SYMBOLS.map(symbol => (
                                    <button
                                      key={symbol}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          symbols: prev.symbols.includes(symbol)
                                            ? prev.symbols.filter(s => s !== symbol)
                                            : [...prev.symbols, symbol],
                                        }));
                                      }}
                                      className={`text-sm px-3 py-2 rounded-md font-medium transition-colors ${
                                        formData.symbols.includes(symbol)
                                          ? 'bg-primary-600 text-white'
                                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                      }`}
                                    >
                                      {symbol}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Add custom symbol (e.g., SOLUSDT)"
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.target as HTMLInputElement;
                                        const symbol = input.value.trim().toUpperCase();
                                        if (symbol && !formData.symbols.includes(symbol)) {
                                          setFormData(prev => ({
                                            ...prev,
                                            symbols: [...prev.symbols, symbol],
                                          }));
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={e => {
                                      const input = e.currentTarget
                                        .previousElementSibling as HTMLInputElement;
                                      const symbol = input.value.trim().toUpperCase();
                                      if (symbol && !formData.symbols.includes(symbol)) {
                                        setFormData(prev => ({
                                          ...prev,
                                          symbols: [...prev.symbols, symbol],
                                        }));
                                        input.value = '';
                                      }
                                    }}
                                    className="px-3 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-500"
                                  >
                                    Add
                                  </button>
                                </div>
                                {formData.symbols.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-gray-600">Selected:</span>
                                    {formData.symbols.map(symbol => (
                                      <span
                                        key={symbol}
                                        className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-md"
                                      >
                                        {symbol}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFormData(prev => ({
                                              ...prev,
                                              symbols: prev.symbols.filter(s => s !== symbol),
                                            }));
                                          }}
                                          className="ml-1 text-primary-600 hover:text-primary-800"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <label
                                  htmlFor="max_active_positions"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Max Active Positions *
                                </label>
                                <input
                                  type="number"
                                  id="max_active_positions"
                                  min="1"
                                  max="20"
                                  value={formData.max_active_positions}
                                  onChange={e =>
                                    setFormData(prev => ({
                                      ...prev,
                                      max_active_positions: parseInt(e.target.value) || 1,
                                    }))
                                  }
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Maximum concurrent positions across all symbols
                                </p>
                              </div>

                              <div>
                                <label
                                  htmlFor="trading_mode"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Trading Mode *
                                </label>
                                <select
                                  id="trading_mode"
                                  value={formData.trading_mode}
                                  onChange={e =>
                                    setFormData(prev => ({
                                      ...prev,
                                      trading_mode: e.target.value as TradingMode,
                                    }))
                                  }
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                >
                                  <option value="spot">Spot Trading</option>
                                  <option value="futures">Futures Trading</option>
                                </select>
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
                                  value={formData.starting_balance}
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

                            {/* Bot-Specific Trading Configuration */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Bot-Specific Trading Configuration
                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                  (Optional - Override strategy defaults)
                                </span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label
                                    htmlFor="leverage"
                                    className="block text-sm font-medium text-gray-700"
                                  >
                                    Leverage
                                  </label>
                                  <input
                                    type="number"
                                    id="leverage"
                                    min="1"
                                    max="100"
                                    value={formData.leverage || ''}
                                    onChange={e =>
                                      setFormData(prev => ({
                                        ...prev,
                                        leverage: e.target.value
                                          ? parseInt(e.target.value)
                                          : undefined,
                                      }))
                                    }
                                    placeholder="1-100"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    Leverage multiplier (1x = no leverage)
                                  </p>
                                </div>

                                {/* Position Sizing Configuration */}
                                <div className="col-span-full">
                                  <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Position Sizing Method
                                  </label>
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                      <input
                                        type="radio"
                                        id="sizing_method_risk"
                                        name="sizing_method"
                                        checked={
                                          formData.risk_per_trade !== undefined &&
                                          formData.position_size_percent === undefined
                                        }
                                        onChange={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            risk_per_trade: prev.risk_per_trade || 2.0,
                                            position_size_percent: undefined,
                                          }));
                                        }}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                      />
                                      <label
                                        htmlFor="sizing_method_risk"
                                        className="text-sm text-gray-700"
                                      >
                                        Risk-based sizing (% risk per trade)
                                      </label>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <input
                                        type="radio"
                                        id="sizing_method_position"
                                        name="sizing_method"
                                        checked={
                                          formData.position_size_percent !== undefined &&
                                          formData.risk_per_trade === undefined
                                        }
                                        onChange={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            position_size_percent:
                                              prev.position_size_percent || 10.0,
                                            risk_per_trade: undefined,
                                          }));
                                        }}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                      />
                                      <label
                                        htmlFor="sizing_method_position"
                                        className="text-sm text-gray-700"
                                      >
                                        Fixed position size (% of balance per trade)
                                      </label>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <input
                                        type="radio"
                                        id="sizing_method_strategy"
                                        name="sizing_method"
                                        checked={
                                          formData.risk_per_trade === undefined &&
                                          formData.position_size_percent === undefined
                                        }
                                        onChange={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            risk_per_trade: undefined,
                                            position_size_percent: undefined,
                                          }));
                                        }}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                      />
                                      <label
                                        htmlFor="sizing_method_strategy"
                                        className="text-sm text-gray-700"
                                      >
                                        Use strategy defaults
                                      </label>
                                    </div>
                                  </div>

                                  {/* Risk-based configuration */}
                                  {formData.risk_per_trade !== undefined &&
                                    formData.risk_per_trade >= 0 && (
                                      <div className="mt-3">
                                        <label
                                          htmlFor="risk_per_trade"
                                          className="block text-sm font-medium text-gray-700"
                                        >
                                          Risk per Trade (%) *
                                        </label>
                                        <input
                                          type="number"
                                          id="risk_per_trade"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={formData.risk_per_trade}
                                          onChange={e =>
                                            setFormData(prev => ({
                                              ...prev,
                                              risk_per_trade: parseFloat(e.target.value) || 0,
                                            }))
                                          }
                                          placeholder="0-100"
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                          Risk as % of balance per trade. Position size calculated
                                          based on stop loss distance.
                                        </p>
                                      </div>
                                    )}

                                  {/* Position size configuration */}
                                  {formData.position_size_percent !== undefined &&
                                    formData.position_size_percent >= 0 && (
                                      <div className="mt-3">
                                        <label
                                          htmlFor="position_size_percent"
                                          className="block text-sm font-medium text-gray-700"
                                        >
                                          Position Size (%) *
                                        </label>
                                        <input
                                          type="number"
                                          id="position_size_percent"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={formData.position_size_percent}
                                          onChange={e =>
                                            setFormData(prev => ({
                                              ...prev,
                                              position_size_percent:
                                                parseFloat(e.target.value) || 0,
                                            }))
                                          }
                                          placeholder="0-100"
                                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                          Fixed % of balance per trade, regardless of stop loss
                                          distance.
                                        </p>
                                      </div>
                                    )}
                                </div>

                                <div>
                                  <label
                                    htmlFor="max_position_size"
                                    className="block text-sm font-medium text-gray-700"
                                  >
                                    Max Position Size
                                  </label>
                                  <input
                                    type="number"
                                    id="max_position_size"
                                    min="0"
                                    step="0.01"
                                    value={formData.max_position_size || ''}
                                    onChange={e =>
                                      setFormData(prev => ({
                                        ...prev,
                                        max_position_size: e.target.value
                                          ? parseFloat(e.target.value)
                                          : undefined,
                                      }))
                                    }
                                    placeholder="Max size in USDT"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    Maximum position size in USDT (optional limit)
                                  </p>
                                </div>

                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="use_auto_leverage"
                                    checked={formData.use_auto_leverage || false}
                                    onChange={e =>
                                      setFormData(prev => ({
                                        ...prev,
                                        use_auto_leverage: e.target.checked,
                                      }))
                                    }
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <label
                                    htmlFor="use_auto_leverage"
                                    className="ml-2 block text-sm text-gray-700"
                                  >
                                    Auto-adjust leverage based on confidence
                                  </label>
                                </div>
                              </div>
                              <div className="mt-2 flex items-start gap-2">
                                <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-600">
                                  These settings override strategy defaults and allow each bot to
                                  have its own risk profile. Leave empty to use the strategy&apos;s
                                  default configuration.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 2: Strategy Selection */}
                        {currentStep === 2 && (
                          <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              Choose Trading Strategy
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(supportedStrategies || []).map(strategy => (
                                <div
                                  key={strategy.type}
                                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                    formData.strategy.type === strategy.type
                                      ? 'border-primary-500 bg-primary-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      strategy: { type: strategy.type, config: {} },
                                    }));
                                    setSelectedStrategy(strategy);
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className="font-medium text-gray-900">
                                        {strategy.name || 'Unknown Strategy'}
                                      </h5>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {strategy.description || 'No description available'}
                                      </p>
                                    </div>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(strategy.risk_level || 'medium')}`}
                                    >
                                      {(strategy.risk_level || 'medium').toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="mt-3 text-xs text-gray-500">
                                    <div>Min Balance: ${strategy.min_balance || 0}</div>
                                    <div>
                                      Modes:{' '}
                                      {(strategy.supported_modes || []).join(', ').toUpperCase()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Strategy Configuration */}
                        {currentStep === 3 && selectedStrategy && (
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

                            <StrategyConfigForm
                              strategy={selectedStrategy}
                              config={formData.strategy.config}
                              symbols={formData.symbols}
                              onChange={config =>
                                setFormData(prev => ({
                                  ...prev,
                                  strategy: { ...prev.strategy, config },
                                }))
                              }
                            />
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

                          {currentStep < 3 ? (
                            <button
                              type="button"
                              onClick={handleNext}
                              disabled={exchanges.length === 0}
                              className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  Creating...
                                </>
                              ) : (
                                'Create Bot'
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
