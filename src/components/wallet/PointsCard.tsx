'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, StarIcon, TrophyIcon, GiftIcon } from '@heroicons/react/24/outline';

interface PointsCardProps {
  balance: number;
  lifetimeEarned?: number;
  lifetimeSpent?: number;
  isLoading?: boolean;
}

// Format points number
const formatPoints = (points: number): string => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US').format(points);
};

const PointsCard: React.FC<PointsCardProps> = ({
  balance,
  lifetimeEarned = 0,
  lifetimeSpent = 0,
  isLoading = false,
}) => {
  const [showBalance, setShowBalance] = useState(true);

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 rounded-xl p-6 animate-pulse">
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
    <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-yellow-200">
            <StarIcon className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800">PNT</h3>
            <p className="text-xs text-gray-500">Loyalty Points</p>
          </div>
        </div>

        <button
          onClick={toggleBalanceVisibility}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors text-yellow-800"
          aria-label={showBalance ? 'Hide balance' : 'Show balance'}
        >
          {showBalance ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-yellow-800">
            {showBalance ? formatPoints(balance) : '••••••'}
          </span>
          <span className="text-sm text-yellow-600">PNT</span>
        </div>

        <p className="text-sm text-gray-600 mt-1">Loyalty Points Balance</p>
      </div>

      {/* Lifetime Stats */}
      {(lifetimeEarned > 0 || lifetimeSpent > 0) && (
        <div className="border-t border-white/30 pt-3">
          <div className="flex items-center space-x-1 mb-2">
            <TrophyIcon className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Lifetime Stats</span>
          </div>

          <div className="space-y-1">
            {lifetimeEarned > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 flex items-center space-x-1">
                  <GiftIcon className="h-3 w-3" />
                  <span>Earned</span>
                </span>
                <span className="text-xs font-medium text-green-600">
                  {showBalance ? formatPoints(lifetimeEarned) : '••••'}
                </span>
              </div>
            )}

            {lifetimeSpent > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Spent</span>
                <span className="text-xs font-medium text-amber-600">
                  {showBalance ? formatPoints(lifetimeSpent) : '••••'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Points Info */}
      <div className="mt-4 bg-yellow-100/50 rounded-lg p-3 border border-yellow-200/50">
        <div className="flex items-center space-x-2">
          <StarIcon className="h-4 w-4 text-yellow-600" />
          <span className="text-xs font-medium text-yellow-800">How to earn points:</span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          • Daily check-ins • Referrals • Premium purchases • Community activities
        </p>
      </div>
    </div>
  );
};

export default PointsCard;
