'use client';

import {
  ArrowTrendingUpIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  PauseIcon,
  PlayCircleIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

interface BotStrategy {
  id: string;
  name: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  winRate: string;
  gainPerTrade: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  minInvestment: string;
  timeHorizon: string;
  tradingStyle: string;
  bestFor: string[];
  pros: string[];
  cons: string[];
  setupSteps: string[];
}

const botStrategies: BotStrategy[] = [
  {
    id: 'alpha-compounder',
    name: 'alpha-compounder',
    displayName: 'Alpha Compounder',
    icon: ArrowTrendingUpIcon,
    description:
      'Conservative compounding strategy targeting 1% gains per trade on blue-chip cryptocurrencies',
    winRate: '94.2%',
    gainPerTrade: '1%',
    riskLevel: 'Low',
    minInvestment: '$100',
    timeHorizon: '3-5 years',
    tradingStyle: 'Conservative Compounding',
    bestFor: [
      'Beginners new to crypto trading',
      'Risk-averse investors',
      'Long-term wealth building',
      'Set-and-forget approach',
    ],
    pros: [
      'Highest win rate (94.2%)',
      'Low risk with steady growth',
      'Focuses on stable cryptocurrencies',
      'No stop loss - rides out volatility',
      'Perfect for beginners',
    ],
    cons: [
      'Slower growth compared to aggressive strategies',
      'Requires patience for compound effect',
      'May underperform in bull markets',
      'Limited to major cryptocurrencies',
    ],
    setupSteps: [
      'Choose Alpha Compounder from bot selection',
      'Connect your exchange (with IP whitelisting)',
      'Set starting balance ($100 minimum)',
      'Review default settings (recommended for beginners)',
      'Start your bot and monitor initial trades',
    ],
  },
  {
    id: 'xpat-trader',
    name: 'xpat-trader',
    displayName: 'XPat Trader',
    icon: BoltIcon,
    description: 'Advanced swing trading strategy using AI pattern recognition for higher returns',
    winRate: '73.8%',
    gainPerTrade: '3.5%',
    riskLevel: 'High',
    minInvestment: '$100',
    timeHorizon: '6 months - 2 years',
    tradingStyle: 'Aggressive Swing Trading',
    bestFor: [
      'Experienced traders',
      'Higher risk tolerance',
      'Active portfolio management',
      'Faster growth targets',
    ],
    pros: [
      'Higher potential returns (3.5% per trade)',
      'AI-powered pattern recognition',
      'Works with major altcoins and DeFi tokens',
      'Built-in stop loss at -2%',
      'Faster wealth accumulation',
    ],
    cons: [
      'Lower win rate (73.8%)',
      'Higher risk with stop losses',
      'Requires more market knowledge',
      'More volatile returns',
      'Not suitable for beginners',
    ],
    setupSteps: [
      'Choose XPat Trader from bot selection',
      'Connect your exchange (with IP whitelisting)',
      'Set starting balance ($100 minimum)',
      'Configure risk management settings',
      'Set stop loss percentage (default -2%)',
      'Start with a small amount to learn the system',
    ],
  },
];

export default function FirstBotPage() {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'choose' | 'setup' | 'monitor'>('choose');

  const selectedBotData = botStrategies.find(bot => bot.id === selectedBot);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/help" className="text-gray-700 hover:text-primary-600">
                Help Center
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
                <span className="text-gray-500">Setting Up Your First Bot</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-primary-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RocketLaunchIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Setting Up Your First Trading Bot
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose between our proven strategies and get your automated trading bot running in
            minutes with live trading. Start small, learn the system, then scale up your investment.
          </p>
        </div>

        {/* Prerequisites Check */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Before You Start</h3>
              <p className="text-blue-800 mb-3">
                Make sure you&apos;ve completed these prerequisites:
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-blue-700">Exchange account connected with API keys</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-blue-700">
                    IP address 107.189.19.87 whitelisted on exchange
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-blue-700">Trading permissions enabled on API key</span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-blue-700">Minimum $100 available for trading</span>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/help/connect-exchange"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Need help connecting your exchange? →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['choose', 'setup', 'monitor'].map((step, index) => {
              const isActive = activeSection === step;
              const isCompleted = ['choose', 'setup', 'monitor'].indexOf(activeSection) > index;

              return (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => setActiveSection(step as 'choose' | 'setup' | 'monitor')}
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </button>
                  <span
                    className={`ml-2 font-medium ${
                      isActive
                        ? 'text-primary-600'
                        : isCompleted
                          ? 'text-green-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {step === 'choose' && 'Choose Strategy'}
                    {step === 'setup' && 'Setup Bot'}
                    {step === 'monitor' && 'Monitor & Manage'}
                  </span>
                  {index < 2 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Choose Strategy */}
        {activeSection === 'choose' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Step 1: Choose Your Trading Strategy
              </h2>
              <p className="text-gray-600">
                Select the bot that matches your risk tolerance and investment goals
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {botStrategies.map(bot => (
                <div
                  key={bot.id}
                  className={`bg-white rounded-2xl p-8 border-2 transition-all cursor-pointer ${
                    selectedBot === bot.id
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedBot(bot.id)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-3 rounded-xl mr-4">
                        <bot.icon className="h-8 w-8 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{bot.displayName}</h3>
                        <p className="text-gray-600">{bot.tradingStyle}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(bot.riskLevel)}`}
                    >
                      {bot.riskLevel} Risk
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-6">{bot.description}</p>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{bot.winRate}</div>
                      <div className="text-xs text-gray-500">Win Rate</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-primary-600">{bot.gainPerTrade}</div>
                      <div className="text-xs text-gray-500">Per Trade</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">{bot.minInvestment}</div>
                      <div className="text-xs text-gray-500">Min. Investment</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">{bot.timeHorizon}</div>
                      <div className="text-xs text-gray-500">Time Horizon</div>
                    </div>
                  </div>

                  {/* Best For */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Best For:</h4>
                    <ul className="space-y-1">
                      {bot.bestFor.map((item, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedBot === bot.id && (
                    <button
                      onClick={() => setActiveSection('setup')}
                      className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Set Up {bot.displayName} →
                    </button>
                  )}
                </div>
              ))}
            </div>

            {selectedBot && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {selectedBotData?.displayName} - Detailed Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-green-900 mb-3">✅ Pros</h4>
                    <ul className="space-y-2">
                      {selectedBotData?.pros.map((pro, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <span className="text-green-500 mr-2 mt-0.5">+</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-900 mb-3">⚠️ Cons</h4>
                    <ul className="space-y-2">
                      {selectedBotData?.cons.map((con, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <span className="text-red-500 mr-2 mt-0.5">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Setup Bot */}
        {activeSection === 'setup' && selectedBotData && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Step 2: Set Up Your {selectedBotData.displayName}
              </h2>
              <p className="text-gray-600">
                Configure your bot settings and start automated trading
              </p>
            </div>

            {/* Setup Steps */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Setup Checklist</h3>
              <div className="space-y-4">
                {selectedBotData.setupSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-primary-100 text-primary-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration Options */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Configuration Options</h3>

              <div className="space-y-6">
                {/* Starting Balance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Balance (USD)
                  </label>
                  <input
                    type="number"
                    min="100"
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum ${selectedBotData.minInvestment.replace('$', '')} required. Start small
                    and increase as you gain confidence.
                  </p>
                </div>

                {/* Start Small Recommendation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Recommended: Start Small</h4>
                      <p className="text-blue-800 text-sm">
                        Begin with the minimum $100 investment to learn how the system works. You
                        can always increase your investment as you gain confidence and see results.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Settings (for XPat Trader) */}
                {selectedBotData.id === 'xpat-trader' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stop Loss Percentage
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      disabled
                    >
                      <option>-2% (Recommended)</option>
                      <option>-1%</option>
                      <option>-3%</option>
                      <option>-5%</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Automatically sell if trade moves against you by this percentage.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ready to Launch */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-8 text-white text-center">
              <RocketLaunchIcon className="h-12 w-12 mx-auto mb-4 text-primary-200" />
              <h3 className="text-2xl font-bold mb-2">Ready to Launch!</h3>
              <p className="text-primary-100 mb-6">
                Your {selectedBotData.displayName} is configured and ready to start trading.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setActiveSection('monitor')}
                  className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Launch Bot & Monitor
                </button>
                <Link
                  href="/trading-bots"
                  className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-400 transition-colors border border-primary-400"
                >
                  Go to Trading Bots Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Monitor & Manage */}
        {activeSection === 'monitor' && selectedBotData && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Step 3: Monitor & Manage Your Bot
              </h2>
              <p className="text-gray-600">
                Learn how to track performance and manage your automated trading bot
              </p>
            </div>

            {/* Bot Controls */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Bot Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <PlayCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-900 mb-2">Start/Resume</h4>
                  <p className="text-green-700 text-sm">
                    Begin automated trading or resume after pause
                  </p>
                </div>
                <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <PauseIcon className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-yellow-900 mb-2">Pause</h4>
                  <p className="text-yellow-700 text-sm">
                    Temporarily stop trading while keeping positions
                  </p>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                  <StopIcon className="h-8 w-8 text-red-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-red-900 mb-2">Stop</h4>
                  <p className="text-red-700 text-sm">Stop trading and close all positions</p>
                </div>
              </div>
            </div>

            {/* Key Metrics to Watch */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Key Metrics to Monitor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">Total Return</h4>
                  <p className="text-gray-600 text-sm">Overall profit/loss since start</p>
                </div>
                <div className="text-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">Daily P&L</h4>
                  <p className="text-gray-600 text-sm">Profit/loss for current day</p>
                </div>
                <div className="text-center">
                  <CheckCircleIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">Win Rate</h4>
                  <p className="text-gray-600 text-sm">Percentage of profitable trades</p>
                </div>
                <div className="text-center">
                  <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900">Active Time</h4>
                  <p className="text-gray-600 text-sm">How long bot has been running</p>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Best Practices for Bot Management
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>
                      • <strong>Check daily</strong> - Review bot performance and recent trades
                    </li>
                    <li>
                      • <strong>Start small</strong> - Begin with minimum investment, scale up
                      gradually
                    </li>
                    <li>
                      • <strong>Be patient</strong> - Compound growth takes time to show significant
                      results
                    </li>
                    <li>
                      • <strong>Don&apos;t panic</strong> - Short-term losses are normal in trading
                    </li>
                    <li>
                      • <strong>Monitor fuel</strong> - Ensure you have enough fuel for continued
                      operations
                    </li>
                    <li>
                      • <strong>Keep learning</strong> - Understand your bot&apos;s strategy and
                      market conditions
                    </li>
                    <li>
                      • <strong>Live trading verified</strong> - Your bot is trading with real funds
                      on real markets
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">What&apos;s Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  href="/trading-bots"
                  className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                    <ChartBarIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-primary-600">
                      View Bot Dashboard
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Monitor all your trading bots in one place
                    </p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                </Link>

                <Link
                  href="/help/bots/risk-management"
                  className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
                >
                  <div className="bg-primary-100 p-3 rounded-xl mr-4 group-hover:bg-primary-200">
                    <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-primary-600">
                      Learn Risk Management
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Advanced strategies for protecting your capital
                    </p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 mb-4">
                  Congratulations! Your trading bot is now active and working for you 24/7.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/trading-bots"
                    className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    <RocketLaunchIcon className="h-5 w-5 mr-2" />
                    Go to Dashboard
                  </Link>
                  <Link
                    href="/help"
                    className="inline-flex items-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back to Help Center
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
