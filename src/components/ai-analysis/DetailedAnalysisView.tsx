'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ChartBarIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

import { AIAnalysisLog, aiAnalysisService } from '@/services/aiAnalysis';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DetailedAnalysisViewProps {
  log: AIAnalysisLog;
}

export const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({ log }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    technical: false,
    aiResponse: false,
    execution: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const signalDisplay = aiAnalysisService.getSignalActionDisplay(log.signal_action);
  const analysisTypeDisplay = aiAnalysisService.getAnalysisTypeDisplay(log.analysis_type);
  const hasError = aiAnalysisService.hasError(log);

  // Parse technical data if available
  const technicalIndicators = log.technical_data || {};

  // Parse AI response if it's JSON
  let parsedAIResponse: unknown = null;
  try {
    parsedAIResponse = JSON.parse(log.ai_response);
  } catch {
    // Not JSON, treat as plain text
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {hasError && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Analysis Error:</strong> {log.error_message}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Section */}
      <Card className="overflow-hidden">
        <div
          className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('overview')}
        >
          <h3 className="font-semibold flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Analysis Overview
          </h3>
          {expandedSections.overview ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </div>

        {expandedSections.overview && (
          <div className="p-6 space-y-4">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Badge variant="outline" className="mb-2">
                  {log.symbol}
                </Badge>
                <p className="text-sm text-gray-600">Symbol</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xl font-bold">${log.current_price.toFixed(8)}</p>
                <p className="text-sm text-gray-600">Current Price</p>
              </div>

              {log.signal_strength !== undefined && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p
                    className={`text-xl font-bold ${aiAnalysisService.getSignalStrengthColor(log.signal_strength)}`}
                  >
                    {aiAnalysisService.formatSignalStrength(log.signal_strength)}
                  </p>
                  <p className="text-sm text-gray-600">Confidence</p>
                </div>
              )}

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-xl font-bold">
                  {aiAnalysisService.formatProcessingTime(log.processing_time_ms)}
                </p>
                <p className="text-sm text-gray-600">Processing Time</p>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Analysis Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <Badge className={analysisTypeDisplay.color}>{analysisTypeDisplay.label}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeframes:</span>
                    <span>
                      {log.main_timeframe} / {log.higher_timeframe}
                    </span>
                  </div>
                  {log.signal_action && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signal:</span>
                      <Badge className={signalDisplay.color}>
                        {signalDisplay.icon} {signalDisplay.label}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">AI Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <Badge variant="outline">{log.ai_provider}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <Badge variant="outline">{log.ai_model}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            {log.reason_analysis && (
              <div>
                <h4 className="font-medium mb-3">Analysis Summary</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {log.reason_analysis}
                </p>
              </div>
            )}

            {/* Risk Assessment */}
            {log.risk_assessment && (
              <div>
                <h4 className="font-medium mb-3">Risk Assessment</h4>
                <p className="text-sm text-gray-700 bg-orange-50 p-4 rounded-lg">
                  {log.risk_assessment}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Technical Data Section */}
      {Object.keys(technicalIndicators).length > 0 && (
        <Card className="overflow-hidden">
          <div
            className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('technical')}
          >
            <h3 className="font-semibold flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Technical Indicators
            </h3>
            {expandedSections.technical ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </div>

          {expandedSections.technical && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(technicalIndicators).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium">
                      {typeof value === 'number'
                        ? key.includes('percent') || key.includes('change')
                          ? `${value.toFixed(2)}%`
                          : value.toFixed(6)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Charts Section */}
      {(log.chart_url || log.main_tf_chart_url || log.higher_tf_chart_url) && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PhotoIcon className="h-5 w-5" />
            Analysis Charts
          </h3>

          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Main Chart ({log.main_timeframe})</TabsTrigger>
              <TabsTrigger value="higher">Higher TF ({log.higher_timeframe})</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="mt-4">
              {log.chart_url || log.main_tf_chart_url ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={log.chart_url || log.main_tf_chart_url!}
                    alt={`Main chart for ${log.symbol}`}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>No main chart available</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="higher" className="mt-4">
              {log.higher_tf_chart_url ? (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={log.higher_tf_chart_url}
                    alt={`Higher timeframe chart for ${log.symbol}`}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>No higher timeframe chart available</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* AI Response Section */}
      <Card className="overflow-hidden">
        <div
          className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('aiResponse')}
        >
          <h3 className="font-semibold flex items-center gap-2">
            <CpuChipIcon className="h-5 w-5" />
            AI Response
          </h3>
          {expandedSections.aiResponse ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </div>

        {expandedSections.aiResponse && (
          <div className="p-6 space-y-4">
            {/* AI Prompt */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                AI Prompt
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <code className="whitespace-pre-wrap">{log.ai_prompt}</code>
              </div>
            </div>

            {/* AI Response */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CodeBracketIcon className="h-4 w-4" />
                AI Response
              </h4>
              <div className="bg-green-50 p-4 rounded-lg text-sm">
                {parsedAIResponse ? (
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(parsedAIResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="whitespace-pre-wrap">{log.ai_response}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Execution Details Section */}
      <Card className="overflow-hidden">
        <div
          className="p-4 bg-gray-50 cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('execution')}
        >
          <h3 className="font-semibold flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5" />
            Execution Details
          </h3>
          {expandedSections.execution ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </div>

        {expandedSections.execution && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Execution Status */}
              <div>
                <h4 className="font-medium mb-3">Execution Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {log.trade_executed ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <span
                      className={
                        log.trade_executed ? 'text-green-600 font-medium' : 'text-gray-600'
                      }
                    >
                      {log.trade_executed ? 'Trade Executed' : 'No Trade Executed'}
                    </span>
                  </div>

                  {log.order_id && (
                    <div className="text-sm">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="ml-2 font-mono">{log.order_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trade Details */}
              {log.trade_executed && (
                <div>
                  <h4 className="font-medium mb-3">Trade Details</h4>
                  <div className="space-y-2 text-sm">
                    {log.execution_price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Execution Price:</span>
                        <span className="font-medium">${log.execution_price.toFixed(8)}</span>
                      </div>
                    )}
                    {log.quantity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{log.quantity.toFixed(6)}</span>
                      </div>
                    )}
                    {log.execution_price && log.quantity && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600">Total Value:</span>
                        <span className="font-bold">
                          ${(log.execution_price * log.quantity).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Metadata */}
      <Card className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created:</span>
            <span className="ml-2">{new Date(log.created_at).toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium">Updated:</span>
            <span className="ml-2">{new Date(log.updated_at).toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium">Log ID:</span>
            <span className="ml-2 font-mono text-xs">{log.id}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
