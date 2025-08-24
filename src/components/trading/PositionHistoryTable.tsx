'use client';

import { useState } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  FunnelIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { TradingPosition } from '@/services/tradingBot';

interface PositionHistoryTableProps {
  positions: TradingPosition[] | null;
}

type SortField =
  | 'opened_at'
  | 'closed_at'
  | 'total_pnl'
  | 'quantity'
  | 'entry_price'
  | 'exit_price';
type SortOrder = 'asc' | 'desc';

export default function PositionHistoryTable({ positions }: PositionHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('opened_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const calculateHoldTime = (openedAt: string, closedAt?: string) => {
    const opened = new Date(openedAt);
    const closed = closedAt ? new Date(closedAt) : new Date();
    const diffMs = closed.getTime() - opened.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return `${diffHours.toFixed(1)}h`;
    }
    const days = Math.floor(diffHours / 24);
    const hours = Math.floor(diffHours % 24);
    return `${days}d ${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      open: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800',
      partially_closed: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getSideBadge = (side: string) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          side === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {side === 'long' ? (
          <ArrowUpIcon className="mr-1 h-3 w-3" />
        ) : (
          <ArrowDownIcon className="mr-1 h-3 w-3" />
        )}
        {side.toUpperCase()}
      </span>
    );
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Handle null positions by defaulting to empty array
  const safePositions = positions || [];

  const filteredPositions = safePositions.filter(position => {
    if (filterStatus === 'all') return true;
    return position.status === filterStatus;
  });

  const sortedPositions = [...filteredPositions].sort((a, b) => {
    let aValue: string | number = a[sortField] as string | number;
    let bValue: string | number = b[sortField] as string | number;

    // Handle null/undefined values for optional fields
    if (sortField === 'closed_at') {
      aValue = a.closed_at || '';
      bValue = b.closed_at || '';
    }
    if (sortField === 'exit_price') {
      aValue = a.exit_price || 0;
      bValue = b.exit_price || 0;
    }

    // Convert to numbers for numeric fields
    if (typeof aValue === 'string' && !isNaN(Number(aValue))) {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ChevronUpDownIcon className="h-4 w-4" />
      </div>
    </th>
  );

  if (positions && positions.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No positions yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          This bot hasn&apos;t opened any trading positions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="all">All Positions</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="partially_closed">Partially Closed</option>
        </select>
        <span className="text-sm text-gray-500">
          Showing {sortedPositions.length} of {positions ? positions.length : 0} positions
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol/Side
              </th>
              <SortableHeader field="quantity">Quantity</SortableHeader>
              <SortableHeader field="entry_price">Entry Price</SortableHeader>
              <SortableHeader field="exit_price">Exit Price</SortableHeader>
              <SortableHeader field="total_pnl">P&L</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <SortableHeader field="opened_at">Opened</SortableHeader>
              <SortableHeader field="closed_at">Closed</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hold Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPositions.map(position => (
              <tr key={position.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm font-medium text-gray-900">{position.symbol}</div>
                    {getSideBadge(position.side)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {position.quantity.toLocaleString()}
                    {position.status === 'partially_closed' && (
                      <div className="text-xs text-gray-500">
                        Remaining: {position.remaining_quantity.toLocaleString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(position.entry_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {position.exit_price ? formatCurrency(position.exit_price) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <div className={`text-sm font-medium ${getPnlColor(position.total_pnl)}`}>
                      {formatCurrency(position.total_pnl)}
                    </div>
                    {position.status === 'open' && position.unrealized_pnl !== 0 && (
                      <div className={`text-xs ${getPnlColor(position.unrealized_pnl)}`}>
                        Unrealized: {formatCurrency(position.unrealized_pnl)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(position.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDateTime(position.opened_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {position.closed_at ? formatDateTime(position.closed_at) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {calculateHoldTime(position.opened_at, position.closed_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
