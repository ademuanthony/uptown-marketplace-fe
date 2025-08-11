'use client';

import { useState } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface WalletCardProps {
  currency: 'USDT' | 'POL' | 'USD';
  balance: number;
  usdEquivalent?: number;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
  priceChange24h?: number;
  isLoading?: boolean;
  showUSDEquivalent?: boolean;
}

// Currency-specific styling
const getCurrencyStyle = (currency: string) => {
  const styles = {
    USDT: {
      background: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'text-green-600',
      icon: '💰',
      color: '#10B981',
    },
    POL: {
      background: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-800',
      accent: 'text-purple-600',
      icon: '🔷',
      color: '#8B5CF6',
    },
    USD: {
      background: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'text-blue-600',
      icon: '💵',
      color: '#3B82F6',
    },
  };
  
  return styles[currency as keyof typeof styles] || styles.USD;
};

// Format number with appropriate decimals
const formatNumber = (num: number, currency: string): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
  
  // For crypto currencies, show more decimals for small amounts
  const decimals = num < 1 ? 6 : num < 100 ? 4 : 2;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(num);
};

const WalletCard: React.FC<WalletCardProps> = ({
  currency,
  balance,
  usdEquivalent,
  pendingDeposits = 0,
  pendingWithdrawals = 0,
  priceChange24h,
  isLoading = false,
  showUSDEquivalent = true,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const style = getCurrencyStyle(currency);
  
  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };
  
  // Calculate total pending amount
  const totalPending = pendingDeposits + pendingWithdrawals;
  const hasPending = totalPending > 0;

  if (isLoading) {
    return (
      <div className={`${style.background} ${style.border} border rounded-xl p-6 animate-pulse`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="w-16 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="w-32 h-8 bg-gray-300 rounded"></div>
          <div className="w-24 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${style.background} ${style.border} border rounded-xl p-6 hover:shadow-lg transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg">
            {style.icon}
          </div>
          <div>
            <h3 className={`font-semibold ${style.text}`}>{currency}</h3>
            {currency !== 'USD' && (
              <p className="text-xs text-gray-500">
                {currency === 'USDT' ? 'Tether USD' : 'Polygon'}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={toggleBalanceVisibility}
          className={`p-2 rounded-lg hover:bg-white/50 transition-colors ${style.text}`}
          aria-label={showBalance ? 'Hide balance' : 'Show balance'}
        >
          {showBalance ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${style.text}`}>
            {showBalance ? (
              currency === 'USD' ? formatNumber(balance, currency) : formatNumber(balance, currency)
            ) : (
              '••••••'
            )}
          </span>
          {currency !== 'USD' && (
            <span className={`text-sm ${style.accent}`}>{currency}</span>
          )}
        </div>
        
        {/* USD Equivalent */}
        {showUSDEquivalent && currency !== 'USD' && usdEquivalent !== undefined && (
          <p className="text-sm text-gray-600 mt-1">
            {showBalance ? formatNumber(usdEquivalent, 'USD') : '••••••'}
          </p>
        )}
      </div>

      {/* Price Change */}
      {priceChange24h !== undefined && currency !== 'USD' && (
        <div className="flex items-center space-x-1 mb-3">
          {priceChange24h >= 0 ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
          </span>
          <span className="text-xs text-gray-500">24h</span>
        </div>
      )}

      {/* Pending Transactions */}
      {hasPending && (
        <div className="border-t border-white/30 pt-3">
          <div className="flex items-center space-x-1 mb-2">
            <ClockIcon className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Pending</span>
          </div>
          
          <div className="space-y-1">
            {pendingDeposits > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Deposits</span>
                <span className="text-xs font-medium text-green-600">
                  +{formatNumber(pendingDeposits, currency)}
                </span>
              </div>
            )}
            
            {pendingWithdrawals > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Withdrawals</span>
                <span className="text-xs font-medium text-red-600">
                  -{formatNumber(pendingWithdrawals, currency)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;