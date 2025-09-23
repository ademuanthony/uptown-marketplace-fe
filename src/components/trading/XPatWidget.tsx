'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { tradingBotService, TradingBot } from '@/services/tradingBot';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';

interface XPatWidgetProps {
  bot?: TradingBot | null;
  isLoading?: boolean;
  onStartTrading: () => void;
  className?: string;
}

export default function XPatWidget({
  bot,
  isLoading,
  onStartTrading,
  className = '',
}: XPatWidgetProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  // Note: Statistics can be fetched later if needed

  // Fetch bot positions if bot exists
  const { data: positions } = useQuery({
    queryKey: ['trading-bots', 'positions', bot?.id],
    queryFn: () => tradingBotService.getBotPositions(bot!.id),
    enabled: !!bot?.id,
  });

  const handleStartBot = async () => {
    if (!bot) return;

    setIsStarting(true);
    try {
      await tradingBotService.startBot(bot.id);
      toast.success('XPat Trader bot started successfully!');

      // Refresh the bot data
      window.location.reload();
    } catch (error) {
      console.error('Failed to start bot:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start bot');
    } finally {
      setIsStarting(false);
    }
  };

  const handlePauseBot = async () => {
    if (!bot) return;

    setIsPausing(true);
    try {
      await tradingBotService.pauseBot(bot.id);
      toast.success('XPat Trader bot paused successfully!');

      // Refresh the bot data
      window.location.reload();
    } catch (error) {
      console.error('Failed to pause bot:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to pause bot');
    } finally {
      setIsPausing(false);
    }
  };

  const handleResumeBot = async () => {
    if (!bot) return;

    setIsStarting(true);
    try {
      await tradingBotService.resumeBot(bot.id);
      toast.success('XPat Trader bot resumed successfully!');

      // Refresh the bot data
      window.location.reload();
    } catch (error) {
      console.error('Failed to resume bot:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resume bot');
    } finally {
      setIsStarting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600 dark:text-green-400';
    if (pnl < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">XPat Trader</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Expert pattern recognition</p>
          </div>
        </div>

        {/* Status Badge */}
        {bot && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(bot.status)}`}
          >
            {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* No Bot State - Setup Required */}
      {!isLoading && !bot && (
        <div className="text-center py-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Setup XPat Trader
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Connect your exchange and start intelligent pattern-based trading with our XPat
            strategy.
          </p>
          <Button
            onClick={onStartTrading}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Connect Exchange
          </Button>
        </div>
      )}

      {/* Bot Exists - Show Stats and Controls */}
      {!isLoading && bot && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total P&L
              </p>
              <p className={`mt-1 text-lg font-semibold ${getPnLColor(bot.total_profit_loss)}`}>
                {formatCurrency(bot.total_profit_loss)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Win Rate
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatPercentage(
                  bot.total_trades > 0 ? (bot.winning_trades / bot.total_trades) * 100 : 0,
                )}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Trades
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {bot.total_trades.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Balance
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(bot.current_balance)}
              </p>
            </div>
          </div>

          {/* Active Positions */}
          {positions && positions.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Positions ({positions.length})
              </h4>
              <div className="space-y-2">
                {positions.slice(0, 3).map(position => (
                  <div
                    key={position.id}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {position.symbol}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {position.side.toUpperCase()} • ${position.entry_price.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPnLColor(position.unrealized_pnl)}`}>
                        {formatCurrency(position.unrealized_pnl)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {position.quantity.toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
                {positions.length > 3 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    +{positions.length - 3} more positions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bot Controls */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {bot.status === 'draft' || bot.status === 'stopped' ? (
              <Button
                onClick={handleStartBot}
                loading={isStarting}
                disabled={isStarting}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Start Trading
              </Button>
            ) : bot.status === 'running' ? (
              <Button
                onClick={handlePauseBot}
                loading={isPausing}
                disabled={isPausing}
                variant="outline"
                className="flex-1"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Pause Bot
              </Button>
            ) : bot.status === 'paused' ? (
              <Button
                onClick={handleResumeBot}
                loading={isStarting}
                disabled={isStarting}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Resume Bot
              </Button>
            ) : null}

            <Button
              onClick={() => {
                window.location.href = `/trading-bots/${bot.id}`;
              }}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              View Details
            </Button>
          </div>

          {/* Last Activity */}
          {bot.last_trade_at && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last trade: {new Date(bot.last_trade_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
