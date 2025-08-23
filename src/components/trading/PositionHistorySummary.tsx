'use client';

import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ScaleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { PositionHistorySummary as SummaryType } from '@/services/tradingBot';

interface PositionHistorySummaryProps {
  summary: SummaryType;
}

export default function PositionHistorySummary({ summary }: PositionHistorySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days < 7) {
      return `${days}d ${remainingHours.toFixed(0)}h`;
    }
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    return `${weeks}w ${remainingDays}d`;
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPnlIcon = (pnl: number) => {
    if (pnl > 0) return ArrowUpIcon;
    if (pnl < 0) return ArrowDownIcon;
    return ScaleIcon;
  };

  const stats = [
    {
      name: 'Total P&L',
      value: formatCurrency(summary.total_pnl),
      icon: getPnlIcon(summary.total_pnl),
      color: getPnlColor(summary.total_pnl),
    },
    {
      name: 'Realized P&L',
      value: formatCurrency(summary.realized_pnl),
      icon: CurrencyDollarIcon,
      color: getPnlColor(summary.realized_pnl),
    },
    {
      name: 'Unrealized P&L',
      value: formatCurrency(summary.unrealized_pnl),
      icon: ChartBarIcon,
      color: getPnlColor(summary.unrealized_pnl),
    },
    {
      name: 'Win Rate',
      value: formatPercentage(summary.win_rate),
      icon: ArrowUpIcon,
      color: summary.win_rate >= 50 ? 'text-green-600' : 'text-red-600',
    },
    {
      name: 'Total Positions',
      value: summary.total_positions.toString(),
      icon: ChartBarIcon,
      color: 'text-gray-600',
    },
    {
      name: 'Open Positions',
      value: summary.open_positions.toString(),
      icon: ArrowUpIcon,
      color: 'text-blue-600',
    },
  ];

  const detailedStats = [
    {
      label: 'Avg Hold Time',
      value: formatDuration(summary.average_hold_time_hours),
      icon: ClockIcon,
    },
    {
      label: 'Best Trade',
      value: formatCurrency(summary.best_trade_pnl),
      icon: ArrowUpIcon,
      color: 'text-green-600',
    },
    {
      label: 'Worst Trade',
      value: formatCurrency(summary.worst_trade_pnl),
      icon: ArrowDownIcon,
      color: 'text-red-600',
    },
    {
      label: 'Total Volume',
      value: formatCurrency(summary.total_volume),
      icon: ScaleIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className={`text-lg font-medium ${stat.color}`}>
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Performance Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {detailedStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.label} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <IconComponent className={`h-5 w-5 ${stat.color || 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Position Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Closed Positions</span>
                <span>{summary.closed_positions} / {summary.total_positions}</span>
              </div>
              <div className="mt-1 relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{
                      width: summary.total_positions > 0 
                        ? `${(summary.closed_positions / summary.total_positions) * 100}%` 
                        : '0%'
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                  />
                </div>
              </div>
            </div>
            
            {summary.win_rate > 0 && (
              <div>
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>Win Rate</span>
                  <span>{formatPercentage(summary.win_rate)}</span>
                </div>
                <div className="mt-1 relative">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${Math.min(summary.win_rate, 100)}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        summary.win_rate >= 70 ? 'bg-green-500' : 
                        summary.win_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}