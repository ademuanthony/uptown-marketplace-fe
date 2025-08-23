'use client';

import { SupportedStrategy } from '@/services/tradingBot';

interface StrategyConfigFormProps {
  strategy: SupportedStrategy;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export default function StrategyConfigForm({
  strategy,
  config,
  onChange,
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
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="take_profit_percentage"
              className="block text-sm font-medium text-gray-700"
            >
              Take Profit Percentage (%) *
            </label>
            <input
              type="number"
              id="take_profit_percentage"
              min="0.1"
              max="100"
              step="0.1"
              value={getNumberValue('take_profit_percentage', 5.0)}
              onChange={e =>
                updateConfig('take_profit_percentage', parseFloat(e.target.value) || 0)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="5.0"
            />
            <p className="mt-1 text-xs text-gray-500">
              Target profit percentage before taking profits
            </p>
          </div>

          <div>
            <label
              htmlFor="pull_back_percentage"
              className="block text-sm font-medium text-gray-700"
            >
              Pull Back Percentage (%) *
            </label>
            <input
              type="number"
              id="pull_back_percentage"
              min="0.1"
              max="50"
              step="0.1"
              value={getNumberValue('pull_back_percentage', 3.0)}
              onChange={e => updateConfig('pull_back_percentage', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="3.0"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum allowed pullback before exit</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-sm text-yellow-800">
            <strong>Strategy Overview:</strong> The Alpha Compounder strategy aims to compound gains
            by taking profits at specified levels while allowing for controlled pullbacks. It&apos;s
            designed for trending markets with moderate volatility.
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
