'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import fuelService, { FuelBalance } from '@/services/fuel';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import FuelPackagesModal from './FuelPackagesModal';

interface FuelPanelProps {
  balance?: FuelBalance;
  isLoading?: boolean;
  className?: string;
}

export default function FuelPanel({ balance, isLoading, className = '' }: FuelPanelProps) {
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);

  // Fetch recent transactions
  const { data: transactionData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['fuel', 'transactions', 'recent'],
    queryFn: () => fuelService.getTransactionHistory(1, 5),
  });

  // Fetch transaction summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['fuel', 'summary'],
    queryFn: () => fuelService.getTransactionSummary(),
  });

  const handleBuyFuel = () => {
    setIsFuelModalOpen(true);
  };

  const formatBalance = (amount: number) => {
    return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800 ${className}`}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 p-2">
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
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fuel Balance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Power your trading activities
              </p>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
                  {formatBalance(balance?.balance || 0)}
                </span>
                <span className="ml-2 text-lg text-gray-500 dark:text-gray-400">Fuel</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated:{' '}
                {balance?.last_updated
                  ? new Date(balance.last_updated).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          )}
        </div>

        {/* Buy Fuel Button */}
        <div className="mb-6">
          <Button
            onClick={handleBuyFuel}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 focus:ring-yellow-300"
            size="lg"
            disabled={isLoading}
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Buy Fuel
          </Button>
        </div>

        {/* Quick Stats */}
        {summary && !isSummaryLoading && (
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Spent
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatBalance(summary.total_spending)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Purchased
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {formatBalance(summary.total_purchases)}
              </p>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {isTransactionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : transactionData?.transactions && transactionData.transactions.length > 0 ? (
              transactionData.transactions.slice(0, 3).map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        transaction.transaction_type === 'purchase'
                          ? 'bg-green-500'
                          : transaction.transaction_type === 'spend'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.transaction_type === 'purchase'
                          ? 'Fuel Purchase'
                          : transaction.transaction_type === 'spend'
                            ? 'Fuel Used'
                            : 'Fuel Refund'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        transaction.transaction_type === 'purchase'
                          ? 'text-green-600 dark:text-green-400'
                          : transaction.transaction_type === 'spend'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {transaction.transaction_type === 'spend' ? '-' : '+'}
                      {formatBalance(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md bg-gray-50 p-4 text-center dark:bg-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent transactions</p>
              </div>
            )}
          </div>

          {/* View All Transactions Link */}
          {transactionData?.transactions && transactionData.transactions.length > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  // Navigate to fuel transactions page
                  window.location.href = '/fuel/transactions';
                }}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all transactions
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Fuel Packages Modal */}
      <FuelPackagesModal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} />
    </>
  );
}
