'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { tradingBotService, TradingBot, CopyBotInput } from '@/services/tradingBot';
import { exchangeService, MaskedExchangeCredentials } from '@/services/exchange';

interface CopyBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CopyBotModal({ isOpen, onClose, onSuccess }: CopyBotModalProps) {
  const [step, setStep] = useState(1); // 1: Select Template, 2: Configure Copy
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Template selection
  const [copyableBots, setCopyableBots] = useState<TradingBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Step 2: Copy configuration
  const [exchanges, setExchanges] = useState<MaskedExchangeCredentials[]>([]);
  const [copyConfig, setCopyConfig] = useState<{
    name: string;
    exchange_credentials_id: string;
    max_active_positions?: number;
    // Bot-specific trading configuration overrides
    leverage?: number;
    position_size_percent?: number;
    max_position_size?: number;
    use_auto_leverage?: boolean;
    risk_per_trade?: number;
  }>({
    name: '',
    exchange_credentials_id: '',
    max_active_positions: undefined,
    leverage: undefined,
    position_size_percent: undefined,
    max_position_size: undefined,
    use_auto_leverage: undefined,
    risk_per_trade: undefined,
  });

  // Load copyable bots
  const loadCopyableBots = async () => {
    try {
      setIsLoading(true);
      const bots = await tradingBotService.getCopyableBots(50, 0); // Get more bots for selection
      setCopyableBots(bots);
    } catch (error) {
      console.error('Failed to load copyable bots:', error);
      toast.error('Failed to load available templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's exchanges
  const loadExchanges = async () => {
    try {
      const exchangeData = await exchangeService.getExchangeCredentials();
      setExchanges(exchangeData.filter(ex => ex.is_active));
    } catch (error) {
      console.error('Failed to load exchanges:', error);
      toast.error('Failed to load exchange configurations');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCopyableBots();
      loadExchanges();
    }
  }, [isOpen]);

  // Filter bots based on search
  const filteredBots = copyableBots.filter(bot => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bot.name.toLowerCase().includes(searchLower) ||
      bot.symbols.some(symbol => symbol.toLowerCase().includes(searchLower)) ||
      bot.strategy.type.toLowerCase().includes(searchLower) ||
      bot.description.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleBotSelect = (bot: TradingBot) => {
    setSelectedBot(bot);
    setCopyConfig(prev => ({
      ...prev,
      name: `${bot.name} (Copy)`,
      max_active_positions: bot.max_active_positions, // Default to original bot's value
      // Inherit parent bot's configuration as defaults
      leverage: bot.leverage,
      position_size_percent: bot.position_size_percent,
      max_position_size: bot.max_position_size,
      use_auto_leverage: bot.use_auto_leverage,
      risk_per_trade: bot.risk_per_trade,
    }));
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSelectedBot(null);
    setCopyConfig({
      name: '',
      exchange_credentials_id: '',
      max_active_positions: undefined,
      leverage: undefined,
      position_size_percent: undefined,
      max_position_size: undefined,
      use_auto_leverage: undefined,
      risk_per_trade: undefined,
    });
  };

  const handleCopyBot = async () => {
    if (!selectedBot) return;

    if (!copyConfig.name.trim()) {
      toast.error('Please enter a name for your bot');
      return;
    }

    if (!copyConfig.exchange_credentials_id) {
      toast.error('Please select an exchange configuration');
      return;
    }

    // Validate bot-specific configuration if provided
    if (copyConfig.leverage && (copyConfig.leverage < 1 || copyConfig.leverage > 100)) {
      toast.error('Leverage must be between 1 and 100');
      return;
    }
    if (
      copyConfig.position_size_percent &&
      (copyConfig.position_size_percent < 0.1 || copyConfig.position_size_percent > 100)
    ) {
      toast.error('Position size percentage must be between 0.1% and 100%');
      return;
    }
    if (copyConfig.max_position_size && copyConfig.max_position_size < 0) {
      toast.error('Maximum position size must be greater than 0');
      return;
    }
    if (
      copyConfig.risk_per_trade &&
      (copyConfig.risk_per_trade < 0.1 || copyConfig.risk_per_trade > 100)
    ) {
      toast.error('Risk per trade must be between 0.1% and 100%');
      return;
    }

    const copyInput: CopyBotInput = {
      parent_bot_id: selectedBot.id,
      exchange_credentials_id: copyConfig.exchange_credentials_id,
      name: copyConfig.name.trim(),
      max_active_positions: copyConfig.max_active_positions,
      // Include bot-specific configuration overrides
      leverage: copyConfig.leverage,
      position_size_percent: copyConfig.position_size_percent,
      max_position_size: copyConfig.max_position_size,
      use_auto_leverage: copyConfig.use_auto_leverage,
      risk_per_trade: copyConfig.risk_per_trade,
    };

    setIsSubmitting(true);
    try {
      await tradingBotService.copyBot(copyInput);
      toast.success('Bot copied successfully!');
      onSuccess();
      onClose();

      // Reset modal state
      setStep(1);
      setSelectedBot(null);
      setCopyConfig({
        name: '',
        exchange_credentials_id: '',
        max_active_positions: undefined,
        leverage: undefined,
        position_size_percent: undefined,
        max_position_size: undefined,
        use_auto_leverage: undefined,
        risk_per_trade: undefined,
      });
    } catch (error) {
      console.error('Failed to copy bot:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy bot';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
                <div className="absolute right-0 top-0 pr-4 pt-4">
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
                      Copy Trading Bot from Template
                    </Dialog.Title>

                    {/* Progress Steps */}
                    <div className="mt-6 mb-8">
                      <div className="flex items-center justify-center">
                        {[1, 2].map(stepNumber => (
                          <div key={stepNumber} className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step >= stepNumber
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                              {stepNumber}
                            </div>
                            {stepNumber < 2 && (
                              <div
                                className={`w-16 h-0.5 ${
                                  step > stepNumber ? 'bg-primary-600' : 'bg-gray-300'
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Select Template</span>
                        <span>Configure Copy</span>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    ) : step === 1 ? (
                      /* Step 1: Template Selection */
                      <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search templates by name, symbol, or strategy..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        {/* Templates Grid */}
                        <div className="max-h-96 overflow-y-auto">
                          {filteredBots.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-gray-500">
                                {searchTerm
                                  ? 'No templates found matching your search.'
                                  : 'No templates available.'}
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredBots.map(bot => {
                                const winRate =
                                  bot.total_trades > 0
                                    ? (bot.winning_trades / bot.total_trades) * 100
                                    : 0;
                                const returnPercentage =
                                  bot.starting_balance > 0
                                    ? (bot.total_profit_loss / bot.starting_balance) * 100
                                    : 0;

                                return (
                                  <div
                                    key={bot.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 cursor-pointer transition-colors"
                                    onClick={() => handleBotSelect(bot)}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <h4 className="font-medium text-gray-900">{bot.name}</h4>
                                        <p className="text-sm text-gray-500">
                                          {bot.symbols.join(', ')}
                                          {bot.symbols.length > 1 && (
                                            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                              {bot.symbols.length} symbols
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                                        <span className="text-sm font-medium text-gray-700">
                                          {bot.total_trades > 0 ? winRate.toFixed(1) : '0'}%
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-2 mb-3">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Strategy:</span>
                                        <span className="font-medium capitalize text-gray-500">
                                          {bot.strategy.type.replace('_', ' ')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Return:</span>
                                        <span
                                          className={`font-medium ${getPerformanceColor(bot.total_profit_loss)}`}
                                        >
                                          {formatCurrency(bot.total_profit_loss)} (
                                          {formatPercentage(returnPercentage)})
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Trades:</span>
                                        <span className="font-medium text-gray-500">
                                          {bot.total_trades}
                                        </span>
                                      </div>
                                    </div>

                                    {bot.description && (
                                      <p className="text-xs text-gray-600 line-clamp-2">
                                        {bot.description}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Step 2: Copy Configuration */
                      <div className="space-y-6">
                        {selectedBot && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">Selected Template</h4>
                              <button
                                onClick={handleBackToStep1}
                                className="text-sm text-primary-600 hover:text-primary-500"
                              >
                                Change Template
                              </button>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium text-gray-500">{selectedBot.name}</p>
                                <p className="text-sm text-gray-500">
                                  {selectedBot.symbols.join(', ')} •{' '}
                                  {selectedBot.strategy.type.replace('_', ' ')}
                                  {selectedBot.symbols.length > 1 && (
                                    <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                      {selectedBot.symbols.length} symbols
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-medium ${getPerformanceColor(selectedBot.total_profit_loss)}`}
                                >
                                  {formatCurrency(selectedBot.total_profit_loss)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {selectedBot.total_trades} trades
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="bot_name"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Bot Name *
                            </label>
                            <input
                              type="text"
                              id="bot_name"
                              value={copyConfig.name}
                              onChange={e =>
                                setCopyConfig(prev => ({ ...prev, name: e.target.value }))
                              }
                              placeholder="Enter a name for your bot"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="exchange"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Exchange Configuration *
                            </label>
                            <select
                              id="exchange"
                              value={copyConfig.exchange_credentials_id}
                              onChange={e =>
                                setCopyConfig(prev => ({
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
                                No active exchanges found. Please add an exchange in settings first.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="max_active_positions"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Max Active Positions
                            </label>
                            <input
                              type="number"
                              id="max_active_positions"
                              min="1"
                              max={selectedBot ? selectedBot.symbols.length : 10}
                              value={copyConfig.max_active_positions || ''}
                              onChange={e =>
                                setCopyConfig(prev => ({
                                  ...prev,
                                  max_active_positions: e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : undefined,
                                }))
                              }
                              placeholder={
                                selectedBot
                                  ? `Default: ${selectedBot.max_active_positions}`
                                  : 'Default from template'
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Leave empty to use template default (
                              {selectedBot?.max_active_positions || 'N/A'}). Max{' '}
                              {selectedBot?.symbols.length || 1} for this bot.
                            </p>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">About Copying</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>
                              • The bot will be created with the same strategy, symbols, and
                              configuration as the template
                            </li>
                            <li>
                              • Your bot will start fresh with zero trades and performance metrics
                            </li>
                            <li>• You can optionally override the max active positions limit</li>
                            <li>• You can modify the strategy after copying if needed</li>
                            <li>
                              • The original bot creator will not have access to your copied bot
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-6">
                      <button
                        type="button"
                        onClick={step === 1 ? onClose : handleBackToStep1}
                        className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        {step === 1 ? 'Cancel' : 'Back'}
                      </button>

                      {step === 2 && (
                        <button
                          type="button"
                          onClick={handleCopyBot}
                          disabled={
                            isSubmitting ||
                            !copyConfig.name.trim() ||
                            !copyConfig.exchange_credentials_id
                          }
                          className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Copying...' : 'Copy Bot'}
                        </button>
                      )}
                    </div>
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
