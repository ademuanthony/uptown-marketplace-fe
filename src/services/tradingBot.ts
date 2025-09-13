import api from './api';
import { isAxiosError } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Trading bot types based on backend entities
export type ExchangeName = 'binance' | 'bybit' | 'hyperliquid' | 'okx' | 'bitget';
export type BotStatus = 'draft' | 'running' | 'paused' | 'stopped' | 'error';
export type TradingMode = 'spot' | 'futures';
export type StrategyType =
  | 'alpha_compounder'
  | 'grid_trading'
  | 'dca'
  | 'mean_reversion'
  | 'trend_following'
  | 'arbitrage'
  | 'scalping'
  | 'ai_signal'
  | 'custom';

export interface BotStrategy {
  type: StrategyType;
  config: Record<string, unknown>;
}

export interface TradingBot {
  id: string;
  user_id: string;
  exchange_credentials_id: string;
  name: string;
  description: string;
  symbols: string[]; // Updated to support multiple symbols
  status: BotStatus;
  strategy: BotStrategy;
  trading_mode: TradingMode;
  starting_balance: number;
  current_balance: number;
  total_profit_loss: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  last_trade_at?: string;
  parent_id?: string;
  is_copyable: boolean;
  max_active_positions: number; // New field for max active positions
  // Bot-specific trading configuration (overrides strategy defaults)
  leverage?: number; // Bot-specific leverage (1-100)
  position_size_percent?: number; // Position size as % of balance
  max_position_size?: number; // Maximum position size in base currency
  use_auto_leverage?: boolean; // Auto-adjust leverage based on confidence
  risk_per_trade?: number; // Risk per trade as % of balance
  created_at: string;
  updated_at: string;
  started_at?: string;
  stopped_at?: string;
}

export interface CreateBotInput {
  name: string;
  description?: string;
  exchange_credentials_id: string;
  symbols: string[]; // Updated to support multiple symbols
  strategy: BotStrategy;
  trading_mode: TradingMode;
  starting_balance: number;
  max_active_positions: number; // New field for max active positions
  // Bot-specific trading configuration (optional overrides)
  leverage?: number; // Bot-specific leverage (1-100)
  position_size_percent?: number; // Position size as % of balance
  max_position_size?: number; // Maximum position size in base currency
  use_auto_leverage?: boolean; // Auto-adjust leverage based on confidence
  risk_per_trade?: number; // Risk per trade as % of balance
  // Alpha Compounder specific fields (flattened for backend compatibility)
  take_profit_percentage?: number;
  pull_back_percentage?: number;
  max_drawdown_percentage?: number;
}

export interface CopyBotInput {
  parent_bot_id: string;
  exchange_credentials_id: string;
  name: string;
  max_active_positions?: number; // Optional override for max active positions
  // Bot-specific trading configuration overrides (optional for copy bots)
  leverage?: number; // Override parent's leverage (1-100)
  position_size_percent?: number; // Override parent's position size %
  max_position_size?: number; // Override parent's max position size
  use_auto_leverage?: boolean; // Override parent's auto leverage setting
  risk_per_trade?: number; // Override parent's risk per trade %
}

export interface InitializeDefaultBotInput {
  exchange_credentials_id: string;
  bot_type: 'alpha-compounder' | 'xpat-trader';
  name: string;
  starting_balance?: number;
}

export interface UpdateBotConfigInput {
  name?: string;
  description?: string;
  strategy?: BotStrategy;
  starting_balance?: number;
  // Bot-specific trading configuration updates
  leverage?: number; // Bot-specific leverage (1-100)
  position_size_percent?: number; // Position size as % of balance
  max_position_size?: number; // Maximum position size in base currency
  use_auto_leverage?: boolean; // Auto-adjust leverage based on confidence
  risk_per_trade?: number; // Risk per trade as % of balance
}

export interface BotStatistics {
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: number;
  total_volume: number;
  average_profit: number;
  average_loss: number;
  profit_factor: number;
  last_updated: string;
}

export interface UserBotStatistics {
  total_bots: number;
  active_bots: number;
  total_pnl: number;
  total_volume: number;
  best_performing_bot?: TradingBot;
  worst_performing_bot?: TradingBot;
}

export interface SupportedStrategy {
  type: StrategyType;
  name: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
  supported_modes: TradingMode[];
  configuration_schema: Record<string, unknown>;
  min_balance: number;
  recommended_symbols: string[];
}

export type PositionSide = 'long' | 'short';
export type PositionStatus = 'open' | 'closed' | 'partially_closed';

