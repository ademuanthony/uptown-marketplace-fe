'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  TrashIcon,
  CogIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  DocumentChartBarIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { tradingBotService, TradingBot, BotStatus, UserBotStatistics } from '@/services/tradingBot';
import CreateBotModal from '@/components/trading/CreateBotModal';
import CopyBotModal from '@/components/trading/CopyBotModal';
import ConfigureBotModal from '@/components/trading/ConfigureBotModal';
import DeleteBotModal from '@/components/trading/DeleteBotModal';

export default function TradingBotsPage() {
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [statistics, setStatistics] = useState<UserBotStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [selectedBotForConfig, setSelectedBotForConfig] = useState<TradingBot | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBotForDelete, setSelectedBotForDelete] = useState<TradingBot | null>(null);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const emptyStateDropdownRef = useRef<HTMLDivElement>(null);

  const loadBots = async () => {
    setIsLoading(true);
    try {
      const [botsData, statsData] = await Promise.all([
        tradingBotService.getUserBots(),
        tradingBotService.getUserBotStatistics().catch(() => null),
      ]);
      setBots(botsData);
      setStatistics(statsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load trading bots';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBots();
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        emptyStateDropdownRef.current &&
        !emptyStateDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCreateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleBotAction = async (
    action: 'start' | 'pause' | 'resume' | 'stop' | 'delete',
    botId: string,
    bot?: TradingBot,
  ) => {
    // For delete action, open the modal instead of executing immediately
    if (action === 'delete') {
      if (bot) {
        setSelectedBotForDelete(bot);
        setIsDeleteModalOpen(true);
      }
      return;
    }

    setActionLoading(botId);
    try {
      switch (action) {
        case 'start':
          await tradingBotService.startBot(botId);
          toast.success('Bot started successfully');
          break;
        case 'pause':
          await tradingBotService.pauseBot(botId);
          toast.success('Bot paused successfully');
          break;
        case 'resume':
          await tradingBotService.resumeBot(botId);
          toast.success('Bot resumed successfully');
          break;
        case 'stop':
          await tradingBotService.stopBot(botId);
          toast.success('Bot stopped successfully');
          break;
      }
      await loadBots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} bot`;
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBotForDelete) return;

    setActionLoading(selectedBotForDelete.id);
    try {
      await tradingBotService.deleteBot(selectedBotForDelete.id);
      toast.success('Bot deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedBotForDelete(null);
      await loadBots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete bot';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: BotStatus) => {
    switch (status) {
      case 'running':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'paused':
        return <PauseIcon className="h-5 w-5 text-yellow-500" />;
      case 'stopped':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'draft':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: BotStatus) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RocketLaunchIcon className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Trading Bots</h1>
                  <p className="text-sm text-gray-600">Manage your automated trading strategies</p>
                </div>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Bot
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                </button>

                {showCreateDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsCreateModalOpen(true);
                          setShowCreateDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create from Scratch
                      </button>
                      <button
                        onClick={() => {
                          setIsCopyModalOpen(true);
                          setShowCreateDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                        Create from Template
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Bots</dt>
                    <dd className="text-lg font-medium text-gray-900">{statistics.total_bots}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PlayIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Bots</dt>
                    <dd className="text-lg font-medium text-gray-900">{statistics.active_bots}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total P&L</dt>
                    <dd
                      className={`text-lg font-medium ${statistics.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(statistics.total_pnl)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Volume</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(statistics.total_volume)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bots List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Trading Bots</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : bots.length === 0 ? (
            <div className="text-center py-12">
              <RocketLaunchIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No trading bots</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first trading bot.
              </p>
              <div className="mt-6">
                <div className="relative inline-block" ref={emptyStateDropdownRef}>
                  <button
                    onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Your First Bot
                    <ChevronDownIcon className="h-4 w-4 ml-2" />
                  </button>

                  {showCreateDropdown && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsCreateModalOpen(true);
                            setShowCreateDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create from Scratch
                        </button>
                        <button
                          onClick={() => {
                            setIsCopyModalOpen(true);
                            setShowCreateDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                          Create from Template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Strategy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbols
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bots.map(bot => {
                    const pnlPercentage =
                      bot.starting_balance > 0
                        ? ((bot.current_balance - bot.starting_balance) / bot.starting_balance) *
                          100
                        : 0;
                    const winRate =
                      bot.total_trades > 0 ? (bot.winning_trades / bot.total_trades) * 100 : 0;

                    return (
                      <tr key={bot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bot.name}</div>
                            <div className="text-sm text-gray-500">
                              {bot.description || 'No description'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {bot.strategy.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bot.trading_mode.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {bot.symbols.join(', ')}
                            {bot.symbols.length > 1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {bot.symbols.length} symbols • Max {bot.max_active_positions}{' '}
                                positions
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bot.status)}`}
                          >
                            {getStatusIcon(bot.status)}
                            <span className="ml-1">{bot.status.toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-sm font-medium ${bot.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {formatCurrency(bot.total_profit_loss)}
                          </div>
                          <div
                            className={`text-xs ${pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}
                          >
                            {formatPercentage(pnlPercentage)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bot.total_trades}</div>
                          <div className="text-xs text-gray-500">
                            {winRate.toFixed(1)}% win rate
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {bot.status === 'draft' || bot.status === 'stopped' ? (
                              <button
                                onClick={() => handleBotAction('start', bot.id)}
                                disabled={actionLoading === bot.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                title="Start Bot"
                              >
                                <PlayIcon className="h-5 w-5" />
                              </button>
                            ) : bot.status === 'running' ? (
                              <button
                                onClick={() => handleBotAction('pause', bot.id)}
                                disabled={actionLoading === bot.id}
                                className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                                title="Pause Bot"
                              >
                                <PauseIcon className="h-5 w-5" />
                              </button>
                            ) : bot.status === 'paused' ? (
                              <button
                                onClick={() => handleBotAction('resume', bot.id)}
                                disabled={actionLoading === bot.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                title="Resume Bot"
                              >
                                <PlayIcon className="h-5 w-5" />
                              </button>
                            ) : null}

                            {(bot.status === 'running' || bot.status === 'paused') && (
                              <button
                                onClick={() => handleBotAction('stop', bot.id)}
                                disabled={actionLoading === bot.id}
                                className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                title="Stop Bot"
                              >
                                <StopIcon className="h-5 w-5" />
                              </button>
                            )}

                            <button
                              onClick={() => router.push(`/trading-bots/${bot.id}/history`)}
                              className="text-purple-600 hover:text-purple-900"
                              title="View Position History"
                            >
                              <DocumentChartBarIcon className="h-5 w-5" />
                            </button>

                            {/* AI Analysis button - only show for AI Signal bots */}
                            {bot.strategy.type === 'ai_signal' && (
                              <button
                                onClick={() => router.push(`/trading-bots/${bot.id}/analysis`)}
                                className="text-green-600 hover:text-green-900"
                                title="View AI Analysis"
                              >
                                <ChartBarIcon className="h-5 w-5" />
                              </button>
                            )}

                            {/* Configure Bot button - only show if bot was not copied (no parent_id) */}
                            {!bot.parent_id && (
                              <button
                                onClick={() => {
                                  setSelectedBotForConfig(bot);
                                  setIsConfigureModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Configure Bot"
                              >
                                <CogIcon className="h-5 w-5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleBotAction('delete', bot.id, bot)}
                              disabled={actionLoading === bot.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Delete Bot"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Bot Modal */}
        {isCreateModalOpen && (
          <CreateBotModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={loadBots}
          />
        )}

        {/* Copy Bot Modal */}
        {isCopyModalOpen && (
          <CopyBotModal
            isOpen={isCopyModalOpen}
            onClose={() => setIsCopyModalOpen(false)}
            onSuccess={loadBots}
          />
        )}

        {/* Configure Bot Modal */}
        {isConfigureModalOpen && selectedBotForConfig && (
          <ConfigureBotModal
            isOpen={isConfigureModalOpen}
            onClose={() => {
              setIsConfigureModalOpen(false);
              setSelectedBotForConfig(null);
            }}
            onSuccess={loadBots}
            bot={selectedBotForConfig}
          />
        )}

        {/* Delete Bot Modal */}
        <DeleteBotModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedBotForDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          bot={selectedBotForDelete}
          isDeleting={!!selectedBotForDelete && actionLoading === selectedBotForDelete.id}
        />
      </div>
    </div>
  );
}
