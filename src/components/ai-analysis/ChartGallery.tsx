'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  PhotoIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

import { AIAnalysisLog, AIAnalysisFilter, aiAnalysisService } from '@/services/aiAnalysis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ChartGalleryProps {
  botId: string;
}

interface ChartItem {
  id: string;
  symbol: string;
  timestamp: string;
  analysis_type: string;
  signal_action?: string;
  signal_strength?: number;
  chart_url?: string;
  main_tf_chart_url?: string;
  higher_tf_chart_url?: string;
  main_timeframe: string;
  higher_timeframe: string;
  processing_time_ms: number;
  ai_provider: string;
  ai_model: string;
  reason_analysis: string;
}

// Chart Card Component for Grid View
interface ChartCardProps {
  chart: ChartItem;
  onView: (chart: ChartItem) => void;
  onDownload: (url: string, filename: string) => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ chart, onView, onDownload }) => {
  const signalDisplay = aiAnalysisService.getSignalActionDisplay(chart.signal_action);
  const primaryChartUrl = chart.chart_url || chart.main_tf_chart_url;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
      {/* Chart Image */}
      <div className="relative aspect-video bg-gray-100">
        {primaryChartUrl ? (
          <Image
            src={primaryChartUrl}
            alt={`Chart for ${chart.symbol}`}
            fill
            className="object-cover"
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent) {
                parent.innerHTML =
                  '<div class="flex items-center justify-center h-full text-gray-400"><PhotoIcon class="h-12 w-12" /></div>';
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <PhotoIcon className="h-12 w-12" />
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onView(chart)}
              className="bg-white text-black hover:bg-gray-100"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            {primaryChartUrl && (
              <Button
                size="sm"
                onClick={() =>
                  onDownload(primaryChartUrl, `${chart.symbol}_${chart.timestamp}.png`)
                }
                className="bg-white text-black hover:bg-gray-100"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{chart.symbol}</Badge>
            {chart.signal_action && (
              <Badge className={signalDisplay.color}>
                {signalDisplay.icon} {signalDisplay.label}
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {aiAnalysisService.formatTimestamp(chart.timestamp)}
          </span>
        </div>

        {chart.signal_strength !== undefined && (
          <div className="mb-2">
            <span
              className={`text-sm font-medium ${aiAnalysisService.getSignalStrengthColor(chart.signal_strength)}`}
            >
              Confidence: {aiAnalysisService.formatSignalStrength(chart.signal_strength)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{chart.main_timeframe}</span>
          <span>{aiAnalysisService.formatProcessingTime(chart.processing_time_ms)}</span>
        </div>
      </div>
    </div>
  );
};

// Chart List Item Component
const ChartListItem: React.FC<ChartCardProps> = ({ chart, onView, onDownload }) => {
  const signalDisplay = aiAnalysisService.getSignalActionDisplay(chart.signal_action);
  const primaryChartUrl = chart.chart_url || chart.main_tf_chart_url;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="relative w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          {primaryChartUrl ? (
            <Image
              src={primaryChartUrl}
              alt={`Chart for ${chart.symbol}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <PhotoIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-1">
            <Badge variant="outline">{chart.symbol}</Badge>
            {chart.signal_action && (
              <Badge className={signalDisplay.color}>
                {signalDisplay.icon} {signalDisplay.label}
              </Badge>
            )}
            {chart.signal_strength !== undefined && (
              <span
                className={`text-sm font-medium ${aiAnalysisService.getSignalStrengthColor(chart.signal_strength)}`}
              >
                {aiAnalysisService.formatSignalStrength(chart.signal_strength)}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-1 line-clamp-2">
            {chart.reason_analysis.substring(0, 150)}...
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{aiAnalysisService.formatTimestamp(chart.timestamp)}</span>
            <span>
              {chart.main_timeframe} / {chart.higher_timeframe}
            </span>
            <span>{aiAnalysisService.formatProcessingTime(chart.processing_time_ms)}</span>
            <span>
              {chart.ai_provider} ({chart.ai_model})
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onView(chart)}>
            <EyeIcon className="h-4 w-4" />
          </Button>
          {primaryChartUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(primaryChartUrl, `${chart.symbol}_${chart.timestamp}.png`)}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Chart Detail View Component
interface ChartDetailViewProps {
  chart: ChartItem;
  onDownload: (url: string, filename: string) => void;
}

const ChartDetailView: React.FC<ChartDetailViewProps> = ({ chart, onDownload }) => {
  const signalDisplay = aiAnalysisService.getSignalActionDisplay(chart.signal_action);

  return (
    <div className="space-y-4">
      {/* Chart Info Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base">
            {chart.symbol}
          </Badge>
          {chart.signal_action && (
            <Badge className={signalDisplay.color}>
              {signalDisplay.icon} {signalDisplay.label}
            </Badge>
          )}
          {chart.signal_strength !== undefined && (
            <span
              className={`font-medium ${aiAnalysisService.getSignalStrengthColor(chart.signal_strength)}`}
            >
              {aiAnalysisService.formatSignalStrength(chart.signal_strength)}
            </span>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {aiAnalysisService.formatTimestamp(chart.timestamp)}
        </div>
      </div>

      {/* Charts Display */}
      <div className="space-y-4">
        {/* Main Chart */}
        {(chart.chart_url || chart.main_tf_chart_url) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Main Chart ({chart.main_timeframe})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onDownload(
                    chart.chart_url || chart.main_tf_chart_url!,
                    `${chart.symbol}_main_${chart.timestamp}.png`,
                  )
                }
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={chart.chart_url || chart.main_tf_chart_url!}
                alt={`Main chart for ${chart.symbol}`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Higher Timeframe Chart */}
        {chart.higher_tf_chart_url &&
          chart.higher_tf_chart_url !== (chart.chart_url || chart.main_tf_chart_url) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Higher Timeframe ({chart.higher_timeframe})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onDownload(
                      chart.higher_tf_chart_url!,
                      `${chart.symbol}_higher_${chart.timestamp}.png`,
                    )
                  }
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={chart.higher_tf_chart_url}
                  alt={`Higher timeframe chart for ${chart.symbol}`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
      </div>

      {/* Analysis Details */}
      <div className="space-y-4 pt-4 border-t">
        <div>
          <h4 className="font-medium mb-2">AI Analysis</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{chart.reason_analysis}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Processing Time:</span>
            <span className="ml-1 font-medium">
              {aiAnalysisService.formatProcessingTime(chart.processing_time_ms)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">AI Provider:</span>
            <span className="ml-1 font-medium">{chart.ai_provider}</span>
          </div>
          <div>
            <span className="text-gray-600">Model:</span>
            <span className="ml-1 font-medium">{chart.ai_model}</span>
          </div>
          <div>
            <span className="text-gray-600">Analysis Type:</span>
            <span className="ml-1 font-medium">{chart.analysis_type}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChartGallery: React.FC<ChartGalleryProps> = ({ botId }) => {
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<ChartItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<AIAnalysisFilter>({
    bot_id: botId,
    limit: 24, // Show more items for gallery
    offset: 0,
    sort_by: 'timestamp',
    sort_order: 'desc',
    summary: false, // Need full data for charts
  });

  const [totalCharts, setTotalCharts] = useState(0);

  // Load charts with filtering
  const loadCharts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aiAnalysisService.getAnalysisLogs(filter);

      // Filter only logs that have chart URLs
      const allLogs = (response.analysis_logs || response.data || []) as AIAnalysisLog[];
      const chartsWithImages = allLogs.filter(
        log => log.chart_url || log.main_tf_chart_url || log.higher_tf_chart_url,
      );

      setCharts(chartsWithImages);
      setTotalCharts(response.total);
    } catch (error) {
      console.error('Failed to load charts:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  // Filter handlers
  const handleFilterChange = (key: keyof AIAnalysisFilter, value: unknown) => {
    setFilter(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset to first page
    }));
  };

  const handleLoadMore = () => {
    setFilter(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 24),
    }));
  };

  // Chart actions
  const downloadChart = async (chartUrl: string, filename: string) => {
    try {
      const response = await fetch(chartUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download chart:', error);
    }
  };

  if (loading && charts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PhotoIcon className="h-5 w-5" />
              Chart Gallery ({totalCharts})
            </h2>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </Button>

            <Button onClick={loadCharts} disabled={loading} className="flex items-center gap-2">
              <MagnifyingGlassIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <Input
                type="text"
                placeholder="e.g., BTCUSDT"
                value={filter.symbol || ''}
                onChange={e => handleFilterChange('symbol', e.target.value || undefined)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Signal Action</label>
              <Select
                value={filter.signal_action || ''}
                onValueChange={value => handleFilterChange('signal_action', value || undefined)}
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

      {/* Charts Display */}
      {charts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <PhotoIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Charts Found</h3>
          <p className="text-gray-600">
            No analysis charts found for this bot with the current filters.
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {charts.map(chart => (
                <ChartCard
                  key={chart.id}
                  chart={chart}
                  onView={setSelectedChart}
                  onDownload={downloadChart}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {charts.map(chart => (
                <ChartListItem
                  key={chart.id}
                  chart={chart}
                  onView={setSelectedChart}
                  onDownload={downloadChart}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {charts.length < totalCharts && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : <PhotoIcon className="h-4 w-4" />}
                Load More Charts
              </Button>
            </div>
          )}
        </>
      )}

      {/* Chart Detail Modal */}
      {selectedChart && (
        <Dialog open={!!selectedChart} onOpenChange={() => setSelectedChart(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                Analysis Chart - {selectedChart.symbol} (
                {aiAnalysisService.formatTimestamp(selectedChart.timestamp)})
              </DialogTitle>
            </DialogHeader>
            <ChartDetailView chart={selectedChart} onDownload={downloadChart} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
