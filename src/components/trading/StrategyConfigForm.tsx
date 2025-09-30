'use client';

import { SupportedStrategy } from '@/services/tradingBot';

interface StrategyConfigFormProps {
  strategy: SupportedStrategy;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  symbols?: string[]; // New prop for symbols array
}

export default function StrategyConfigForm({
  strategy,
  config,
  onChange,
  symbols = [],
}: StrategyConfigFormProps) {
  const updateConfig = (key: string, value: unknown) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const getNumberValue = (key: string, defaultValue: number): number => {
    const value = config[key];
    return typeof value === 'number' ? value : defaultValue;
  };

  const getIntValue = (key: string, defaultValue: number): number => {
    const value = config[key];
    return typeof value === 'number' ? Math.floor(value) : defaultValue;
  };

  // Alpha Compounder Strategy Configuration
  if (strategy.type === 'alpha_compounder') {
    // Initialize symbols config if it doesn't exist
    const symbolsConfig =
      (config.symbols as {
        symbol: string;
        take_profit_percentage: number;
        pull_back_percentage: number;
      }[]) ||
      symbols.map(symbol => ({
        symbol,
        take_profit_percentage: 5.0,
        pull_back_percentage: 3.0,
      }));

    const updateSymbolConfig = (symbolIndex: number, key: string, value: number) => {
      const updatedSymbols = symbolsConfig.map((symbolConfig, index) =>
        index === symbolIndex ? { ...symbolConfig, [key]: value } : symbolConfig,
      );
      updateConfig('symbols', updatedSymbols);
    };

    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-sm text-yellow-800">
            <strong>Alpha Compounder Strategy:</strong> Configure take profit and pullback
            percentages for each trading symbol. Each symbol can have its own risk parameters based
            on volatility and market behavior.
          </div>
        </div>

        {symbols.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Please select trading symbols first to configure the strategy.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {symbols.map((symbol, index) => {
              const symbolConfig = symbolsConfig.find(s => s.symbol === symbol) || {
                symbol,
                take_profit_percentage: 5.0,
                pull_back_percentage: 3.0,
              };

              return (
                <div key={symbol} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">{symbol} Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`take_profit_${symbol}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Take Profit Percentage (%) *
                      </label>
                      <input
                        type="number"
                        id={`take_profit_${symbol}`}
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={symbolConfig.take_profit_percentage}
                        onChange={e =>
                          updateSymbolConfig(
                            index,
                            'take_profit_percentage',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="5.0"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Target profit percentage for {symbol}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`pull_back_${symbol}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Pull Back Percentage (%) *
                      </label>
                      <input
                        type="number"
                        id={`pull_back_${symbol}`}
                        min="0.1"
                        max="50"
                        step="0.1"
                        value={symbolConfig.pull_back_percentage}
                        onChange={e =>
                          updateSymbolConfig(
                            index,
                            'pull_back_percentage',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="3.0"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Maximum allowed pullback for {symbol}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-sm text-blue-800">
            <strong>Quick Setup:</strong>
            <div className="mt-2 space-x-2">
              <button
                type="button"
                onClick={() => {
                  const conservativeConfig = symbols.map(symbol => ({
                    symbol,
                    take_profit_percentage: 3.0,
                    pull_back_percentage: 1.5,
                  }));
                  updateConfig('symbols', conservativeConfig);
                }}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs hover:bg-green-200"
              >
                Conservative (3%/1.5%)
              </button>
              <button
                type="button"
                onClick={() => {
                  const moderateConfig = symbols.map(symbol => ({
                    symbol,
                    take_profit_percentage: 5.0,
                    pull_back_percentage: 3.0,
                  }));
                  updateConfig('symbols', moderateConfig);
                }}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs hover:bg-yellow-200"
              >
                Moderate (5%/3%)
              </button>
              <button
                type="button"
                onClick={() => {
                  const aggressiveConfig = symbols.map(symbol => ({
                    symbol,
                    take_profit_percentage: 8.0,
                    pull_back_percentage: 5.0,
                  }));
                  updateConfig('symbols', aggressiveConfig);
                }}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-xs hover:bg-red-200"
              >
                Aggressive (8%/5%)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid Trading Strategy Configuration
  if (strategy.type === 'grid_trading') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="grid_size" className="block text-sm font-medium text-gray-700">
              Grid Size *
            </label>
            <input
              type="number"
              id="grid_size"
              min="3"
              max="50"
              value={getIntValue('grid_size', 10)}
              onChange={e => updateConfig('grid_size', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500">Number of buy/sell orders to place</p>
          </div>

          <div>
            <label htmlFor="grid_spacing" className="block text-sm font-medium text-gray-700">
              Grid Spacing (%) *
            </label>
            <input
              type="number"
              id="grid_spacing"
              min="0.1"
              max="10"
              step="0.1"
              value={getNumberValue('grid_spacing', 1.0)}
              onChange={e => updateConfig('grid_spacing', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="1.0"
            />
            <p className="mt-1 text-xs text-gray-500">Percentage spacing between grid levels</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="investment_per_order"
              className="block text-sm font-medium text-gray-700"
            >
              Investment Per Order (USDT) *
            </label>
            <input
              type="number"
              id="investment_per_order"
              min="1"
              step="0.01"
              value={getNumberValue('investment_per_order', 10)}
              onChange={e => updateConfig('investment_per_order', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500">Amount to invest per grid order</p>
          </div>

          <div>
            <label htmlFor="profit_per_grid" className="block text-sm font-medium text-gray-700">
              Profit Per Grid (%) *
            </label>
            <input
              type="number"
              id="profit_per_grid"
              min="0.1"
              max="5"
              step="0.1"
              value={getNumberValue('profit_per_grid', 0.5)}
              onChange={e => updateConfig('profit_per_grid', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="0.5"
            />
            <p className="mt-1 text-xs text-gray-500">Target profit percentage per grid level</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-sm text-blue-800">
            <strong>Strategy Overview:</strong> Grid trading places multiple buy and sell orders at
            predetermined intervals around the current price. Best suited for sideways markets with
            regular price fluctuations.
          </div>
        </div>
      </div>
    );
  }

  // DCA (Dollar Cost Averaging) Strategy Configuration
  if (strategy.type === 'dca') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="buy_interval_hours" className="block text-sm font-medium text-gray-700">
              Buy Interval (Hours) *
            </label>
            <input
              type="number"
              id="buy_interval_hours"
              min="1"
              max="168"
              value={getIntValue('buy_interval_hours', 24)}
              onChange={e => updateConfig('buy_interval_hours', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="24"
            />
            <p className="mt-1 text-xs text-gray-500">Hours between each buy order</p>
          </div>

          <div>
            <label htmlFor="buy_amount" className="block text-sm font-medium text-gray-700">
              Buy Amount (USDT) *
            </label>
            <input
              type="number"
              id="buy_amount"
              min="1"
              step="0.01"
              value={getNumberValue('buy_amount', 10)}
              onChange={e => updateConfig('buy_amount', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500">Amount to buy each interval</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="max_orders" className="block text-sm font-medium text-gray-700">
              Max Orders *
            </label>
            <input
              type="number"
              id="max_orders"
              min="1"
              max="100"
              value={getIntValue('max_orders', 10)}
              onChange={e => updateConfig('max_orders', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum number of buy orders</p>
          </div>

          <div>
            <label htmlFor="safety_orders" className="block text-sm font-medium text-gray-700">
              Safety Orders *
            </label>
            <input
              type="number"
              id="safety_orders"
              min="0"
              max="20"
              value={getIntValue('safety_orders', 3)}
              onChange={e => updateConfig('safety_orders', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="3"
            />
            <p className="mt-1 text-xs text-gray-500">Number of safety orders for averaging down</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="safety_order_volume_scale"
              className="block text-sm font-medium text-gray-700"
            >
              Safety Order Volume Scale *
            </label>
            <input
              type="number"
              id="safety_order_volume_scale"
              min="1"
              max="10"
              step="0.1"
              value={getNumberValue('safety_order_volume_scale', 2.0)}
              onChange={e =>
                updateConfig('safety_order_volume_scale', parseFloat(e.target.value) || 0)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="2.0"
            />
            <p className="mt-1 text-xs text-gray-500">Multiplier for safety order volume</p>
          </div>

          <div>
            <label
              htmlFor="safety_order_step_scale"
              className="block text-sm font-medium text-gray-700"
            >
              Safety Order Step Scale *
            </label>
            <input
              type="number"
              id="safety_order_step_scale"
              min="1"
              max="10"
              step="0.1"
              value={getNumberValue('safety_order_step_scale', 1.5)}
              onChange={e =>
                updateConfig('safety_order_step_scale', parseFloat(e.target.value) || 0)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="1.5"
            />
            <p className="mt-1 text-xs text-gray-500">Multiplier for safety order price steps</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-800">
            <strong>Strategy Overview:</strong> Dollar Cost Averaging systematically buys assets at
            regular intervals regardless of price, reducing the impact of volatility. Safety orders
            help average down during market dips.
          </div>
        </div>
      </div>
    );
  }

  // Mean Reversion Strategy Configuration
  if (strategy.type === 'mean_reversion') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lookback_period" className="block text-sm font-medium text-gray-700">
              Lookback Period (Days) *
            </label>
            <input
              type="number"
              id="lookback_period"
              min="1"
              max="100"
              value={getIntValue('lookback_period', 20)}
              onChange={e => updateConfig('lookback_period', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="20"
            />
            <p className="mt-1 text-xs text-gray-500">Period for calculating moving average</p>
          </div>

          <div>
            <label
              htmlFor="deviation_threshold"
              className="block text-sm font-medium text-gray-700"
            >
              Deviation Threshold (%) *
            </label>
            <input
              type="number"
              id="deviation_threshold"
              min="0.1"
              max="20"
              step="0.1"
              value={getNumberValue('deviation_threshold', 2.0)}
              onChange={e => updateConfig('deviation_threshold', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="2.0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Percentage deviation from mean to trigger trades
            </p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="text-sm text-purple-800">
            <strong>Strategy Overview:</strong> Mean reversion assumes that prices will eventually
            return to their historical average. The strategy buys when price is below the mean and
            sells when above.
          </div>
        </div>
      </div>
    );
  }

  // Trend Following Strategy Configuration
  if (strategy.type === 'trend_following') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fast_ma_period" className="block text-sm font-medium text-gray-700">
              Fast MA Period *
            </label>
            <input
              type="number"
              id="fast_ma_period"
              min="1"
              max="50"
              value={getIntValue('fast_ma_period', 10)}
              onChange={e => updateConfig('fast_ma_period', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500">Period for fast moving average</p>
          </div>

          <div>
            <label htmlFor="slow_ma_period" className="block text-sm font-medium text-gray-700">
              Slow MA Period *
            </label>
            <input
              type="number"
              id="slow_ma_period"
              min="2"
              max="200"
              value={getIntValue('slow_ma_period', 30)}
              onChange={e => updateConfig('slow_ma_period', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="30"
            />
            <p className="mt-1 text-xs text-gray-500">Period for slow moving average</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <div className="text-sm text-orange-800">
            <strong>Strategy Overview:</strong> Trend following uses moving average crossovers to
            identify and follow price trends. Buy signals occur when the fast MA crosses above the
            slow MA.
          </div>
        </div>
      </div>
    );
  }

  // AI Signal Strategy Configuration
  if (strategy.type === 'ai_signal') {
    const getStringValue = (key: string, defaultValue: string): string => {
      const value = config[key];
      return typeof value === 'string' ? value : defaultValue;
    };

    const getBooleanValue = (key: string, defaultValue: boolean): boolean => {
      const value = config[key];
      return typeof value === 'boolean' ? value : defaultValue;
    };

    return (
      <div className="space-y-6">
        {/* Timeframe Configuration */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Timeframes</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="main_timeframe" className="block text-sm font-medium text-gray-700">
                Main Timeframe *
              </label>
              <select
                id="main_timeframe"
                value={getStringValue('main_timeframe', '1h')}
                onChange={e => updateConfig('main_timeframe', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Primary timeframe for analysis</p>
            </div>

            <div>
              <label htmlFor="higher_timeframe" className="block text-sm font-medium text-gray-700">
                Higher Timeframe *
              </label>
              <select
                id="higher_timeframe"
                value={getStringValue('higher_timeframe', '4h')}
                onChange={e => updateConfig('higher_timeframe', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
                <option value="1w">1 Week</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Higher timeframe for trend context</p>
            </div>
          </div>

          <div>
            <label htmlFor="execution_interval" className="block text-sm font-medium text-gray-700">
              Analysis Interval (minutes) *
            </label>
            <input
              type="number"
              id="execution_interval"
              min="15"
              max="1440"
              value={getIntValue('execution_interval', 60)}
              onChange={e => updateConfig('execution_interval', parseInt(e.target.value) || 60)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="60"
            />
            <p className="mt-1 text-xs text-gray-500">
              How often to perform AI analysis (15-1440 minutes)
            </p>
          </div>
        </div>

        {/* Signal Configuration */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-900 mb-4">Signal Generation</h3>

          {/* Signal Type Controls */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">Signal Types *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_long_signals"
                  checked={config.enable_long_signals !== false} // Default to true
                  onChange={e => updateConfig('enable_long_signals', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_long_signals" className="ml-2 block text-sm text-gray-700">
                  Enable Long Signals (Buy)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_short_signals"
                  checked={config.enable_short_signals !== false} // Default to true
                  onChange={e => updateConfig('enable_short_signals', e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="enable_short_signals" className="ml-2 block text-sm text-gray-700">
                  Enable Short Signals (Sell)
                </label>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Control which signal types the AI can generate. At least one must be enabled.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="min_signal_strength"
                className="block text-sm font-medium text-gray-700"
              >
                Minimum Signal Confidence *
              </label>
              <input
                type="number"
                id="min_signal_strength"
                min="0.1"
                max="1.0"
                step="0.1"
                value={getNumberValue('min_signal_strength', 0.7)}
                onChange={e =>
                  updateConfig('min_signal_strength', parseFloat(e.target.value) || 0.7)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="0.7"
              />
              <p className="mt-1 text-xs text-gray-500">
                Only execute trades above this confidence level (0.1-1.0)
              </p>
            </div>

            <div>
              <label
                htmlFor="max_positions_count"
                className="block text-sm font-medium text-gray-700"
              >
                Max Active Positions *
              </label>
              <input
                type="number"
                id="max_positions_count"
                min="1"
                max="10"
                value={getIntValue('max_positions_count', 3)}
                onChange={e => updateConfig('max_positions_count', parseInt(e.target.value) || 3)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="3"
              />
              <p className="mt-1 text-xs text-gray-500">Maximum concurrent positions (1-10)</p>
            </div>
          </div>

          <div>
            <label htmlFor="max_daily_trades" className="block text-sm font-medium text-gray-700">
              Max Daily Trades *
            </label>
            <input
              type="number"
              id="max_daily_trades"
              min="1"
              max="50"
              value={getIntValue('max_daily_trades', 10)}
              onChange={e => updateConfig('max_daily_trades', parseInt(e.target.value) || 10)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum trades per day (1-50)</p>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-900 mb-4">Risk Management</h3>

          {/* Position Sizing Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Position Sizing Method *
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="ai_sizing_method_risk"
                  name="ai_sizing_method"
                  checked={
                    config.risk_per_trade !== undefined &&
                    config.position_size_percent === undefined
                  }
                  onChange={() => {
                    updateConfig('risk_per_trade', config.risk_per_trade || 2.0);
                    updateConfig('position_size_percent', undefined);
                  }}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <label htmlFor="ai_sizing_method_risk" className="text-sm text-gray-700">
                  Risk-based sizing (% risk per trade)
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="ai_sizing_method_position"
                  name="ai_sizing_method"
                  checked={
                    config.position_size_percent !== undefined &&
                    config.risk_per_trade === undefined
                  }
                  onChange={() => {
                    updateConfig('position_size_percent', config.position_size_percent || 10.0);
                    updateConfig('risk_per_trade', undefined);
                  }}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <label htmlFor="ai_sizing_method_position" className="text-sm text-gray-700">
                  Fixed position size (% of balance per trade)
                </label>
              </div>
            </div>

            {/* Risk-based configuration */}
            {config.risk_per_trade !== undefined && (
              <div className="mt-4">
                <label htmlFor="risk_per_trade" className="block text-sm font-medium text-gray-700">
                  Risk Per Trade (%) *
                </label>
                <input
                  type="number"
                  id="risk_per_trade"
                  min="0"
                  max="50"
                  step="0.1"
                  value={getNumberValue('risk_per_trade', 2.0)}
                  onChange={e => updateConfig('risk_per_trade', parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="2.0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Risk as % of balance per trade. Position size calculated based on stop loss
                  distance.
                </p>
              </div>
            )}

            {/* Position size configuration */}
            {config.position_size_percent !== undefined && (
              <div className="mt-4">
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
                  value={getNumberValue('position_size_percent', 10.0)}
                  onChange={e =>
                    updateConfig('position_size_percent', parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="10.0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Fixed % of balance per trade, regardless of stop loss distance.
                </p>
              </div>
            )}
          </div>

          {/* Stop Loss & Take Profit Source */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Stop Loss & Take Profit Source *
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="use_ai_suggested_levels_true"
                  name="tp_sl_source"
                  checked={getBooleanValue('use_ai_suggested_levels', false)}
                  onChange={() => updateConfig('use_ai_suggested_levels', true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="use_ai_suggested_levels_true" className="text-sm text-gray-700">
                  Use AI-suggested levels (from signal analysis)
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="use_ai_suggested_levels_false"
                  name="tp_sl_source"
                  checked={!getBooleanValue('use_ai_suggested_levels', false)}
                  onChange={() => updateConfig('use_ai_suggested_levels', false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="use_ai_suggested_levels_false" className="text-sm text-gray-700">
                  Use custom percentage values (configured below)
                </label>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Choose whether to use AI-suggested stop loss and take profit levels from the signal
              analysis, or your custom percentage values.
            </p>
          </div>

          {/* Custom Stop Loss & Take Profit (only shown when not using AI levels) */}
          {!getBooleanValue('use_ai_suggested_levels', false) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="stop_loss_percent"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stop Loss (%) *
                </label>
                <input
                  type="number"
                  id="stop_loss_percent"
                  min="0.5"
                  max="20"
                  step="0.1"
                  value={getNumberValue('stop_loss_percent', 3.0)}
                  onChange={e =>
                    updateConfig('stop_loss_percent', parseFloat(e.target.value) || 3.0)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="3.0"
                />
                <p className="mt-1 text-xs text-gray-500">Stop loss percentage from entry price</p>
              </div>

              <div>
                <label
                  htmlFor="take_profit_percent"
                  className="block text-sm font-medium text-gray-700"
                >
                  Take Profit (%) *
                </label>
                <input
                  type="number"
                  id="take_profit_percent"
                  min="1"
                  max="50"
                  step="0.1"
                  value={getNumberValue('take_profit_percent', 5.0)}
                  onChange={e =>
                    updateConfig('take_profit_percent', parseFloat(e.target.value) || 5.0)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="5.0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Take profit percentage from entry price
                </p>
              </div>
            </div>
          )}

          {/* AI Levels Information */}
          {getBooleanValue('use_ai_suggested_levels', false) && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-sm text-blue-800">
                <strong>AI-Suggested Levels:</strong> The AI will analyze chart patterns,
                support/resistance levels, and market conditions to suggest optimal stop loss and
                take profit levels for each signal. These levels may vary per trade based on market
                conditions.
              </div>
            </div>
          )}
        </div>

        {/* Trailing Stop Configuration */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-900 mb-4">Trailing Stop</h3>

          {/* Enable Trailing Stop */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_trailing_stop"
                checked={getBooleanValue('enable_trailing_stop', false)}
                onChange={e => updateConfig('enable_trailing_stop', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label
                htmlFor="enable_trailing_stop"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                Enable Trailing Stop
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Automatically adjust stop loss to lock in profits as the position moves favorably
            </p>
          </div>

          {/* Trailing Stop Parameters */}
          {getBooleanValue('enable_trailing_stop', false) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="trailing_trigger_percent"
                  className="block text-sm font-medium text-gray-700"
                >
                  Trailing Trigger (%) *
                </label>
                <input
                  type="number"
                  id="trailing_trigger_percent"
                  min="0.5"
                  max="50"
                  step="0.1"
                  value={getNumberValue('trailing_trigger_percent', 3.0)}
                  onChange={e =>
                    updateConfig('trailing_trigger_percent', parseFloat(e.target.value) || 3.0)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="3.0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Percentage gain required to activate trailing stop
                </p>
              </div>

              <div>
                <label
                  htmlFor="trailing_stop_percent"
                  className="block text-sm font-medium text-gray-700"
                >
                  Trailing Stop (%) *
                </label>
                <input
                  type="number"
                  id="trailing_stop_percent"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={getNumberValue('trailing_stop_percent', 1.5)}
                  onChange={e =>
                    updateConfig('trailing_stop_percent', parseFloat(e.target.value) || 1.5)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="1.5"
                />
                <p className="mt-1 text-xs text-gray-500">Percentage pullback to close position</p>
              </div>
            </div>
          )}

          <div className="mt-4 bg-purple-100 border border-purple-200 rounded-md p-3">
            <div className="text-sm text-purple-800">
              <strong>How Trailing Stop Works:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Position opens normally with regular stop loss</li>
                <li>• When profit reaches trigger percentage, trailing stop activates</li>
                <li>• Stop loss automatically follows price at the trailing distance</li>
                <li>• Position closes if price reverses by trailing stop percentage</li>
                <li>• Helps lock in profits while allowing further upside potential</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Active Position Management Configuration */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-orange-900 mb-4">Active Position Management</h3>

          {/* Enable Active Management */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_active_management"
                checked={getBooleanValue('enable_active_management', false)}
                onChange={e => updateConfig('enable_active_management', e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label
                htmlFor="enable_active_management"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                Enable Active Position Management
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Continuously analyze open positions and suggest when to close them based on AI signals
            </p>
          </div>

          <div className="mt-4 bg-orange-100 border border-orange-200 rounded-md p-3">
            <div className="text-sm text-orange-800">
              <strong>How Active Management Works:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• AI continuously monitors your open positions</li>
                <li>• Analyzes market conditions and position performance</li>
                <li>• Generates close signals when optimal exit conditions are met</li>
                <li>• Parent bot coordinates position closing across all child bots</li>
                <li>• Helps optimize exit timing beyond basic stop/take profit levels</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-sm text-blue-800">
            <strong>Strategy Overview:</strong> AI Signal Strategy uses advanced artificial
            intelligence to analyze trading charts and technical indicators. It generates
            high-probability trading signals by combining chart pattern recognition, technical
            analysis, and market sentiment. The AI scans multiple timeframes and applies
            sophisticated risk management to identify the best trading opportunities.
          </div>
        </div>
      </div>
    );
  }

  // Default/Custom Strategy Configuration
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="text-gray-500">
          Configuration form for {strategy.name} strategy is not yet implemented.
        </div>
        <div className="text-sm text-gray-400 mt-2">
          Please contact support for custom strategy configuration.
        </div>
      </div>
    </div>
  );
}
