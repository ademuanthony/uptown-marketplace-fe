'use client';

import { useState, useEffect } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  StarIcon,
  TrophyIcon,
  GiftIcon,
  FireIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import checkInService, { CheckInStatsResponse } from '../../services/checkIn';

interface PointsCardProps {
  balance: number;
  lifetimeEarned?: number;
  lifetimeSpent?: number;
  isLoading?: boolean;
  onBalanceUpdate?: (newBalance: number) => void;
  refreshTrigger?: number; // Used to trigger stats refresh
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
  onBalanceUpdate,
  refreshTrigger = 0,
}) => {
  const [showBalance, setShowBalance] = useState(true);

  // Check-in related state
  const [checkInStats, setCheckInStats] = useState<CheckInStatsResponse | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  const loadCheckInStats = async () => {
    try {
      setLoadingStats(true);
      const stats = await checkInService.getCheckInStats();
      setCheckInStats(stats);
    } catch (error) {
      console.error('Failed to load check-in stats:', error);
      // Don't show error for stats loading - just use defaults
      setCheckInStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load check-in stats on component mount and when refresh trigger changes
  useEffect(() => {
    loadCheckInStats();
  }, [refreshTrigger]);

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      setCheckInError(null);

      // Get device info
      const deviceInfo = navigator.userAgent;

      const result = await checkInService.performCheckIn(deviceInfo);

      // Update check-in stats
      await loadCheckInStats();

      // Update balance if callback provided
      if (onBalanceUpdate && result.points_earned) {
        onBalanceUpdate(balance + result.points_earned);
      }

      // Show success state
      setCheckInSuccess(true);
      setTimeout(() => setCheckInSuccess(false), 3000);
    } catch (error) {
      console.error('Check-in failed:', error);
      setCheckInError(error instanceof Error ? error.message : 'Check-in failed');
      setTimeout(() => setCheckInError(null), 5000);
    } finally {
      setCheckInLoading(false);
    }
  };

  // Calculate potential daily points
  const currentStreak = checkInStats?.streak.current_streak || 0;
  const dailyPoints = checkInService.calculateDailyPoints(currentStreak);

  // Check if user can check in today
  // Only show check-in button if we have stats and user can check in, or still loading stats
  const canCheckIn = loadingStats ? false : (checkInStats?.can_checkin ?? false);
  const lastCheckInDate = checkInStats?.streak.last_checkin_date;
  const hasCheckedInToday = checkInStats && !checkInStats.can_checkin;

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

      {/* Daily Check-in Section */}
      <div className="border-t border-yellow-200/50 pt-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <CalendarDaysIcon className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Daily Check-in</span>
          {currentStreak > 0 && (
            <div className="flex items-center space-x-1">
              <FireIcon className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600">
                {currentStreak} day streak
              </span>
            </div>
          )}
        </div>

        {/* Check-in Button */}
        {loadingStats ? (
          // Loading state
          <div className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gray-100 border border-gray-200">
            <ClockIcon className="h-4 w-4 animate-spin text-gray-500" />
            <span className="text-sm text-gray-600">Loading check-in status...</span>
          </div>
        ) : hasCheckedInToday ? (
          // Already checked in today
          <div className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Already checked in today!{' '}
              {lastCheckInDate && (
                <span className="text-xs text-green-600">(Earned {dailyPoints.total} PNT)</span>
              )}
            </span>
          </div>
        ) : canCheckIn ? (
          // Can check in
          <button
            onClick={handleCheckIn}
            disabled={checkInLoading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              checkInSuccess
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : checkInLoading
                  ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-white shadow-md hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {checkInLoading ? (
              <>
                <ClockIcon className="h-4 w-4 animate-spin" />
                <span className="text-sm">Checking in...</span>
              </>
            ) : checkInSuccess ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-sm">Checked in! +{dailyPoints.total} PNT</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                <span className="text-sm">Check in for +{dailyPoints.total} PNT</span>
              </>
            )}
          </button>
        ) : (
          // Fallback - shouldn't happen if stats loaded correctly
          <div className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Check-in unavailable</span>
          </div>
        )}

        {/* Check-in Error */}
        {checkInError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{checkInError}</p>
          </div>
        )}

        {/* Points Preview */}
        {canCheckIn && !loadingStats && (
          <div className="mt-3 text-xs text-gray-600">
            <div className="flex justify-between items-center">
              <span>Base points:</span>
              <span className="font-medium">{dailyPoints.base} PNT</span>
            </div>
            {dailyPoints.bonus > 0 && (
              <div className="flex justify-between items-center">
                <span>Streak bonus:</span>
                <span className="font-medium text-orange-600">+{dailyPoints.bonus} PNT</span>
              </div>
            )}
            {currentStreak < 30 && (
              <div className="flex justify-between items-center text-yellow-600">
                <span>Tomorrow:</span>
                <span className="font-medium">{dailyPoints.nextDay} PNT</span>
              </div>
            )}
          </div>
        )}
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
