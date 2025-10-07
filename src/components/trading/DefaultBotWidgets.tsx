'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  PlayIcon,
  PauseIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

import { ALPHA_COMPOUNDER, XPAT_TRADER, DefaultBot } from '@/services/defaultBots';
import { tradingBotService, TradingBot, PositionHistorySummary } from '@/services/tradingBot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import toast from 'react-hot-toast';

interface DefaultBotWidgetProps {
  bot: DefaultBot;
  userBot: TradingBot | null;
  summary: PositionHistorySummary | null;
  loading: boolean;
  onViewDetails: () => void;
  onAnalysis: () => void;
  onStartStop: () => void;
}

const DefaultBotWidget: React.FC<DefaultBotWidgetProps> = ({
  bot,
  userBot,
  summary,
  loading,
  onViewDetails,
  onAnalysis,
  onStartStop,
}) => {
  const isAlpha = bot.id === 'alpha-compounder';
  const icon = isAlpha ? (
    <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
  ) : (
    <BoltIcon className="h-8 w-8 text-purple-600" />
  );

  const bgColor = isAlpha ? 'bg-blue-50' : 'bg-purple-50';
  const borderColor = isAlpha ? 'border-blue-200' : 'border-purple-200';
  const buttonColor = isAlpha
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-purple-600 hover:bg-purple-700';

  // Helper functions
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

  return (
    <Card className={`${bgColor} ${borderColor} hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${isAlpha ? 'bg-blue-100' : 'bg-purple-100'} p-2 rounded-full`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                {bot.name}
                <Badge
                  className={
                    bot.riskLevel === 'low'
                      ? 'bg-green-100 text-green-800'
                      : bot.riskLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }
                >
                  {bot.riskLevel === 'high' ? 'HIGH RISK' : bot.riskLevel.toUpperCase()}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">{bot.description}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Stats - Total, P&L, Win Rate */}
        {summary ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ChartBarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Total Positions</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{summary.total_positions}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Total P&L</span>
              </div>
              <p className={`text-lg font-bold ${getPnlColor(summary.total_pnl)}`}>
                {formatCurrency(summary.total_pnl)}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShieldCheckIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Win Rate</span>
              </div>
              <p
                className={`text-lg font-bold ${summary.win_rate >= 50 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatPercentage(summary.win_rate)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ChartBarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Followers</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {bot.followerCount.toLocaleString()}
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShieldCheckIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Win Rate</span>
              </div>
              <p className="text-lg font-bold text-green-600">{bot.winRate}%</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Avg Return</span>
              </div>
              <p className="text-lg font-bold text-blue-600">{bot.avgReturnPerTrade}%</p>
            </div>
          </div>
        )}

        {/* Strategy Highlights */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 text-sm">Strategy Highlights:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• {bot.strategy.objective}</li>
            <li>• Target: {bot.strategy.targetGain}% per trade</li>
            <li>
              • {bot.strategy.stopLoss ? 'Stop loss enabled' : 'No stop loss (hold until profit)'}
            </li>
            <li>• Trading style: {bot.strategy.tradingStyle}</li>
          </ul>
        </div>

        {/* Investment Range */}
        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Investment Range:</span>
            <span className="font-semibold text-gray-900">
              ${bot.minInvestment} - ${bot.maxInvestment.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Performance Details - Match bot history page */}
        <div className="bg-white/60 rounded-lg p-3">
          {summary ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDuration(summary.average_hold_time_hours)}
                  </div>
                  <div className="text-xs text-gray-500">Avg Hold Time</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className={`text-sm font-medium ${getPnlColor(summary.best_trade_pnl)}`}>
                    {formatCurrency(summary.best_trade_pnl)}
                  </div>
                  <div className="text-xs text-gray-500">Best Trade</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className={`text-sm font-medium ${getPnlColor(summary.worst_trade_pnl)}`}>
                    {formatCurrency(summary.worst_trade_pnl)}
                  </div>
                  <div className="text-xs text-gray-500">Worst Trade</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.total_volume)}
                  </div>
                  <div className="text-xs text-gray-500">Total Volume</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Total Return:</span>
                <span className="font-bold text-green-600">+{bot.performance.totalReturn}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Max Drawdown:</span>
                <span className="font-semibold text-red-600">{bot.performance.maxDrawdown}%</span>
              </div>
            </>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {bot.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {bot.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{bot.tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        {loading ? (
          <Button
            disabled
            className="w-full bg-gray-400 text-white flex items-center justify-center gap-2"
          >
            <LoadingSpinner size="sm" />
            Loading...
          </Button>
        ) : userBot ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onAnalysis}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <DocumentChartBarIcon className="h-4 w-4" />
              Analysis
            </Button>
            <Button
              onClick={onStartStop}
              className={`${buttonColor} text-white flex items-center justify-center gap-2`}
            >
              {userBot.status === 'running' ? (
                <>
                  <PauseIcon className="h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={onViewDetails}
            className={`w-full ${buttonColor} text-white flex items-center justify-center gap-2`}
          >
            Start Trading
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const DefaultBotWidgets: React.FC = () => {
  const router = useRouter();
  const [alphaBot, setAlphaBot] = useState<TradingBot | null>(null);
  const [xpatBot, setXpatBot] = useState<TradingBot | null>(null);
  const [alphaSummary, setAlphaSummary] = useState<PositionHistorySummary | null>(null);
  const [xpatSummary, setXpatSummary] = useState<PositionHistorySummary | null>(null);
  const [loadingAlpha, setLoadingAlpha] = useState(true);
  const [loadingXpat, setLoadingXpat] = useState(true);

  // Load user's default bots and position history
  useEffect(() => {
    const loadUserBots = async () => {
      try {
        // Load Alpha Compounder bot
        const alphaUserBot = await tradingBotService.getUserDefaultBot('alpha-compounder');
        setAlphaBot(alphaUserBot);

        // Load position history summary if bot exists
        if (alphaUserBot) {
          try {
            const historyData = await tradingBotService.getBotPositionHistory(alphaUserBot.id);
            setAlphaSummary(historyData.summary);
          } catch (error) {
            console.error('Failed to load Alpha Compounder position history:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load Alpha Compounder bot:', error);
      } finally {
        setLoadingAlpha(false);
      }

      try {
        // Load Xpat Trader bot
        const xpatUserBot = await tradingBotService.getUserDefaultBot('xpat-trader');
        setXpatBot(xpatUserBot);

        // Load position history summary if bot exists
        if (xpatUserBot) {
          try {
            const historyData = await tradingBotService.getBotPositionHistory(xpatUserBot.id);
            setXpatSummary(historyData.summary);
          } catch (error) {
            console.error('Failed to load Xpat Trader position history:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load Xpat Trader bot:', error);
      } finally {
        setLoadingXpat(false);
      }
    };

    loadUserBots();
  }, []);

  const handleViewDetails = (botId: string) => {
    if (botId === 'alpha-compounder') {
      router.push('/trading-bots/alpha-compounder');
    } else if (botId === 'xpat-trader') {
      router.push('/trading-bots/xpat-trader');
    }
  };

  const handleAnalysis = (botId: string) => {
    const bot = botId === 'alpha-compounder' ? alphaBot : xpatBot;
    if (bot) {
      router.push(`/trading-bots/${bot.id}/analysis`);
    }
  };

  const handleStartStop = async (botId: string) => {
    const bot = botId === 'alpha-compounder' ? alphaBot : xpatBot;
    const setBotState = botId === 'alpha-compounder' ? setAlphaBot : setXpatBot;

    if (!bot) return;

    try {
      if (bot.status === 'running') {
        await tradingBotService.stopBot(bot.id);
        setBotState({ ...bot, status: 'stopped' });
        toast.success('Bot stopped successfully');
      } else {
        await tradingBotService.startBot(bot.id);
        setBotState({ ...bot, status: 'running' });
        toast.success('Bot started successfully');
      }
    } catch (error) {
      console.error('Failed to start/stop bot:', error);
      toast.error('Failed to start/stop bot. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Trading Strategies</h2>
            <p className="text-gray-600">
              Copy proven strategies from our top-performing bots. Start with as little as $100.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              {(ALPHA_COMPOUNDER.followerCount + XPAT_TRADER.followerCount).toLocaleString()} total
              followers
            </span>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DefaultBotWidget
          bot={ALPHA_COMPOUNDER}
          userBot={alphaBot}
          summary={alphaSummary}
          loading={loadingAlpha}
          onViewDetails={() => handleViewDetails('alpha-compounder')}
          onAnalysis={() => handleAnalysis('alpha-compounder')}
          onStartStop={() => handleStartStop('alpha-compounder')}
        />
        <DefaultBotWidget
          bot={XPAT_TRADER}
          userBot={xpatBot}
          summary={xpatSummary}
          loading={loadingXpat}
          onViewDetails={() => handleViewDetails('xpat-trader')}
          onAnalysis={() => handleAnalysis('xpat-trader')}
          onStartStop={() => handleStartStop('xpat-trader')}
        />
      </div>

      {/* Why Copy Trading Info */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Copy Trade with Our Bots?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Proven Performance</h4>
              <p className="text-sm text-gray-600">
                Track record of consistent returns with transparent performance history
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Risk Management</h4>
              <p className="text-sm text-gray-600">
                Built-in risk controls and position sizing for capital preservation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Flexible Investment</h4>
              <p className="text-sm text-gray-600">
                Start small and scale up as you gain confidence in the strategy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultBotWidgets;
