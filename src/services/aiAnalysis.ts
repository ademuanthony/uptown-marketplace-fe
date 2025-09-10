import api from './api';
import { isAxiosError } from 'axios';

// AI Analysis Log types based on backend entities
export interface AIAnalysisLog {
  id: string;
  bot_id: string;
  symbol: string;
  analysis_type: string;
  timestamp: string;

  // Market Data Context
  current_price: number;
  main_timeframe: string;
  higher_timeframe: string;

  // AI Analysis Results
  ai_provider: string;
  ai_model: string;
  ai_prompt: string;
  ai_response: string;

  // Trading Decision
  signal_action?: 'buy' | 'sell' | 'hold';
  signal_strength?: number; // 0.0 to 1.0
  reason_analysis: string;
  risk_assessment: string;

  // Chart and Visual Data
  chart_url?: string;
  chart_path?: string;
  main_tf_chart_url?: string;
  higher_tf_chart_url?: string;

  // Technical Indicators (JSON data)
  technical_data?: Record<string, unknown>;

  // Execution Results
  trade_executed: boolean;
  order_id?: string;
  execution_price?: number;
  quantity?: number;

  // Analysis Performance Tracking
  processing_time_ms: number;
  error_message?: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface AIAnalysisLogSummary {
  id: string;
  bot_id: string;
  symbol: string;
  analysis_type: string;
  timestamp: string;
  signal_action?: 'buy' | 'sell' | 'hold';
  signal_strength?: number;
  trade_executed: boolean;
  processing_time_ms: number;
  has_error: boolean;
  chart_available: boolean;
}

export interface AIAnalysisFilter {
  bot_id?: string;
  symbol?: string;
  analysis_type?: string;
  signal_action?: string;
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  trade_executed?: boolean;
  has_error?: boolean;
  min_signal_strength?: number;
  max_signal_strength?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  summary?: boolean;
}

export interface AnalysisLogsResponse {
  analysis_logs: AIAnalysisLog[];
  data?: AIAnalysisLog[]; // For backward compatibility
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Performance Statistics
export interface SignalPerformanceStats {
  bot_id: string;
  total_signals: number;
  buy_signals: number;
  sell_signals: number;
  hold_signals: number;
  signals_executed: number;
  execution_rate: number;
  avg_signal_strength: number;
  strong_signals: number; // >= 0.8 strength
  weak_signals: number; // < 0.5 strength
  last_signal_time?: string;
}

export interface ProcessingTimeStats {
  bot_id: string;
  total_analyses: number;
  avg_processing_time_ms: number;
  min_processing_time_ms: number;
  max_processing_time_ms: number;
  median_processing_time_ms: number;
  error_count: number;
  error_rate: number;
  successful_analyses: number;
}

export interface AIUsageStats {
  bot_id: string;
  provider: string;
  model: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  estimated_cost_usd: number;
  avg_response_time_ms: number;
  last_call_time?: string;
}

export interface BotAnalysisStats {
  bot_id: string;
  period_days: number;
  signal_performance: SignalPerformanceStats;
  processing_stats: ProcessingTimeStats;
  ai_usage: AIUsageStats;
  generated_at: string;
}

export interface RecentAnalysisResponse {
  bot_id: string;
  hours_back: number;
  limit: number;
  count: number;
  data: AIAnalysisLog[];
  retrieved_at: string;
}

export interface AnalysisBySymbolResponse {
  bot_id: string;
  symbol: string;
  limit: number;
  offset: number;
  count: number;
  data: AIAnalysisLog[];
}

class AIAnalysisService {
  /**
   * Get AI analysis logs with filtering and pagination
   */
  async getAnalysisLogs(filter: AIAnalysisFilter = {}): Promise<AnalysisLogsResponse> {
    try {
      if (!filter.bot_id) {
        throw new Error('Bot ID is required');
      }

      // Build query parameters
      const params = new URLSearchParams();

      if (filter.symbol) params.append('symbol', filter.symbol);
      if (filter.limit) params.append('limit', filter.limit.toString());
      if (filter.offset) params.append('offset', filter.offset.toString());

      // Use the correct backend endpoint
      const response = await api.get<AnalysisLogsResponse>(
        `/bots/${filter.bot_id}/analysis?${params.toString()}`,
      );

      // The backend returns the data directly, not wrapped in a success object
      if (response.data) {
        // Ensure both analysis_logs and data fields are populated for compatibility
        return {
          ...response.data,
          data: response.data.analysis_logs || [],
          analysis_logs: response.data.analysis_logs || [],
        };
      }

      throw new Error('Failed to get analysis logs');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  /**
   * Get a specific analysis log by ID
   */
  async getAnalysisLogById(id: string): Promise<AIAnalysisLog> {
    try {
      // Use the correct backend endpoint
      const response = await api.get<{ AnalysisLog: AIAnalysisLog }>(`/analysis/${id}`);

      if (response.data && response.data.AnalysisLog) {
        return response.data.AnalysisLog;
      }

      throw new Error('Failed to get analysis log');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  /**
   * Get bot analysis statistics
   */
  async getBotAnalysisStats(botId: string, days: number = 7): Promise<BotAnalysisStats> {
    try {
      // Note: This endpoint may not exist in the backend yet
      // Using a placeholder endpoint structure
      const response = await api.get<BotAnalysisStats>(
        `/bots/${botId}/analysis/stats?days=${days}`,
      );

      if (response.data) {
        return response.data;
      }

      throw new Error('Failed to get bot analysis statistics');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  /**
   * Get recent analysis logs for a bot
   */
  async getRecentAnalysis(
    botId: string,
    hours: number = 24,
    limit: number = 50,
  ): Promise<RecentAnalysisResponse> {
    try {
      // This can use the main analysis endpoint with proper filtering
      const response = await api.get<AnalysisLogsResponse>(
        `/bots/${botId}/analysis?limit=${limit}`,
      );

      if (response.data) {
        // Transform to RecentAnalysisResponse format
        return {
          bot_id: botId,
          hours_back: hours,
          limit: limit,
          count: response.data.total || 0,
          data: (response.data.analysis_logs || response.data.data || []) as AIAnalysisLog[],
          retrieved_at: new Date().toISOString(),
        };
      }

      throw new Error('Failed to get recent analysis');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  /**
   * Get analysis logs for a specific symbol
   */
  async getAnalysisLogsBySymbol(
    botId: string,
    symbol: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AnalysisBySymbolResponse> {
    try {
      // Use the main analysis endpoint with symbol filter
      const response = await api.get<AnalysisLogsResponse>(
        `/bots/${botId}/analysis?symbol=${symbol}&limit=${limit}&offset=${offset}`,
      );

      if (response.data) {
        // Transform to AnalysisBySymbolResponse format
        return {
          bot_id: botId,
          symbol: symbol,
          limit: limit,
          offset: offset,
          count: response.data.total || 0,
          data: (response.data.analysis_logs || response.data.data || []) as AIAnalysisLog[],
        };
      }

      throw new Error('Failed to get analysis logs by symbol');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  /**
   * Format signal strength for display
   */
  formatSignalStrength(strength?: number): string {
    if (strength === undefined || strength === null) return 'N/A';
    return `${(strength * 100).toFixed(1)}%`;
  }

  /**
   * Get signal strength color based on confidence level
   */
  getSignalStrengthColor(strength?: number): string {
    if (!strength) return 'text-gray-500';

    if (strength >= 0.8) return 'text-green-600';
    if (strength >= 0.6) return 'text-yellow-600';
    if (strength >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Get signal action color and icon
   */
  getSignalActionDisplay(action?: string): { color: string; icon: string; label: string } {
    switch (action?.toLowerCase()) {
      case 'buy':
        return { color: 'text-green-600 bg-green-50', icon: '📈', label: 'BUY' };
      case 'sell':
        return { color: 'text-red-600 bg-red-50', icon: '📉', label: 'SELL' };
      case 'hold':
        return { color: 'text-yellow-600 bg-yellow-50', icon: '⏸️', label: 'HOLD' };
      default:
        return { color: 'text-gray-600 bg-gray-50', icon: '❓', label: 'UNKNOWN' };
    }
  }

  /**
   * Format processing time for display
   */
  formatProcessingTime(timeMs: number): string {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60000).toFixed(1)}m`;
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Get analysis type display info
   */
  getAnalysisTypeDisplay(type: string): { color: string; label: string } {
    switch (type) {
      case 'signal_generation':
        return { color: 'text-blue-600 bg-blue-50', label: 'Signal Generation' };
      case 'market_analysis':
        return { color: 'text-purple-600 bg-purple-50', label: 'Market Analysis' };
      case 'position_review':
        return { color: 'text-indigo-600 bg-indigo-50', label: 'Position Review' };
      default:
        return { color: 'text-gray-600 bg-gray-50', label: type };
    }
  }

  /**
   * Check if analysis has error
   */
  hasError(log: AIAnalysisLog | AIAnalysisLogSummary): boolean {
    return !!(log as AIAnalysisLog).error_message || ('has_error' in log && log.has_error);
  }

  /**
   * Get default filter for recent logs
   */
  getDefaultRecentFilter(botId: string): AIAnalysisFilter {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    return {
      bot_id: botId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      limit: 50,
      offset: 0,
      sort_by: 'timestamp',
      sort_order: 'desc',
      summary: false,
    };
  }

  /**
   * Export analysis logs to CSV
   */
  exportToCsv(logs: AIAnalysisLog[], filename: string = 'ai_analysis_logs.csv'): void {
    const headers = [
      'Timestamp',
      'Symbol',
      'Analysis Type',
      'Signal Action',
      'Signal Strength',
      'Current Price',
      'AI Provider',
      'AI Model',
      'Processing Time (ms)',
      'Trade Executed',
      'Error Message',
    ];

    const csvContent = [
      headers.join(','),
      ...logs.map(log =>
        [
          log.timestamp,
          log.symbol,
          log.analysis_type,
          log.signal_action || '',
          log.signal_strength || '',
          log.current_price,
          log.ai_provider,
          log.ai_model,
          log.processing_time_ms,
          log.trade_executed,
          log.error_message || '',
        ]
          .map(field => `"${field}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const aiAnalysisService = new AIAnalysisService();
