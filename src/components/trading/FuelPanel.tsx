'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FuelBalance } from '@/services/fuel';
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

  const handleBuyFuel = () => {
    setIsFuelModalOpen(true);
  };

  const formatBalance = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
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
      </motion.div>

      {/* Fuel Packages Modal */}
      <FuelPackagesModal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} />
    </>
  );
}
