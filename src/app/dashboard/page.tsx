'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { tradingBotService } from '@/services/tradingBot';
import fuelService from '@/services/fuel';
import FuelPanel from '@/components/trading/FuelPanel';
import AlphaCompounderWidget from '@/components/trading/AlphaCompounderWidget';
import XPatWidget from '@/components/trading/XPatWidget';
import ExchangeConnectionModal from '@/components/trading/ExchangeConnectionModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

export default function TradingBotDashboard() {
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [selectedBotType, setSelectedBotType] = useState<'alpha-compounder' | 'xpat-trader' | null>(
    null,
  );

  // Fetch fuel balance
  const {
    data: fuelBalance,
    isLoading: isFuelLoading,
    error: fuelError,
  } = useQuery({
    queryKey: ['fuel', 'balance'],
    queryFn: () => fuelService.getFuelBalance(),
  });

  // Fetch user's trading bots
  const {
    data: tradingBots,
    isLoading: isBotsLoading,
    error: botsError,
  } = useQuery({
    queryKey: ['trading-bots', 'user'],
    queryFn: () => tradingBotService.getUserBots(),
  });

  // Fetch Alpha Compounder default bot
  const { data: alphaBot, isLoading: isAlphaLoading } = useQuery({
    queryKey: ['trading-bots', 'default', 'alpha-compounder'],
    queryFn: () => tradingBotService.getUserDefaultBot('alpha-compounder'),
  });

  // Fetch XPat default bot
  const { data: xpatBot, isLoading: isXpatLoading } = useQuery({
    queryKey: ['trading-bots', 'default', 'xpat-trader'],
    queryFn: () => tradingBotService.getUserDefaultBot('xpat-trader'),
  });

  const handleStartTrading = (botType: 'alpha-compounder' | 'xpat-trader') => {
    setSelectedBotType(botType);
    setIsExchangeModalOpen(true);
  };

  const handleExchangeModalClose = () => {
    setIsExchangeModalOpen(false);
    setSelectedBotType(null);
  };

  if (isFuelLoading || isBotsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (fuelError || botsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorMessage
          message={fuelError?.message || botsError?.message || 'Failed to load dashboard data'}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Trading Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your trading bots and fuel balance in one place
          </p>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Fuel Panel - Full width on mobile, spans 1 column on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <FuelPanel balance={fuelBalance} isLoading={isFuelLoading} className="h-full" />
          </motion.div>

          {/* Trading Strategies - Stack on mobile, side by side on tablet/desktop */}
          <div className="space-y-6 lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            {/* Alpha Compounder Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AlphaCompounderWidget
                bot={alphaBot}
                isLoading={isAlphaLoading}
                onStartTrading={() => handleStartTrading('alpha-compounder')}
                className="h-full"
              />
            </motion.div>

            {/* XPat Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <XPatWidget
                bot={xpatBot}
                isLoading={isXpatLoading}
                onStartTrading={() => handleStartTrading('xpat-trader')}
                className="h-full"
              />
            </motion.div>
          </div>
        </div>

        {/* Quick Stats Section - Mobile optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Total Bots */}
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-900/20">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bots</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tradingBots?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Active Bots */}
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <div className="rounded-md bg-green-50 p-2 dark:bg-green-900/20">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Bots</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tradingBots?.filter(bot => bot.status === 'running').length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Fuel Balance */}
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <div className="rounded-md bg-yellow-50 p-2 dark:bg-yellow-900/20">
                <svg
                  className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuel Balance</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {fuelBalance?.balance.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Total P&L */}
          <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center">
              <div className="rounded-md bg-purple-50 p-2 dark:bg-purple-900/20">
                <svg
                  className="h-5 w-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total P&L</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  $
                  {tradingBots?.reduce((sum, bot) => sum + bot.total_profit_loss, 0)?.toFixed(2) ||
                    '0.00'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exchange Connection Modal */}
      <ExchangeConnectionModal
        isOpen={isExchangeModalOpen}
        onClose={handleExchangeModalClose}
        botType={selectedBotType}
      />
    </div>
  );
}
