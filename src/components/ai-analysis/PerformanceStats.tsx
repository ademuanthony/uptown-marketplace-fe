'use client';

import React from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  BoltIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

import { BotAnalysisStats, aiAnalysisService } from '@/services/aiAnalysis';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PerformanceStatsProps {
  stats: BotAnalysisStats;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ stats }) => {
  const { signal_performance, processing_stats, ai_usage } = stats;

  // Calculate additional metrics
  const successRate =
    processing_stats.total_analyses > 0
      ? (processing_stats.successful_analyses / processing_stats.total_analyses) * 100
      : 0;

  const strongSignalRate =
    signal_performance.total_signals > 0
      ? (signal_performance.strong_signals / signal_performance.total_signals) * 100
      : 0;

  const aiSuccessRate =
    ai_usage.total_calls > 0 ? (ai_usage.successful_calls / ai_usage.total_calls) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Signals</p>
              <p className="text-2xl font-bold">{signal_performance.total_signals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Execution Rate</p>
              <p className="text-2xl font-bold">{signal_performance.execution_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CpuChipIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Calls</p>
              <p className="text-2xl font-bold">{ai_usage.total_calls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold">
                {aiAnalysisService.formatProcessingTime(processing_stats.avg_processing_time_ms)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Performance Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5" />
          Signal Performance
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signal Distribution */}
          <div>
            <h4 className="font-medium mb-3">Signal Distribution</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">📈 BUY</Badge>
                  <span className="text-sm">{signal_performance.buy_signals} signals</span>
                </div>
                <span className="text-sm text-gray-600">
                  {signal_performance.total_signals > 0
                    ? (
                        (signal_performance.buy_signals / signal_performance.total_signals) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-700">📉 SELL</Badge>
                  <span className="text-sm">{signal_performance.sell_signals} signals</span>
                </div>
                <span className="text-sm text-gray-600">
                  {signal_performance.total_signals > 0
                    ? (
                        (signal_performance.sell_signals / signal_performance.total_signals) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700">⏸️ HOLD</Badge>
                  <span className="text-sm">{signal_performance.hold_signals} signals</span>
                </div>
                <span className="text-sm text-gray-600">
                  {signal_performance.total_signals > 0
                    ? (
                        (signal_performance.hold_signals / signal_performance.total_signals) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Signal Quality */}
          <div>
            <h4 className="font-medium mb-3">Signal Quality</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Average Confidence</span>
                  <span className="text-sm font-medium">
                    {aiAnalysisService.formatSignalStrength(signal_performance.avg_signal_strength)}
                  </span>
                </div>
                <Progress value={signal_performance.avg_signal_strength * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Strong Signals Rate</span>
                  <span className="text-sm font-medium">{strongSignalRate.toFixed(1)}%</span>
                </div>
                <Progress value={strongSignalRate} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Execution Rate</span>
                  <span className="text-sm font-medium">
                    {signal_performance.execution_rate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={signal_performance.execution_rate} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Signal Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{signal_performance.strong_signals}</p>
            <p className="text-sm text-gray-600">Strong Signals (≥80%)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{signal_performance.weak_signals}</p>
            <p className="text-sm text-gray-600">Weak Signals (&lt; 50%)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {signal_performance.signals_executed}
            </p>
            <p className="text-sm text-gray-600">Trades Executed</p>
          </div>
        </div>
      </div>

      {/* Processing Performance Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BoltIcon className="h-5 w-5" />
          Processing Performance
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Processing Times */}
          <div>
            <h4 className="font-medium mb-3">Processing Times</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average</span>
                <span className="font-medium">
                  {aiAnalysisService.formatProcessingTime(processing_stats.avg_processing_time_ms)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fastest</span>
                <span className="font-medium text-green-600">
                  {aiAnalysisService.formatProcessingTime(processing_stats.min_processing_time_ms)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Slowest</span>
                <span className="font-medium text-red-600">
                  {aiAnalysisService.formatProcessingTime(processing_stats.max_processing_time_ms)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Median</span>
                <span className="font-medium">
                  {aiAnalysisService.formatProcessingTime(
                    processing_stats.median_processing_time_ms,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Reliability Metrics */}
          <div>
            <h4 className="font-medium mb-3">Reliability</h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">{successRate.toFixed(1)}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {processing_stats.successful_analyses}
                  </p>
                  <p className="text-xs text-gray-600">Successful</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-lg font-bold text-red-600">{processing_stats.error_count}</p>
                  <p className="text-xs text-gray-600">Errors</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Usage Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CpuChipIcon className="h-5 w-5" />
          AI Service Usage
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Overview */}
          <div>
            <h4 className="font-medium mb-3">Usage Overview</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Provider</span>
                <Badge variant="outline">{ai_usage.provider.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Model</span>
                <Badge variant="outline">{ai_usage.model}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Calls</span>
                <span className="font-medium">{ai_usage.total_calls.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="font-medium">
                  {aiAnalysisService.formatProcessingTime(ai_usage.avg_response_time_ms)}
                </span>
              </div>
            </div>
          </div>

          {/* Token Usage & Cost */}
          <div>
            <h4 className="font-medium mb-3">Token Usage & Cost</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prompt Tokens</span>
                <span className="font-medium">{ai_usage.total_prompt_tokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion Tokens</span>
                <span className="font-medium">
                  {ai_usage.total_completion_tokens.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Cost</span>
                <span className="font-medium text-green-600">
                  ${ai_usage.estimated_cost_usd.toFixed(4)}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">AI Success Rate</span>
                  <span className="text-sm font-medium">{aiSuccessRate.toFixed(1)}%</span>
                </div>
                <Progress value={aiSuccessRate} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        {(signal_performance.last_signal_time || ai_usage.last_call_time) && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Last Activity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signal_performance.last_signal_time && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Last Signal:</span>
                  <span className="text-sm font-medium">
                    {aiAnalysisService.formatTimestamp(signal_performance.last_signal_time)}
                  </span>
                </div>
              )}
              {ai_usage.last_call_time && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Last AI Call:</span>
                  <span className="text-sm font-medium">
                    {aiAnalysisService.formatTimestamp(ai_usage.last_call_time)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Period Info */}
      <div className="bg-white rounded-lg shadow-sm p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Statistics Period: Last {stats.period_days} days</span>
          <span>Generated: {aiAnalysisService.formatTimestamp(stats.generated_at)}</span>
        </div>
      </div>
    </div>
  );
};
