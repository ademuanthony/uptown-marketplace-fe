'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import {
  tradingBotService,
  TradingBot,
  TradingPosition,
  PositionHistorySummary,
} from '@/services/tradingBot';
import PositionHistorySummaryComponent from '@/components/trading/PositionHistorySummary';
import PositionHistoryTable from '@/components/trading/PositionHistoryTable';

export default function BotPositionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<TradingBot | null>(null);
  const [positions, setPositions] = useState<TradingPosition[]>([]);
  const [summary, setSummary] = useState<PositionHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch bot details and position history in parallel
        const [botData, historyData] = await Promise.all([
          tradingBotService.getBotById(botId),
          tradingBotService.getBotPositionHistory(botId),
        ]);

        setBot(botData);
        setPositions(historyData.positions);
        setSummary(historyData.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load position history');
      } finally {
        setLoading(false);
      }
    };

    if (botId) {
      fetchData();
    }
  }, [botId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading position history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <ChartBarIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Data</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="mr-1 h-5 w-5" />
            Back to Trading Bots
          </button>

          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Position History
              </h2>
              {bot && (
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="font-medium">{bot.name}</span>
                    <span className="mx-1">•</span>
                    <span>{bot.symbols.join(', ')}</span>
                    {bot.symbols.length > 1 && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {bot.symbols.length} symbols
                        </span>
                      </>
                    )}
                    <span className="mx-1">•</span>
                    <span className="capitalize">{bot.strategy.type.replace('_', ' ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {summary && (
          <div className="mb-8">
            <PositionHistorySummaryComponent summary={summary} />
          </div>
        )}

        {/* Positions Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Trading Positions</h3>
            <PositionHistoryTable positions={positions} />
          </div>
        </div>
      </div>
    </div>
  );
}