export interface TradingPosition {
  id: string;
  bot_id: string;
  symbol: string;
  side: PositionSide;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  remaining_quantity: number;
  total_pnl: number;
  realized_pnl: number;
  unrealized_pnl: number;
  status: PositionStatus;
  opened_at: string;
  closed_at?: string;
  metadata?: Record<string, unknown>;
  // Trailing stop fields
  trailing_stop_active?: boolean;
  trailing_high_price?: number;
  trailing_trigger_price?: number;
  created_at: string;
  updated_at: string;
}

export interface PositionHistorySummary {
  total_positions: number;
  open_positions: number;
  closed_positions: number;
  total_pnl: number;
  realized_pnl: number;
  unrealized_pnl: number;
  win_rate: number;
  average_hold_time_hours: number;
  best_trade_pnl: number;
  worst_trade_pnl: number;
  total_volume: number;
}

export interface SymbolConfig {
  symbol: string;
  take_profit_percentage: number;
  pull_back_percentage: number;
  // Position sizing configuration
  position_size?: number; // Fixed position size (0 = use percentage)
  position_size_percent?: number; // Percentage of balance per trade
  max_position_size?: number; // Maximum position size limit
  // Leverage configuration (for futures)
  leverage?: number; // Leverage multiplier (1-100, 1 = no leverage)
  use_auto_leverage?: boolean; // Auto-adjust leverage based on confidence
  max_leverage?: number; // Maximum allowed leverage
}

export interface AlphaCompounderConfig {
  symbols: SymbolConfig[]; // Updated to support per-symbol configuration
  // Global configuration
  default_leverage?: number; // Default leverage for all symbols (1-100)
  default_position_size?: number; // Default position size percentage
  risk_per_trade?: number; // Maximum risk per trade as % of balance
  max_concurrent_trades?: number; // Maximum concurrent positions
  // Risk management
  stop_loss_percent?: number; // Global stop loss percentage
  enable_stop_loss?: boolean; // Enable stop loss orders
  enable_take_profit?: boolean; // Enable take profit orders
  // Position sizing mode
  sizing_mode?: 'fixed' | 'percent' | 'risk_based' | 'auto'; // Position sizing strategy
}

export interface GridTradingConfig {
  grid_size: number;
  grid_spacing: number;
  investment_per_order: number;
  profit_per_grid: number;
}

export interface DCAConfig {
  buy_interval_hours: number;
  buy_amount: number;
  max_orders: number;
  safety_orders: number;
  safety_order_volume_scale: number;
  safety_order_step_scale: number;
}

export interface AISignalConfig {
  // Analysis Configuration
  analysis_timeframes: string[]; // e.g., ["1m", "5m", "15m", "30m", "1h", "4h", "1d"]
  main_timeframe: string; // Primary timeframe for analysis (e.g., "1h")
  higher_timeframe: string; // Higher timeframe for trend context (e.g., "4h")

  // AI Configuration
  ai_provider: 'openai' | 'anthropic' | 'local';
  ai_model: string; // "gpt-4o", "claude-3-sonnet", etc.
  api_key?: string; // API key for AI service (optional for display)

  // Technical Indicators
  indicator_settings: IndicatorSettings;

  // Signal Generation
  min_signal_strength: number; // Minimum signal strength (0.0-1.0)
  max_positions_count: number; // Max concurrent positions
  enable_long_signals: boolean; // Enable long (buy) signals
  enable_short_signals: boolean; // Enable short (sell) signals

  // Risk Management
  risk_per_trade: number; // Risk per trade as % of balance
  stop_loss_percent: number; // Stop loss percentage
  take_profit_percent: number; // Take profit percentage
  max_leverage: number; // Maximum leverage (1-100)

  // Trailing Stop Configuration
  enable_trailing_stop: boolean; // Enable trailing stop functionality
  trailing_trigger_percent: number; // Percentage gain to start trailing (e.g., 2.0)
  trailing_stop_percent: number; // Percentage pullback to close position (e.g., 1.0)

  // Active Position Management
  enable_active_management: boolean; // Enable continuous analysis of open positions for close signals

  // Symbol Configuration
  scan_all_symbols: boolean; // Whether to scan all supported symbols
  whitelisted_symbols: string[]; // Specific symbols to analyze
  blacklisted_symbols: string[]; // Symbols to exclude from analysis

  // Execution Settings
  execution_interval: number; // Analysis interval in minutes
  max_daily_trades: number; // Maximum trades per day

  // Chart Generation
  chart_config: ChartConfig;
}

export interface IndicatorSettings {
  // Moving Averages
  short_sma: number; // Short-term SMA period (e.g., 20)
  long_sma: number; // Long-term SMA period (e.g., 50)

