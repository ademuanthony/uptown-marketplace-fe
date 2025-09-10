'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import {
  AIAnalysisLog,
  AIAnalysisFilter,
  BotAnalysisStats,
  aiAnalysisService,
} from '@/services/aiAnalysis';
import { TradingBot, tradingBotService } from '@/services/tradingBot';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PerformanceStats } from '@/components/ai-analysis/PerformanceStats';
import { ChartGallery } from '@/components/ai-analysis/ChartGallery';
import { DetailedAnalysisView } from '@/components/ai-analysis/DetailedAnalysisView';

// Analysis Log Card Component
interface AnalysisLogCardProps {
  log: AIAnalysisLog;
  onViewDetails: (log: AIAnalysisLog) => void;
}

const AnalysisLogCard: React.FC<AnalysisLogCardProps> = ({ log, onViewDetails }) => {
  const signalDisplay = aiAnalysisService.getSignalActionDisplay(log.signal_action);
  const analysisTypeDisplay = aiAnalysisService.getAnalysisTypeDisplay(log.analysis_type);
  const hasError = !!log.error_message;

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={e => {
        e.preventDefault();
        onViewDetails(log);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Timestamp */}
          <div className="text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 inline mr-1" />
            {aiAnalysisService.formatTimestamp(log.timestamp)}
          </div>

          {/* Symbol */}
          <Badge variant="outline">{log.symbol}</Badge>

          {/* Analysis Type */}
          <Badge variant="secondary" className={analysisTypeDisplay.color}>
            {analysisTypeDisplay.label}
          </Badge>

          {/* Signal Action */}
          {log.signal_action && (
            <Badge className={signalDisplay.color}>
              {signalDisplay.icon} {signalDisplay.label}
            </Badge>
          )}

          {/* Signal Strength */}
          {log.signal_strength !== undefined && (
            <span
              className={`text-sm font-medium ${aiAnalysisService.getSignalStrengthColor(log.signal_strength)}`}
            >
              {aiAnalysisService.formatSignalStrength(log.signal_strength)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            {log.trade_executed && (
              <CheckCircleIcon className="h-4 w-4 text-green-600" title="Trade Executed" />
            )}
            {hasError && <XCircleIcon className="h-4 w-4 text-red-600" title="Has Error" />}
            {log.chart_url && (
              <ChartBarIcon className="h-4 w-4 text-blue-600" title="Chart Available" />
            )}
          </div>

          {/* Processing Time */}
          <span className="text-xs text-gray-500">
            {aiAnalysisService.formatProcessingTime(log.processing_time_ms)}
          </span>

          {/* View Details Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails(log);
            }}
            className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium"
          >
            <EyeIcon className="h-3 w-3" />
            Details
          </Button>
        </div>
      </div>

      {/* Additional Details Preview */}
      {log.reason_analysis && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-gray-700">
            <strong>Reason:</strong> {log.reason_analysis.substring(0, 200)}
            {log.reason_analysis.length > 200 && '...'}
          </p>
        </div>
      )}
    </div>
  );
};

const AnalysisPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  // State management
  const [bot, setBot] = useState<TradingBot | null>(null);
  const [analysisLogs, setAnalysisLogs] = useState<AIAnalysisLog[]>([]);
  const [analysisStats, setAnalysisStats] = useState<BotAnalysisStats | null>(null);
  const [selectedLog, setSelectedLog] = useState<AIAnalysisLog | null>(null);

  // Loading states
  const [loadingBot, setLoadingBot] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Filter and pagination state
  const [filter, setFilter] = useState<AIAnalysisFilter>({
    bot_id: botId,
    limit: 20,
    offset: 0,
    sort_by: 'timestamp',
    sort_order: 'desc',
  });
  const [totalLogs, setTotalLogs] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Load bot data
  const loadBot = useCallback(async () => {
    try {
      setLoadingBot(true);
      const botData = await tradingBotService.getBotById(botId);
      setBot(botData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bot');
    } finally {
      setLoadingBot(false);
    }
  }, [botId]);

  // Load analysis logs
  const loadAnalysisLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const response = await aiAnalysisService.getAnalysisLogs(filter);
      setAnalysisLogs(response.data || response.analysis_logs || []);
      setTotalLogs(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis logs');
    } finally {
      setLoadingLogs(false);
    }
  }, [filter]);

  // Load analysis statistics
  const loadAnalysisStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const stats = await aiAnalysisService.getBotAnalysisStats(botId, 7);
      setAnalysisStats(stats);
    } catch (err) {
      // Stats are optional, don't show error to user
      console.warn('Failed to load analysis stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [botId]);

  // Handle viewing detailed analysis log
  const handleViewDetails = useCallback((log: AIAnalysisLog) => {
    setSelectedLog(log);
  }, []);

  // Initial data loading
  useEffect(() => {
    loadBot();
  }, [loadBot]);

  useEffect(() => {
    loadAnalysisLogs();
  }, [loadAnalysisLogs]);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadAnalysisStats();
    }
  }, [activeTab, loadAnalysisStats]);

  // Filter handlers
  const handleFilterChange = (key: keyof AIAnalysisFilter, value: unknown) => {
    setFilter(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (newOffset: number) => {
    setFilter(prev => ({ ...prev, offset: newOffset }));
  };

  const handleExport = () => {
    if (analysisLogs.length > 0 && !filter.summary) {
      aiAnalysisService.exportToCsv(
        analysisLogs as AIAnalysisLog[],
        `${bot?.name || 'bot'}_analysis_logs.csv`,
      );
    }
  };

  // Computed values
  const currentPage = Math.floor((filter.offset || 0) / (filter.limit || 20)) + 1;
  const totalPages = Math.ceil(totalLogs / (filter.limit || 20));
  const hasNextPage = (filter.offset || 0) + (filter.limit || 20) < totalLogs;
  const hasPrevPage = (filter.offset || 0) > 0;

  if (loadingBot) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !bot) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 mr-4"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Back
                </Button>
                <ChartBarIcon className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI Analysis</h1>
                  <p className="text-sm text-gray-600">Bot: {bot?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bot Status Section */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge
                    variant={bot?.status === 'running' ? 'success' : 'secondary'}
                    className={
                      bot?.status === 'running'
                        ? 'bg-green-100 text-green-800 font-semibold'
                        : 'font-semibold'
                    }
                  >
                    {bot?.status?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Strategy</p>
                  <p className="font-semibold text-gray-900">
                    {bot?.strategy.type.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Symbols</p>
                  <p className="font-semibold text-gray-900">{bot?.symbols.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Trades</p>
                  <p className="font-semibold text-gray-900">{bot?.total_trades}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-600">P&L</p>
                <p
                  className={`text-lg font-bold ${bot && bot.total_profit_loss !== undefined && bot.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {bot?.total_profit_loss !== undefined && bot.total_profit_loss >= 0 ? '+' : ''}$
                  {bot?.total_profit_loss?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100">
            <TabsTrigger
              value="logs"
              className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <ChartBarIcon className="h-4 w-4" />
              Analysis Logs
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <ChartBarIcon className="h-4 w-4" />
              Performance Stats
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900"
            >
              <CpuChipIcon className="h-4 w-4" />
              Chart Gallery
            </TabsTrigger>
          </TabsList>

          {/* Analysis Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            {/* Filters and Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Filters
                  </Button>

                  <span className="text-sm text-gray-600">{totalLogs} Total Logs</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={!analysisLogs.length}
                    className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Export CSV
                  </Button>

                  <Button
                    onClick={loadAnalysisLogs}
                    disabled={loadingLogs}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Expandable Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium mb-2">Symbol</label>
                    <Select
                      value={filter.symbol || ''}
                      onValueChange={value => handleFilterChange('symbol', value || undefined)}
                    >
                      <option value="">All Symbols</option>
                      {bot?.symbols.map(symbol => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Signal Action</label>
                    <Select
                      value={filter.signal_action || ''}
                      onValueChange={value =>
                        handleFilterChange('signal_action', value || undefined)
                      }
                    >
                      <option value="">All Actions</option>
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                      <option value="hold">Hold</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={filter.start_date || ''}
                      onChange={e => handleFilterChange('start_date', e.target.value || undefined)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <Input
                      type="date"
                      value={filter.end_date || ''}
                      onChange={e => handleFilterChange('end_date', e.target.value || undefined)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Logs List */}
            <div className="space-y-4">
              {loadingLogs ? (
                <div className="flex items-center justify-center h-32">
                  <LoadingSpinner size="md" />
                </div>
              ) : analysisLogs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Logs Found</h3>
                  <p className="text-gray-600">
                    No AI analysis logs found for this bot with the current filters.
                  </p>
                </div>
              ) : (
                <>
                  {analysisLogs.map(log => (
                    <AnalysisLogCard key={log.id} log={log} onViewDetails={handleViewDetails} />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {filter.offset! + 1} to{' '}
                        {Math.min(filter.offset! + filter.limit!, totalLogs)} of {totalLogs} results
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePageChange((filter.offset || 0) - (filter.limit || 20))
                          }
                          disabled={!hasPrevPage}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          Previous
                        </Button>

                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePageChange((filter.offset || 0) + (filter.limit || 20))
                          }
                          disabled={!hasNextPage}
                        >
                          Next
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Performance Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            {loadingStats ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="md" />
              </div>
            ) : analysisStats ? (
              <PerformanceStats stats={analysisStats} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Statistics Available</h3>
                <p className="text-gray-600">
                  Performance statistics will be available once the bot has generated analysis data.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Chart Gallery Tab */}
          <TabsContent value="charts" className="space-y-6">
            <ChartGallery botId={botId} />
          </TabsContent>
        </Tabs>

        {/* Detailed Log Modal */}
        {selectedLog && (
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Analysis Log Details
                </DialogTitle>
              </DialogHeader>
              <DetailedAnalysisView log={selectedLog} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
