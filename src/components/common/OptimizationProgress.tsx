'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { type OptimizationProgress } from '@/utils/imageUtils';

interface OptimizationProgressProps {
  progress: OptimizationProgress;
  className?: string;
  showDetails?: boolean;
}

const OptimizationProgressComponent: React.FC<OptimizationProgressProps> = ({
  progress,
  className = '',
  showDetails = true,
}) => {
  const getStageIcon = () => {
    switch (progress.stage) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CloudArrowUpIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStageColor = () => {
    switch (progress.stage) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getProgressBarColor = () => {
    switch (progress.stage) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getBackgroundColor = () => {
    switch (progress.stage) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-300 ${getBackgroundColor()} ${className}`}
    >
      <div className="flex items-center space-x-3">
        {getStageIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-medium ${getStageColor()}`}>
              {progress.message || 'Processing...'}
            </p>
            {showDetails && progress.progress > 0 && (
              <span className={`text-xs font-medium ${getStageColor()}`}>
                {Math.round(progress.progress)}%
              </span>
            )}
          </div>

          {showDetails && progress.progress > 0 && (
            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${Math.min(100, Math.max(0, progress.progress))}%` }}
              />
            </div>
          )}

          {progress.error && (
            <p className="mt-2 text-sm text-red-600 bg-red-100 rounded-md px-2 py-1">
              {progress.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Batch progress component for multiple files
interface BatchOptimizationProgressProps {
  fileIndex: number;
  totalFiles: number;
  currentFileProgress: OptimizationProgress;
  overallProgress: number;
  className?: string;
  fileName?: string;
}

export const BatchOptimizationProgress: React.FC<BatchOptimizationProgressProps> = ({
  fileIndex,
  totalFiles,
  currentFileProgress,
  overallProgress,
  className = '',
  fileName,
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Overall Progress */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CloudArrowUpIcon className="h-5 w-5 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">
              Processing {fileIndex + 1} of {totalFiles} images
            </p>
          </div>
          <span className="text-xs font-medium text-gray-600">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
      </div>

      {/* Current File Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-sm text-gray-600">
            {fileName ? `Optimizing ${fileName}` : `File ${fileIndex + 1}`}
          </p>
        </div>
        <OptimizationProgressComponent
          progress={currentFileProgress}
          showDetails={false}
          className="border-none bg-transparent p-0"
        />
      </div>
    </div>
  );
};

// Compact progress indicator for inline use
interface CompactOptimizationProgressProps {
  progress: OptimizationProgress;
  className?: string;
}

export const CompactOptimizationProgress: React.FC<CompactOptimizationProgressProps> = ({
  progress,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-3 h-3">
        {progress.stage === 'completed' ? (
          <CheckCircleIcon className="w-3 h-3 text-green-500" />
        ) : progress.stage === 'error' ? (
          <ExclamationCircleIcon className="w-3 h-3 text-red-500" />
        ) : (
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <span
        className={`text-xs font-medium ${
          progress.stage === 'completed'
            ? 'text-green-600'
            : progress.stage === 'error'
              ? 'text-red-600'
              : 'text-blue-600'
        }`}
      >
        {progress.message || 'Processing...'}
      </span>
      {progress.progress > 0 && progress.stage !== 'completed' && (
        <span className="text-xs text-gray-500">{Math.round(progress.progress)}%</span>
      )}
    </div>
  );
};

// Results summary component
interface OptimizationResultsProps {
  results: Array<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  }>;
  className?: string;
}

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({
  results,
  className = '',
}) => {
  if (results.length === 0) return null;

  const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
  const totalOptimizedSize = results.reduce((sum, result) => sum + result.optimizedSize, 0);
  const totalSavings = totalOriginalSize - totalOptimizedSize;
  const averageCompression =
    results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-green-800 mb-2">Optimization Complete!</h4>
          <div className="space-y-1 text-xs text-green-700">
            <div className="flex justify-between">
              <span>Files processed:</span>
              <span className="font-medium">{results.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Original size:</span>
              <span className="font-medium">{formatSize(totalOriginalSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Optimized size:</span>
              <span className="font-medium">{formatSize(totalOptimizedSize)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Space saved:</span>
              <span className="text-green-800">
                {formatSize(totalSavings)} ({averageCompression.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationProgressComponent;