  // RSI Configuration
  rsi_period: number; // RSI calculation period (e.g., 14)
  rsi_overbought: number; // RSI overbought level (e.g., 70)
  rsi_oversold: number; // RSI oversold level (e.g., 30)

  // MACD Configuration
  macd_fast: number; // MACD fast EMA period (e.g., 12)
  macd_slow: number; // MACD slow EMA period (e.g., 26)
  macd_signal: number; // MACD signal EMA period (e.g., 9)
}

export interface ChartConfig {
  width: number; // Chart width in pixels
  height: number; // Chart height in pixels
  candlestick_count: number; // Number of candlesticks to include
  show_volume: boolean; // Whether to show volume bars
  show_indicators: boolean; // Whether to show technical indicators
  chart_style: 'light' | 'dark'; // Chart style
}

// AI Signal specific types
export interface AITradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number; // 0.0 to 1.0
  reasoning: string; // AI's explanation
  target_price?: number | null;
  stop_loss?: number | null;
  priority: number; // 1-10, higher = more urgent
  timestamp?: string; // Added by frontend, not in AI response
}

// Structured response from AI (matches backend)
export interface AISignalResponse {
  signal: AITradingSignal;
}

export interface AIAnalysisResult {
  symbol: string;
  analysis_time: string;
  signal: AITradingSignal;
  technical_data: TechnicalIndicatorData;
  market_conditions: MarketConditions;
}

export interface TechnicalIndicatorData {
  short_sma: number;
  long_sma: number;
  rsi: number;
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  change_24h: number;
  change_percent_24h: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
}

export interface MarketConditions {
  overall_trend: 'bullish' | 'bearish' | 'sideways';
  volatility_level: 'low' | 'medium' | 'high';
  market_sentiment: 'fear' | 'neutral' | 'greed';
  btc_dominance?: number;
}

