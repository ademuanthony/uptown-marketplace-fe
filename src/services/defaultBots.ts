import api from './api';
import { isAxiosError } from 'axios';

// Default Bot types
export interface DefaultBot {
  id: string;
  name: string;
  description: string;
  strategy: DefaultBotStrategy;
  performance: BotPerformance;
  isActive: boolean;
  followerCount: number;
  totalTrades: number;
  winRate: number;
  avgReturnPerTrade: number;
  tags: string[];
  riskLevel: 'low' | 'medium' | 'high';
  minInvestment: number;
  maxInvestment: number;
  assetTypes: string[];
}

export interface DefaultBotStrategy {
  name: string;
  description: string;
  objective: string;
  approach: string;
  targetGain: number;
  timeHorizon: string;
  stopLoss: boolean;
  signalTypes: string[];
  tradingStyle: string;
  riskManagement: string;
  projectedGrowth: GrowthProjection[];
}

export interface GrowthProjection {
  trades: number;
  expectedBalance: number;
  timeframe: string;
  probability: number;
}

export interface BotPerformance {
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  monthlyReturns: MonthlyReturn[];
  recentTrades: RecentTrade[];
}

export interface MonthlyReturn {
  month: string;
  return: number;
  trades: number;
}

export interface RecentTrade {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  price: number;
  quantity: number;
  profit: number;
  timestamp: string;
}

export interface CopyBotRequest {
  defaultBotId: string;
  name: string;
  exchangeCredentialsId: string;
  initialBalance: number;
  maxActivePositions?: number;
  riskMultiplier?: number;
}

// Default bots data
export const ALPHA_COMPOUNDER: DefaultBot = {
  id: 'alpha-compounder',
  name: 'Alpha Compounder',
  description: 'Conservative compounding strategy targeting 1% per trade on blue-chip assets',
  strategy: {
    name: 'Conservative Compounding',
    description: 'A patient, long-term strategy focused on consistent 1% gains per trade',
    objective: 'Transform $100 to $1,000,000 through 1000 successful trades',
    approach: 'Buy and hold blue-chip cryptocurrencies until 1% profit target is reached',
    targetGain: 1.0, // 1%
    timeHorizon: '3-5 years',
    stopLoss: false,
    signalTypes: ['Long Only'],
    tradingStyle: 'Position Trading',
    riskManagement: 'Asset quality focus - only blue-chip cryptocurrencies',
    projectedGrowth: [
      { trades: 100, expectedBalance: 270, timeframe: '3-6 months', probability: 85 },
      { trades: 250, expectedBalance: 1203, timeframe: '8-12 months', probability: 78 },
      { trades: 500, expectedBalance: 14478, timeframe: '18-24 months', probability: 70 },
      { trades: 750, expectedBalance: 174148, timeframe: '30-36 months', probability: 62 },
      { trades: 1000, expectedBalance: 2096010, timeframe: '42-60 months', probability: 55 },
    ],
  },
  performance: {
    totalReturn: 187.5,
    maxDrawdown: -12.3,
    sharpeRatio: 1.8,
    monthlyReturns: [
      { month: '2024-09', return: 8.2, trades: 12 },
      { month: '2024-08', return: 6.1, trades: 9 },
      { month: '2024-07', return: 11.3, trades: 15 },
      { month: '2024-06', return: 4.7, trades: 8 },
      { month: '2024-05', return: 9.8, trades: 13 },
      { month: '2024-04', return: 7.5, trades: 11 },
    ],
    recentTrades: [
      {
        id: '1',
        symbol: 'BTCUSDT',
        action: 'sell',
        price: 43250.0,
        quantity: 0.0023,
        profit: 1.02,
        timestamp: '2024-09-10T14:30:00Z',
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        action: 'sell',
        price: 2420.0,
        quantity: 0.041,
        profit: 1.01,
        timestamp: '2024-09-09T09:15:00Z',
      },
    ],
  },
  isActive: true,
  followerCount: 1247,
  totalTrades: 892,
  winRate: 94.2,
  avgReturnPerTrade: 1.02,
  tags: ['Conservative', 'Long-term', 'Blue-chip', 'Compounding'],
  riskLevel: 'low',
  minInvestment: 100,
  maxInvestment: 50000,
  assetTypes: ['BTC', 'ETH', 'BNB', 'ADA', 'SOL'],
};

