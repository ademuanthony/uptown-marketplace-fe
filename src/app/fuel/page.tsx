'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import fuelService, {
  type FuelBalance,
  type FuelPackage,
  type FuelTransaction,
  type TransactionSummary,
  type PurchaseFuelResponse
} from '@/services/fuel';
import { 
  BoltIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ShoppingCartIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface FuelPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: FuelPackage[];
  onPurchase: (packageId: string) => Promise<void>;
  isLoading: boolean;
}

const FuelPurchaseModal: React.FC<FuelPurchaseModalProps> = ({ 
  isOpen, 
  onClose, 
  packages, 
  onPurchase, 
  isLoading 
}) => {
  if (!isOpen) return null;

  console.log('packages', packages);  

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Buy Fuel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {Array.isArray(packages) && packages.length > 0 ? packages.filter(pkg => pkg.status === 'active').map((pkg) => (
            <div
              key={pkg.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                  <p className="text-sm text-gray-500">
                    {pkg.fuel_amount.toLocaleString()} fuel units
                  </p>
                  {pkg.description && (
                    <p className="text-xs text-gray-400 mt-1">{pkg.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary-600">
                    {formatCurrency(pkg.price.amount, pkg.price.currency)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onPurchase(pkg.id)}
                disabled={isLoading}
                className="w-full mt-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Select Package'}
              </button>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">No fuel packages available</p>
              <p className="text-sm">Please check back later or contact support</p>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          After purchase, you&apos;ll be redirected to complete payment
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-primary-100 text-primary-700 border border-primary-200'
        : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);


const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'purchase':
      return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
    case 'spend':
      return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
    case 'refund':
      return <ArrowUpIcon className="h-4 w-4 text-blue-600" />;
    default:
      return <BoltIcon className="h-4 w-4 text-gray-600" />;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'purchase':
      return 'text-green-600';
    case 'spend':
      return 'text-red-600';
    case 'refund':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export default function FuelPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [balance, setBalance] = useState<FuelBalance | null>(null);
  const [packages, setPackages] = useState<FuelPackage[]>([]);
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPagination, setTransactionPagination] = useState<{
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    if (!authLoading && user) {
      loadFuelData();
    }
  }, [user, authLoading]);

  // Load transaction history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && user) {
      loadTransactionHistory(transactionPage);
    }
  }, [activeTab, transactionPage, user]);

  const loadFuelData = async () => {
    try {
      setLoading(true);
      const [balanceData, packagesData, summaryData] = await Promise.all([
        fuelService.getFuelBalance(),
        fuelService.getFuelPackages(),
        fuelService.getTransactionSummary()
      ]);

      setBalance(balanceData);
      console.log('packagesData', packagesData);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load fuel data:', error);
      toast.error('Failed to load fuel data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async (page: number = 1) => {
    try {
      const historyData = await fuelService.getTransactionHistory(page, 10);
      setTransactions(Array.isArray(historyData.transactions) ? historyData.transactions : []);
      setTransactionPagination(historyData.pagination);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      toast.error('Failed to load transaction history');
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchaseLoading(true);
      const purchaseResponse: PurchaseFuelResponse = await fuelService.purchaseFuel(packageId);
      
      // Show success message
      toast.success('Purchase initiated! Redirecting to payment...');
      
      // Close modal
      setShowPurchaseModal(false);
      
      // Redirect to invoice payment page
      window.location.href = `/invoices/${purchaseResponse.invoice.id}`;
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BoltIcon className="h-12 w-12 text-primary-600 mx-auto animate-pulse" />
          <p className="mt-2 text-gray-600">Loading fuel data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BoltIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-600">Please log in to view your fuel account</p>
          <Link 
            href="/auth/login"
            className="mt-4 inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BoltIcon className="h-8 w-8 text-primary-600 mr-3" />
            Fuel Account
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your fuel balance and purchase fuel for chat and promotions
          </p>
        </div>

        {/* Balance and Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Balance */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BoltIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {balance?.balance ? balance.balance.toLocaleString() : '0'}
                </p>
                <p className="text-xs text-gray-400">fuel units</p>
              </div>
            </div>
            {balance && (
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {formatDate(balance.last_updated)}
              </p>
            )}
          </div>

          {/* Total Purchases */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Purchased</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.total_purchases ? summary.total_purchases.toLocaleString() : '0'}
                </p>
                <p className="text-xs text-gray-400">fuel units</p>
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.total_spending ? summary.total_spending.toLocaleString() : '0'}
                </p>
                <p className="text-xs text-gray-400">fuel units</p>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Fuel Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            Buy Fuel
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <TabButton 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              <EyeIcon className="h-4 w-4 mr-2 inline" />
              Overview
            </TabButton>
            <TabButton 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')}
            >
              <ClockIcon className="h-4 w-4 mr-2 inline" />
              Transaction History
            </TabButton>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Overview</h2>
            
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Account Statistics</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Total Transactions:</dt>
                      <dd className="text-sm font-medium text-gray-900">{summary?.transaction_count || 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Current Balance:</dt>
                      <dd className="text-sm font-medium text-gray-900">{summary?.current_balance ? summary.current_balance.toLocaleString() : '0'} units</dd>
                    </div>
                    {summary?.last_transaction_date && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Last Transaction:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {formatDate(summary?.last_transaction_date)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">How Fuel Works</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use fuel units to send messages in chat</li>
                    <li>• Promote your products with fuel</li>
                    <li>• Get better visibility in search results</li>
                    <li>• Participate in premium features</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
            </div>

            {Array.isArray(transactions) && transactions.length > 0 ? (
              <>
                <div className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-sm font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type === 'spend' ? '-' : '+'}
                          {transaction.amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Balance: {transaction.balance_after?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {transactionPagination && transactionPagination.total_pages > 1 && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">
                        Page {transactionPagination.page} of {transactionPagination.total_pages}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setTransactionPage(transactionPage - 1)}
                          disabled={transactionPage <= 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setTransactionPage(transactionPage + 1)}
                          disabled={transactionPage >= transactionPagination.total_pages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center">
                <BoltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Purchase fuel to get started with premium features
                </p>
              </div>
            )}
          </div>
        )}

        {/* Purchase Modal */}
        <FuelPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          packages={packages}
          onPurchase={handlePurchase}
          isLoading={purchaseLoading}
        />
      </div>
    </div>
  );
}