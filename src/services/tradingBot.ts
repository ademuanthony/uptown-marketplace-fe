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
}

export interface UpdateBotConfigInput {
  name?: string;
  description?: string;
  strategy?: BotStrategy;
  starting_balance?: number;
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
}

export interface AlphaCompounderConfig {
  symbols: SymbolConfig[]; // Updated to support per-symbol configuration
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
}

export const tradingBotService = new TradingBotService();