class TradingBotService {
  async createBot(input: CreateBotInput): Promise<TradingBot> {
    try {
      // Transform the input based on strategy type to match backend expectations
      const transformedInput = this.transformCreateBotInput(input);

      const response = await api.post<ApiResponse<TradingBot>>('/trading-bots', transformedInput);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create trading bot');
    } catch (error) {
      if (isAxiosError(error)) {
        // Handle structured error response from backend
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          // Extract message from structured error object
          const errorMessage =
            errorData.error.message || errorData.error.details || 'Failed to create trading bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  private transformCreateBotInput(input: CreateBotInput): Record<string, unknown> {
    const baseInput = {
      name: input.name,
      description: input.description,
      exchange_credentials_id: input.exchange_credentials_id,
      symbols: input.symbols, // Now using symbols array
      strategy: input.strategy,
      trading_mode: input.trading_mode,
      starting_balance: input.starting_balance,
      max_active_positions: input.max_active_positions,
      // Bot-specific trading configuration
      leverage: input.leverage,
      position_size_percent: input.position_size_percent,
      max_position_size: input.max_position_size,
      use_auto_leverage: input.use_auto_leverage,
      risk_per_trade: input.risk_per_trade,
    };

    // For Alpha Compounder strategy, send the new multi-symbol config format
    if (input.strategy.type === 'alpha_compounder') {
      // First cast to unknown, then to AlphaCompounderConfig for proper type conversion
      const config = input.strategy.config as unknown as AlphaCompounderConfig;
      return {
        ...baseInput,
        strategy: {
          type: input.strategy.type,
          config: {
            symbols: config.symbols || [],
          },
        },
      };
    }

    // For other strategies, send as-is for now
    return baseInput;
  }

  async getUserBots(): Promise<TradingBot[]> {
    try {
      const response = await api.get<ApiResponse<TradingBot[]>>('/trading-bots');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async getBotById(id: string): Promise<TradingBot> {
    try {
      const response = await api.get<ApiResponse<TradingBot>>(`/trading-bots/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to get trading bot');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async startBot(id: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`/trading-bots/${id}/start`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to start trading bot');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        // Handle structured error response from backend
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          // Extract message from structured error object
          const errorMessage =
            errorData.error.message || errorData.error.details || 'Failed to start trading bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async pauseBot(id: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`/trading-bots/${id}/pause`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to pause trading bot');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        // Handle structured error response from backend
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          // Extract message from structured error object
          const errorMessage =
            errorData.error.message || errorData.error.details || 'Failed to pause trading bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async resumeBot(id: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`/trading-bots/${id}/resume`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to resume trading bot');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        // Handle structured error response from backend
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          // Extract message from structured error object
          const errorMessage =
            errorData.error.message || errorData.error.details || 'Failed to resume trading bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async stopBot(id: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`/trading-bots/${id}/stop`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to stop trading bot');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        // Handle structured error response from backend
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          // Extract message from structured error object
          const errorMessage =
            errorData.error.message || errorData.error.details || 'Failed to stop trading bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async deleteBot(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/trading-bots/${id}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete trading bot');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        // Handle structured error response from backend
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          // Extract message from structured error object
          const errorMessage =
            errorData.error.message || errorData.error.details || 'Failed to delete trading bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async updateBotConfig(id: string, input: UpdateBotConfigInput): Promise<TradingBot> {
    try {
      const response = await api.put<ApiResponse<TradingBot>>(`/trading-bots/${id}/config`, input);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to update bot configuration');
    } catch (error) {
      if (isAxiosError(error)) {
        // Handle structured error response from backend
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          // Extract message from structured error object
          const errorMessage =
            errorData.error.message ||
            errorData.error.details ||
            'Failed to update bot configuration';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async getBotStatistics(id: string): Promise<BotStatistics> {
    try {
      const response = await api.get<ApiResponse<BotStatistics>>(`/trading-bots/${id}/statistics`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to get bot statistics');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async getUserBotStatistics(): Promise<UserBotStatistics> {
    try {
      const response = await api.get<ApiResponse<UserBotStatistics>>('/trading-bots/statistics');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to get user bot statistics');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async getSupportedStrategies(): Promise<SupportedStrategy[]> {
    try {
      const response = await api.get<ApiResponse<{ strategies: SupportedStrategy[] }>>(
        '/trading-strategies/supported',
      );
      if (response.data.success && response.data.data?.strategies) {
        return response.data.data.strategies;
      }
      return [];
    } catch (error) {
      if (isAxiosError(error)) {
        // If endpoint doesn't exist (404) or other server errors, return empty array
        // The frontend will use default strategies as fallback
        console.warn('Supported strategies endpoint not available:', error.response?.status);
        return [];
      }
      return [];
    }
  }

  async getBotPositions(botId: string): Promise<TradingPosition[]> {
    try {
      const response = await api.get<ApiResponse<TradingPosition[]>>(
        `/trading-bots/${botId}/positions`,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async getBotPositionHistory(
    botId: string,
  ): Promise<{ positions: TradingPosition[]; summary: PositionHistorySummary }> {
    try {
      const response = await api.get<
        ApiResponse<{ positions: TradingPosition[]; summary: PositionHistorySummary }>
      >(`/trading-bots/${botId}/positions/history`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return { positions: [], summary: this.getEmptyPositionSummary() };
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  private getEmptyPositionSummary(): PositionHistorySummary {
    return {
      total_positions: 0,
      open_positions: 0,
      closed_positions: 0,
      total_pnl: 0,
      realized_pnl: 0,
      unrealized_pnl: 0,
      win_rate: 0,
      average_hold_time_hours: 0,
      best_trade_pnl: 0,
      worst_trade_pnl: 0,
      total_volume: 0,
    };
  }

  async getCopyableBots(limit = 20, offset = 0): Promise<TradingBot[]> {
    try {
      const response = await api.get<ApiResponse<TradingBot[]>>(
        `/trading-bots/copyable?limit=${limit}&offset=${offset}`,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async copyBot(input: CopyBotInput): Promise<TradingBot> {
    try {
      const response = await api.post<ApiResponse<TradingBot>>('/trading-bots/copy', input);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to copy trading bot');
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async initializeDefaultBot(input: InitializeDefaultBotInput): Promise<TradingBot> {
    try {
      const response = await api.post<ApiResponse<TradingBot>>(
        '/trading-bots/initialize-default',
        input,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to initialize default bot');
    } catch (error) {
      if (isAxiosError(error)) {
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          const errorMessage =
            errorData.error.message ||
            errorData.error.details ||
            'Failed to initialize default bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async getUserDefaultBot(botType: 'alpha-compounder' | 'xpat-trader'): Promise<TradingBot | null> {
    try {
      const response = await api.get<ApiResponse<TradingBot>>(
        `/trading-bots/default?bot_type=${botType}`,
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      if (isAxiosError(error)) {
        // Return null for 404 (not found) - user doesn't have this default bot yet
        if (error.response?.status === 404) {
          return null;
        }
        const errorData = error.response?.data;
        if (errorData?.error && typeof errorData.error === 'object') {
          const errorMessage =
            errorData.error.message || errorData.error.details || 'Failed to get default bot';
          throw new Error(errorMessage);
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }
}

export const tradingBotService = new TradingBotService();