export const XPAT_TRADER: DefaultBot = {
  id: 'xpat-trader',
  name: 'Xpat Trader',
  description: 'Dynamic swing trading strategy for experienced traders seeking higher returns',
  strategy: {
    name: 'Dynamic Swing Trading',
    description: 'Active trading strategy capitalizing on market volatility and technical patterns',
    objective: 'Generate 15-25% monthly returns through strategic swing trades',
    approach: 'AI-driven analysis of technical patterns, momentum, and market sentiment',
    targetGain: 3.5, // 3.5% average per trade
    timeHorizon: '1-2 years',
    stopLoss: true,
    signalTypes: ['Long', 'Short'],
    tradingStyle: 'Swing Trading',
    riskManagement: 'Stop losses at -2%, position sizing based on volatility',
    projectedGrowth: [
      { trades: 50, expectedBalance: 500, timeframe: '1-2 months', probability: 75 },
      { trades: 100, expectedBalance: 1250, timeframe: '3-4 months', probability: 68 },
      { trades: 200, expectedBalance: 7812, timeframe: '6-8 months', probability: 60 },
      { trades: 300, expectedBalance: 48828, timeframe: '9-12 months', probability: 52 },
      { trades: 400, expectedBalance: 305175, timeframe: '12-18 months', probability: 45 },
    ],
  },
  performance: {
    totalReturn: 342.7,
    maxDrawdown: -18.6,
    sharpeRatio: 2.1,
    monthlyReturns: [
      { month: '2024-09', return: 23.4, trades: 28 },
      { month: '2024-08', return: 18.7, trades: 24 },
      { month: '2024-07', return: 31.2, trades: 35 },
      { month: '2024-06', return: 12.3, trades: 19 },
      { month: '2024-05', return: 27.8, trades: 32 },
      { month: '2024-04', return: 19.5, trades: 26 },
    ],
    recentTrades: [
      {
        id: '1',
        symbol: 'SOLUSDT',
        action: 'sell',
        price: 142.8,
        quantity: 7.0,
        profit: 24.85,
        timestamp: '2024-09-10T16:45:00Z',
      },
      {
        id: '2',
        symbol: 'AVAXUSDT',
        action: 'sell',
        price: 28.9,
        quantity: 34.5,
        profit: 18.32,
        timestamp: '2024-09-09T11:30:00Z',
      },
    ],
  },
  isActive: true,
  followerCount: 3421,
  totalTrades: 1567,
  winRate: 73.8,
  avgReturnPerTrade: 3.2,
  tags: ['Aggressive', 'Swing Trading', 'High Return', 'Technical Analysis'],
  riskLevel: 'high',
  minInvestment: 250,
  maxInvestment: 100000,
  assetTypes: ['Major Altcoins', 'DeFi Tokens', 'Layer 1s', 'Gaming Tokens'],
};

// Service class for default bots
export class DefaultBotsService {
  // Get all default bots
  static getDefaultBots(): DefaultBot[] {
    return [ALPHA_COMPOUNDER, XPAT_TRADER];
  }

  // Get specific default bot
  static getDefaultBot(botId: string): DefaultBot | null {
    const bots = this.getDefaultBots();
    return bots.find(bot => bot.id === botId) || null;
  }

  // Copy a default bot
  static async copyDefaultBot(request: CopyBotRequest): Promise<unknown> {
    try {
      const response = await api.post('/trading-bots/copy-default', request);
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  // Get default bot statistics
  static async getDefaultBotStats(botId: string): Promise<unknown> {
    try {
      const response = await api.get(`/trading-bots/default/${botId}/stats`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  // Subscribe to default bot updates
  static async subscribeToDefaultBot(botId: string): Promise<unknown> {
    try {
      const response = await api.post(`/trading-bots/default/${botId}/subscribe`);
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  // Calculate expected returns
  static calculateExpectedReturns(
    initialAmount: number,
    targetGain: number,
    numberOfTrades: number,
    feePerTrade: number = 0.1,
  ): number {
    let balance = initialAmount;
    const effectiveGain = targetGain - feePerTrade; // Subtract fees

    for (let i = 0; i < numberOfTrades; i++) {
      balance = balance * (1 + effectiveGain / 100);
    }

    return balance;
  }

  // Get growth projection for custom parameters
  static getGrowthProjection(
    bot: DefaultBot,
    initialAmount: number,
    customTrades?: number,
  ): GrowthProjection[] {
    const baseProjection = bot.strategy.projectedGrowth;
    const scaleFactor = initialAmount / 100; // Scale from $100 base

    return baseProjection.map(projection => ({
      ...projection,
      expectedBalance: projection.expectedBalance * scaleFactor,
      trades: customTrades || projection.trades,
    }));
  }
}

export const defaultBotsService = DefaultBotsService;
