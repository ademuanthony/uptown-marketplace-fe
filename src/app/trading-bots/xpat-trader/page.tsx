'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  BoltIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

import { XPAT_TRADER, DefaultBot, defaultBotsService } from '@/services/defaultBots';
import { exchangeService, MaskedExchangeCredentials } from '@/services/exchange';
import { tradingBotService, TradingBot } from '@/services/tradingBot';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import AddExchangeModal from '@/components/settings/AddExchangeModal';
import toast from 'react-hot-toast';

interface ExchangeCredentials {
  id: string;
  exchange_name: string;
  label: string;
  is_active: boolean;
}

interface CopyBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: DefaultBot;
  title?: string;
  isConfigMode?: boolean;
}

const CopyBotModal: React.FC<CopyBotModalProps> = ({
  isOpen,
  onClose,
  bot,
  title,
  isConfigMode = false,
}) => {
  const [exchanges, setExchanges] = useState<ExchangeCredentials[]>([]);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [initialBalance, setInitialBalance] = useState(250);
  const [botName, setBotName] = useState(`My ${bot.name}`);
  const [loading, setLoading] = useState(false);
  const [showAddExchange, setShowAddExchange] = useState(false);

  const loadExchanges = async () => {
    try {
      const response = await exchangeService.getExchangeCredentials();
      // Map MaskedExchangeCredentials to ExchangeCredentials
      const mappedExchanges: ExchangeCredentials[] = response.map(
        (ex: MaskedExchangeCredentials) => ({
          id: ex.id,
          exchange_name: ex.exchange ?? '',
          label: ex.account_name ?? '',
          is_active: ex.is_active,
        }),
      );
      setExchanges(mappedExchanges);
    } catch (error) {
      console.error('Failed to load exchanges:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadExchanges();
    }
  }, [isOpen]);

  const handleCopyBot = async () => {
    if (!selectedExchange || initialBalance < bot.minInvestment) {
      return;
    }

    setLoading(true);
    try {
      await tradingBotService.initializeDefaultBot({
        exchange_credentials_id: selectedExchange,
        bot_type: 'xpat-trader',
        name: botName,
        starting_balance: initialBalance,
      });

      // Success - close modal and redirect
      onClose();
      // Show success message
      toast.success(
        'Xpat Trader initialized successfully! You can now access it from your trading bots.',
      );
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to initialize Xpat Trader. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const projectedReturn = defaultBotsService.calculateExpectedReturns(
    initialBalance,
    bot.strategy.targetGain,
    50,
    0.15,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BoltIcon className="h-6 w-6 text-orange-500" />
            {title || `Copy ${bot.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning */}
          <Alert className="border-orange-200 bg-orange-50">
            <BoltIcon className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-800">
              <strong>High-Risk Strategy:</strong> This bot uses aggressive trading techniques with
              higher potential returns but also higher risk of losses.
            </AlertDescription>
          </Alert>

          {/* Bot Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Strategy Summary</h3>
            <p className="text-sm text-purple-800">{bot.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-purple-900">Win Rate:</span>
                <span className="text-purple-700 ml-2">{bot.winRate}%</span>
              </div>
              <div>
                <span className="font-medium text-purple-900">Avg Return:</span>
                <span className="text-purple-700 ml-2">{bot.avgReturnPerTrade}%</span>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bot Name</label>
              <Input
                value={botName}
                onChange={e => setBotName(e.target.value)}
                placeholder="Enter a name for your bot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exchange Account
              </label>
              <div className="flex gap-2">
                <Select
                  value={selectedExchange}
                  onValueChange={setSelectedExchange}
                  className="flex-1"
                >
                  <option value="">Select Exchange</option>
                  {exchanges.map(exchange => (
                    <option key={exchange.id} value={exchange.id}>
                      {exchange.label} ({exchange.exchange_name})
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isConfigMode) {
                      onClose(); // Close the config modal
                    }
                    setShowAddExchange(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Balance (USD)
              </label>
              <Input
                type="number"
                value={initialBalance}
                onChange={e => setInitialBalance(Number(e.target.value))}
                min={bot.minInvestment}
                max={bot.maxInvestment}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: ${bot.minInvestment} | Maximum: ${bot.maxInvestment.toLocaleString()}
              </p>
            </div>

            {/* Projection */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Projection (50 trades)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-800">Initial:</span>
                  <span className="font-bold text-green-900 ml-2">
                    ${initialBalance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-green-800">Expected:</span>
                  <span className="font-bold text-green-900 ml-2">
                    ${projectedReturn.toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                *Based on {bot.strategy.targetGain}% average return per trade
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCopyBot}
              disabled={loading || !selectedExchange || initialBalance < bot.minInvestment}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Initialize Xpat Trader'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Add Exchange Modal */}
      <AddExchangeModal
        isOpen={showAddExchange}
        onClose={() => setShowAddExchange(false)}
        onSuccess={() => {
          setShowAddExchange(false);
          loadExchanges(); // Refresh exchanges list
        }}
      />
    </Dialog>
  );
};

const XpatTraderPage: React.FC = () => {
  const router = useRouter();
  const [bot] = useState<DefaultBot>(XPAT_TRADER);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showInitializeModal, setShowInitializeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBot, setUserBot] = useState<TradingBot | null>(null);
  const [loadingUserBot, setLoadingUserBot] = useState(true);

  // Check if user already has an Xpat Trader bot
  useEffect(() => {
    const checkUserBot = async () => {
      try {
        const existingBot = await tradingBotService.getUserDefaultBot('xpat-trader');
        setUserBot(existingBot);
      } catch (error) {
        console.error('Failed to check for existing bot:', error);
      } finally {
        setLoadingUserBot(false);
      }
    };

    checkUserBot();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await defaultBotsService.subscribeToDefaultBot(bot.id);
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureBot = () => {
    if (userBot) {
      router.push(`/trading-bots/${userBot.id}/analysis`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 mr-6"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <BoltIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {bot.name}
                  <Badge className="bg-red-100 text-red-800 text-xs">HIGH RISK</Badge>
                </h1>
                <p className="text-lg text-gray-600">{bot.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSubscribe}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : isSubscribed ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
              {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </Button>

            {loadingUserBot ? (
              <Button variant="outline" disabled className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Loading...
              </Button>
            ) : userBot ? (
              <Button
                variant="outline"
                onClick={handleConfigureBot}
                className="flex items-center gap-2"
              >
                <CogIcon className="h-4 w-4" />
                Configure Bot
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowInitializeModal(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Initialize
              </Button>
            )}
          </div>
        </div>

        {/* Risk Warning */}
        <Alert className="mb-8 border-red-200 bg-red-50">
          <BoltIcon className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-800">
            <strong>High-Risk Trading Strategy:</strong> This bot uses aggressive swing trading
            techniques. Only invest what you can afford to lose. Past performance does not guarantee
            future results.
          </AlertDescription>
        </Alert>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Followers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bot.followerCount.toLocaleString()}
                  </p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{bot.winRate}%</p>
                </div>
                <ShieldCheckIcon className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bot.totalTrades.toLocaleString()}
                  </p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Return</p>
                  <p className="text-2xl font-bold text-purple-600">{bot.avgReturnPerTrade}%</p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="projection">Growth Projection</TabsTrigger>
            <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          </TabsList>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BoltIcon className="h-5 w-5 text-purple-600" />
                    Strategy Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Objective</h4>
                    <p className="text-gray-700">{bot.strategy.objective}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Approach</h4>
                    <p className="text-gray-700">{bot.strategy.approach}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Target Gain</h4>
                      <Badge className="bg-purple-100 text-purple-800">
                        {bot.strategy.targetGain}% per trade
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Time Horizon</h4>
                      <Badge variant="outline">{bot.strategy.timeHorizon}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Trading Style</h4>
                      <Badge className="bg-orange-100 text-orange-800">
                        {bot.strategy.tradingStyle}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Signal Types</h4>
                      <div className="flex flex-wrap gap-1">
                        {bot.strategy.signalTypes.map(signal => (
                          <Badge key={signal} variant="outline" className="text-xs">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-red-600" />
                    Risk Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Risk Level</h4>
                    <Badge className="bg-red-100 text-red-800">
                      {bot.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Stop Loss</h4>
                    <Badge className="bg-green-100 text-green-800">ENABLED (-2%)</Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Risk Management</h4>
                    <p className="text-sm text-gray-700">{bot.strategy.riskManagement}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Asset Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {bot.assetTypes.map(asset => (
                        <Badge key={asset} variant="outline" className="text-xs">
                          {asset}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Investment Range */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                  Investment Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Minimum Investment</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${bot.minInvestment.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Maximum Investment</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${bot.maxInvestment.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Recommended Start</p>
                    <p className="text-2xl font-bold text-orange-600">$1,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    +{bot.performance.totalReturn}%
                  </p>
                  <p className="text-sm text-gray-600">Since inception</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Max Drawdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{bot.performance.maxDrawdown}%</p>
                  <p className="text-sm text-gray-600">Maximum loss from peak</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sharpe Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">
                    {bot.performance.sharpeRatio}
                  </p>
                  <p className="text-sm text-gray-600">Risk-adjusted return</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Returns */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bot.performance.monthlyReturns.map(month => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{month.month}</p>
                        <p className="text-sm text-gray-600">{month.trades} trades</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            month.return >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {month.return >= 0 ? '+' : ''}
                          {month.return}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Growth Projection Tab */}
          <TabsContent value="projection" className="space-y-6">
            <Alert className="border-orange-200 bg-orange-50">
              <BoltIcon className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-800">
                <strong>High-Risk Projections:</strong> These projections assume aggressive trading
                with higher volatility. Actual results may vary significantly.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Growth Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {bot.strategy.projectedGrowth.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{milestone.trades} Trades</p>
                        <p className="text-sm text-gray-600">{milestone.timeframe}</p>
                        <p className="text-sm text-purple-600">
                          {milestone.probability}% probability
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${milestone.expectedBalance.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Expected balance</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Trades Tab */}
          <TabsContent value="trades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bot.performance.recentTrades.map(trade => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge
                          className={
                            trade.action === 'buy'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {trade.action.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-semibold text-gray-900">{trade.symbol}</p>
                          <p className="text-sm text-gray-600">
                            {trade.quantity} @ ${trade.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${trade.profit.toFixed(2)}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(trade.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Initialize Bot Modal */}
        <CopyBotModal
          isOpen={showInitializeModal}
          onClose={() => setShowInitializeModal(false)}
          bot={bot}
          title={`Initialize ${bot.name}`}
          isConfigMode={true}
        />
      </div>
    </div>
  );
};

export default XpatTraderPage;
