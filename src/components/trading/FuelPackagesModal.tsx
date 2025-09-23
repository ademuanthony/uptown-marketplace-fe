'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import fuelService, { FuelPackage } from '@/services/fuel';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';

interface FuelPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FuelPackagesModal({ isOpen, onClose }: FuelPackagesModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<FuelPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch fuel packages
  const {
    data: packages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['fuel', 'packages'],
    queryFn: () => fuelService.getFuelPackages(),
    enabled: isOpen,
  });

  const handlePackageSelect = (pkg: FuelPackage) => {
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsPurchasing(true);
    try {
      const result = await fuelService.purchaseFuel(selectedPackage.id);

      // Show success message
      toast.success('Fuel purchase initiated! You will be redirected to payment.');

      // Invalidate fuel balance query to refresh data
      queryClient.invalidateQueries({ queryKey: ['fuel', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['fuel', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fuel', 'summary'] });

      // Redirect to payment page (invoice)
      if (result.invoice?.id) {
        window.location.href = `/invoices/${result.invoice.id}`;
      }

      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFuelAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Buy Fuel</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Choose a fuel package to power your trading activities
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-400">
              Failed to load fuel packages. Please try again.
            </p>
          </div>
        )}

        {/* Packages Grid */}
        {packages && packages.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages
              .filter(pkg => pkg.status === 'active')
              .sort((a, b) => a.display_order - b.display_order)
              .map(pkg => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePackageSelect(pkg)}
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                    selectedPackage?.id === pkg.id
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Popular Badge */}
                  {pkg.is_popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 transform">
                      <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-medium text-white">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Package Content */}
                  <div className="text-center">
                    {/* Fuel Amount */}
                    <div className="mb-3">
                      <div className="flex items-center justify-center">
                        <svg
                          className="mr-2 h-6 w-6 text-yellow-500"
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {pkg.name}
                        </h3>
                      </div>
                    </div>

                    {/* Fuel Details */}
                    <div className="mb-4 space-y-2">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatFuelAmount(pkg.fuel_amount)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Base Fuel</p>
                      </div>

                      {pkg.bonus_fuel > 0 && (
                        <div>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            +{formatFuelAmount(pkg.bonus_fuel)} Bonus
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Free bonus fuel
                          </p>
                        </div>
                      )}

                      <div className="border-t pt-2 dark:border-gray-700">
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {formatFuelAmount(pkg.fuel_amount + pkg.bonus_fuel)} Total
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(pkg.price.amount, pkg.price.currency)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ≈ {(pkg.price.amount / (pkg.fuel_amount + pkg.bonus_fuel)).toFixed(2)} per
                        fuel
                      </p>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
                    )}

                    {/* Selection Indicator */}
                    {selectedPackage?.id === pkg.id && (
                      <div className="mt-3">
                        <div className="flex items-center justify-center">
                          <svg
                            className="h-5 w-5 text-blue-600 dark:text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                            Selected
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        {/* Empty State */}
        {packages && packages.length === 0 && (
          <div className="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No fuel packages available
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Fuel packages are currently unavailable. Please check back later.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPurchasing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!selectedPackage || isPurchasing}
            loading={isPurchasing}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          >
            {isPurchasing ? 'Processing...' : 'Purchase Fuel'}
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
