'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  LinkIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Transaction, TransactionType, TransactionStatus } from '../../services/wallet';
import walletService from '../../services/wallet';

interface TransactionListProps {
  userId?: string;
  limit?: number;
  showPagination?: boolean;
  filterType?: TransactionType;
  filterStatus?: TransactionStatus;
  className?: string;
}

// Transaction type configuration with colors and icons
const getTransactionTypeConfig = (type: TransactionType) => {
  const configs = {
    deposit: {
      icon: ArrowTrendingDownIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Deposit',
      direction: 'incoming'
    },
    crypto_deposit: {
      icon: ArrowTrendingDownIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Crypto Deposit',
      direction: 'incoming'
    },
    withdrawal: {
      icon: ArrowTrendingUpIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Withdrawal',
      direction: 'outgoing'
    },
    crypto_withdraw: {
      icon: ArrowTrendingUpIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Crypto Withdrawal',
      direction: 'outgoing'
    },
    transfer: {
      icon: ArrowsRightLeftIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Transfer',
      direction: 'neutral'
    },
    purchase: {
      icon: ShoppingCartIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      label: 'Purchase',
      direction: 'outgoing'
    },
    refund: {
      icon: BanknotesIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Refund',
      direction: 'incoming'
    },
    escrow_lock: {
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      label: 'Escrow Lock',
      direction: 'neutral'
    },
    escrow_release: {
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Escrow Release',
      direction: 'incoming'
    },
    fee: {
      icon: BanknotesIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Fee',
      direction: 'outgoing'
    },
    commission: {
      icon: BanknotesIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Commission',
      direction: 'incoming'
    },
  };
  
  return configs[type] || {
    icon: BanknotesIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Transaction',
    direction: 'neutral'
  };
};

// Transaction status configuration with colors
const getTransactionStatusConfig = (status: TransactionStatus) => {
  const configs = {
    pending: {
      color: 'text-orange-600 bg-orange-100',
      label: 'Pending',
      icon: ClockIcon
    },
    processing: {
      color: 'text-blue-600 bg-blue-100',
      label: 'Processing',
      icon: ClockIcon
    },
    completed: {
      color: 'text-green-600 bg-green-100',
      label: 'Completed',
      icon: CheckCircleIcon
    },
    failed: {
      color: 'text-red-600 bg-red-100',
      label: 'Failed',
      icon: XCircleIcon
    },
    cancelled: {
      color: 'text-gray-600 bg-gray-100',
      label: 'Cancelled',
      icon: XCircleIcon
    },
    expired: {
      color: 'text-red-600 bg-red-100',
      label: 'Expired',
      icon: ExclamationTriangleIcon
    },
  };
  
  return configs[status] || configs.pending;
};

// Format transaction amount with appropriate sign and color
const formatTransactionAmount = (transaction: Transaction, userId?: string) => {
  const typeConfig = getTransactionTypeConfig(transaction.type);
  const amount = transaction.amount.amount;
  const currency = transaction.amount.currency;
  
  // Determine if this is an incoming or outgoing transaction
  let isIncoming = typeConfig.direction === 'incoming';
  
  // For transfers, check counterparty to determine direction
  if (transaction.type === 'transfer' && userId) {
    isIncoming = transaction.counterparty_user_id !== userId;
  }
  
  const sign = isIncoming ? '+' : '-';
  const colorClass = isIncoming ? 'text-green-600' : 'text-red-600';
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: currency === 'USD' ? 'currency' : 'decimal',
    currency: currency === 'USD' ? 'USD' : undefined,
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === 'USD' ? 2 : 6,
  }).format(amount);
  
  return {
    display: `${sign}${formattedAmount}${currency !== 'USD' ? ` ${currency}` : ''}`,
    colorClass,
    isIncoming
  };
};

// Format date relative to now
const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const TransactionList: React.FC<TransactionListProps> = ({
  userId,
  limit = 20,
  showPagination = true,
  filterType,
  filterStatus,
  className = '',
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [currentPage, filterType, filterStatus, limit]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await walletService.getTransactions(
        currentPage,
        limit,
        filterType,
        filterStatus
      );
      
      setTransactions(response.transactions);
      setTotalPages(response.pagination.total_pages);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (txId: string) => {
    setExpandedTx(expandedTx === txId ? null : txId);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Transactions</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadTransactions}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">No Transactions Found</h3>
        <p className="text-gray-600">
          {filterType || filterStatus 
            ? 'No transactions match your current filters.'
            : 'You haven\'t made any transactions yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {transactions.map((transaction) => {
        const typeConfig = getTransactionTypeConfig(transaction.type);
        const statusConfig = getTransactionStatusConfig(transaction.status);
        const amountInfo = formatTransactionAmount(transaction, userId);
        const isExpanded = expandedTx === transaction.id;
        const IconComponent = typeConfig.icon;
        const StatusIconComponent = statusConfig.icon;

        return (
          <div
            key={transaction.id}
            className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 ${
              isExpanded ? 'ring-2 ring-blue-100' : ''
            }`}
          >
            {/* Main Transaction Row */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleExpanded(transaction.id)}
            >
              <div className="flex items-center space-x-4">
                {/* Transaction Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${typeConfig.bgColor} ${typeConfig.borderColor} border flex items-center justify-center`}>
                  <IconComponent className={`h-5 w-5 ${typeConfig.color}`} />
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {typeConfig.label}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIconComponent className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {transaction.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatRelativeDate(transaction.created_at)}
                    </span>
                    
                    {transaction.reference && (
                      <span className="text-xs text-gray-500 font-mono">
                        {transaction.reference.substring(0, 12)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount and Expand Icon */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-sm font-semibold ${amountInfo.colorClass}`}>
                    {amountInfo.display}
                  </div>
                  
                  {transaction.metadata?.fee_amount && (
                    <div className="text-xs text-gray-500 mt-1">
                      Fee: {walletService.formatCurrency(
                        transaction.metadata.fee_amount.amount,
                        transaction.metadata.fee_amount.currency
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end mt-2">
                    {isExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Transaction Details</h4>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">ID:</span>
                        <span className="font-mono">{transaction.id}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reference:</span>
                        <span className="font-mono">{transaction.reference}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span>{new Date(transaction.created_at).toLocaleString()}</span>
                      </div>
                      
                      {transaction.processed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Processed:</span>
                          <span>{new Date(transaction.processed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  {transaction.metadata && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">Additional Info</h4>
                      
                      <div className="space-y-1 text-xs">
                        {transaction.metadata.blockchain_tx_hash && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Tx Hash:</span>
                            <a
                              href={`#`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <span className="font-mono truncate max-w-24">
                                {transaction.metadata.blockchain_tx_hash.substring(0, 10)}...
                              </span>
                              <LinkIcon className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        )}
                        
                        {transaction.metadata.confirmations !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Confirmations:</span>
                            <span>{transaction.metadata.confirmations}</span>
                          </div>
                        )}
                        
                        {transaction.metadata.exchange_rate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Exchange Rate:</span>
                            <span>${transaction.metadata.exchange_rate.toFixed(4)}</span>
                          </div>
                        )}
                        
                        {transaction.counterparty_user_id && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Counterparty:</span>
                            <span className="font-mono">
                              {transaction.counterparty_user_id.substring(0, 8)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {transaction.metadata?.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                      {transaction.metadata.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page{' '}
                <span className="font-medium">{currentPage}</span>{' '}
                of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;