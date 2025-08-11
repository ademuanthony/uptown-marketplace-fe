'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  WalletIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import WalletCard from '../../components/wallet/WalletCard';
import PointsCard from '../../components/wallet/PointsCard';
import TransactionList from '../../components/wallet/TransactionList';
import DepositModal from '../../components/wallet/DepositModal';
import WithdrawalForm from '../../components/wallet/WithdrawalForm';
import walletService, {
  WalletSummary,
  TransactionType,
  TransactionStatus,
} from '../../services/wallet';
import loyaltyService, { LoyaltyAccount } from '../../services/loyalty';
import { useAuth } from '../../contexts/AuthContext';
import { DepositCurrency } from '@/services/deposits';

type ViewMode = 'overview' | 'deposit' | 'withdraw' | 'transfer';

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Modals and forms
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState<string | null>(null);

  // Transaction filters
  const [transactionFilters, setTransactionFilters] = useState<{
    type?: TransactionType;
    status?: TransactionStatus;
    search?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load wallet and loyalty data in parallel
      const [summary, loyalty] = await Promise.allSettled([
        walletService.getWalletSummary(),
        loyaltyService.getLoyaltyAccount(),
      ]);

      // Set wallet summary
      if (summary.status === 'fulfilled') {
        setWalletSummary(summary.value);
      } else {
        console.error('Failed to load wallet summary:', summary.reason);
      }

      // Set loyalty account (don't fail if loyalty service is unavailable)
      if (loyalty.status === 'fulfilled') {
        setLoyaltyAccount(loyalty.value);
      } else {
        console.warn('Failed to load loyalty points:', loyalty.reason);
        // Set default empty loyalty account
        setLoyaltyAccount({
          user_id: user?.id || '',
          total_points: 0,
          available_points: 0,
          pending_points: 0,
          lifetime_earned: 0,
          lifetime_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          currency: 'PNT',
        });
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'deposit') {
      setShowDepositModal(true);
    }
  };

  const handleDepositModalClose = () => {
    setShowDepositModal(false);
    if (viewMode === 'deposit') {
      setViewMode('overview');
    }
  };

  const handleWithdrawalSuccess = (transactionId: string) => {
    setShowWithdrawalSuccess(transactionId);
    setViewMode('overview');
    loadWalletData(); // Refresh wallet data
  };

  const handleWithdrawalCancel = () => {
    setViewMode('overview');
  };

  // const getExchangeRates = async () => {
  //   try {
  //     return await walletService.getExchangeRates();
  //   } catch (err) {
  //     console.error('Failed to get exchange rates:', err);
  //     return { usdt_usd: 1, pol_usd: 0.5 }; // Fallback rates
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Wallet</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadWalletData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <WalletIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
                <p className="text-sm text-gray-600">
                  Total Balance:{' '}
                  {walletSummary ? `$${walletSummary.summary.total_value.display}` : '--'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleViewModeChange('deposit')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Deposit
              </button>

              <button
                onClick={() => handleViewModeChange('withdraw')}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Withdraw
              </button>

              <button
                onClick={() => handleViewModeChange('transfer')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                Transfer
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          {viewMode !== 'overview' && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setViewMode('overview')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 pb-2 border-b-2 border-blue-500"
                >
                  ← Back to Overview
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {viewMode === 'overview' && (
          <>
            {/* Balance Cards */}
            {walletSummary && loyaltyAccount && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Currency Cards */}
                {(['USDT', 'POL', 'USD'] as const).map(currency => {
                  // Find existing wallet data for this currency
                  const existingWallet = walletSummary.wallets.find(w => w.currency === currency);

                  if (existingWallet) {
                    // Show actual wallet data
                    return (
                      <WalletCard
                        key={currency}
                        currency={currency as DepositCurrency}
                        balance={existingWallet.available.display}
                        usdEquivalent={existingWallet.usd_value.display}
                        pendingDeposits={existingWallet.pending.display}
                        priceChange24h={existingWallet.percent_change_24h}
                        showUSDEquivalent={currency !== 'USD'}
                      />
                    );
                  } else {
                    // Show zero balance card with proper defaults
                    return (
                      <WalletCard
                        key={currency}
                        currency={currency as DepositCurrency}
                        balance={0}
                        usdEquivalent={0}
                        pendingDeposits={0}
                        priceChange24h={0}
                        showUSDEquivalent={currency !== 'USD'}
                      />
                    );
                  }
                })}

                {/* Loyalty Points Card */}
                <PointsCard
                  balance={loyaltyAccount.available_points / 1e2}
                  lifetimeEarned={loyaltyAccount.lifetime_earned / 1e2}
                  lifetimeSpent={loyaltyAccount.lifetime_spent / 1e2}
                  isLoading={loading}
                />
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => handleViewModeChange('deposit')}
                  className="p-4 rounded-lg border-2 border-dashed border-green-300 text-green-700 hover:border-green-400 hover:bg-green-50 transition-all"
                >
                  <ArrowDownTrayIcon className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Deposit Crypto</div>
                  <div className="text-sm opacity-75">Add funds to wallet</div>
                </button>

                <button
                  onClick={() => handleViewModeChange('withdraw')}
                  className="p-4 rounded-lg border-2 border-dashed border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 transition-all"
                >
                  <ArrowUpTrayIcon className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Withdraw Crypto</div>
                  <div className="text-sm opacity-75">Send to external wallet</div>
                </button>

                <button
                  onClick={() => handleViewModeChange('transfer')}
                  className="p-4 rounded-lg border-2 border-dashed border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <ArrowsRightLeftIcon className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Transfer Funds</div>
                  <div className="text-sm opacity-75">Send to other users</div>
                </button>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={transactionFilters.search || ''}
                      onChange={e =>
                        setTransactionFilters(prev => ({ ...prev, search: e.target.value }))
                      }
                      className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 w-48"
                    />
                  </div>

                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm transition-colors ${
                      showFilters
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filters
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction Type
                      </label>
                      <select
                        value={transactionFilters.type || ''}
                        onChange={e =>
                          setTransactionFilters(prev => ({
                            ...prev,
                            type: (e.target.value as TransactionType) || undefined,
                          }))
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Types</option>
                        <option value="deposit">Deposits</option>
                        <option value="withdrawal">Withdrawals</option>
                        <option value="transfer">Transfers</option>
                        <option value="purchase">Purchases</option>
                        <option value="refund">Refunds</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={transactionFilters.status || ''}
                        onChange={e =>
                          setTransactionFilters(prev => ({
                            ...prev,
                            status: (e.target.value as TransactionStatus) || undefined,
                          }))
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-3">
                    <button
                      onClick={() => setTransactionFilters({})}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Transaction List */}
              <TransactionList
                userId={user?.id || ''}
                filterType={transactionFilters.type}
                filterStatus={transactionFilters.status}
                limit={20}
                showPagination={true}
              />
            </div>
          </>
        )}

        {/* Withdrawal Form */}
        {viewMode === 'withdraw' && (
          <div className="max-w-2xl mx-auto">
            <WithdrawalForm
              onSuccess={handleWithdrawalSuccess}
              onCancel={handleWithdrawalCancel}
              className="mt-6"
            />
          </div>
        )}

        {/* Transfer Form (Placeholder) */}
        {viewMode === 'transfer' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <ArrowsRightLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transfer Funds</h3>
              <p className="text-gray-600 mb-6">
                Transfer functionality is coming soon. You&apos;ll be able to send funds to other
                Uptown Marketplace users.
              </p>
              <button
                onClick={() => setViewMode('overview')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Overview
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showWithdrawalSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowUpTrayIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Withdrawal Submitted</h3>
              <p className="text-gray-600 mb-4">
                Your withdrawal request has been submitted successfully. You&apos;ll receive updates
                on its progress.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">Transaction ID:</p>
                <p className="text-sm font-mono text-gray-900">{showWithdrawalSuccess}</p>
              </div>
              <button
                onClick={() => setShowWithdrawalSuccess(null)}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={handleDepositModalClose}
        initialCurrency="USDT"
        initialNetwork="polygon"
      />
    </div>
  );
};

export default WalletPage;
