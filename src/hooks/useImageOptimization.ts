'use client';

import { useState, useCallback } from 'react';
import {
  optimizeProductImage,
  optimizeProfileImage,
  optimizeProductImages,
  validateImageFile,
  getOptimizationRecommendations,
  type OptimizationProgress,
} from '@/utils/imageUtils';
import type { OptimizationResult } from '@/utils/imageOptimizer';

interface OptimizationState {
  isOptimizing: boolean;
  progress: OptimizationProgress | null;
  results: OptimizationResult[];
  error: string | null;
}

interface BatchOptimizationState {
  isOptimizing: boolean;
  currentFileIndex: number;
  currentFileProgress: OptimizationProgress | null;
  overallProgress: number;
  results: Array<{ original: File; optimizedFile: File; result: OptimizationResult }>;
  error: string | null;
}

export function useImageOptimization() {
  const [state, setState] = useState<OptimizationState>({
    isOptimizing: false,
    progress: null,
    results: [],
    error: null,
  });

  const reset = useCallback(() => {
    setState({
      isOptimizing: false,
      progress: null,
      results: [],
      error: null,
    });
  }, []);

  const optimizeForProduct = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isOptimizing: true, error: null }));

    try {
      const validation = validateImageFile(file, 'product');
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file');
      }

      const { optimizedFile, result } = await optimizeProductImage(file, progress =>
        setState(prev => ({ ...prev, progress })),
      );

      setState(prev => ({
        ...prev,
        isOptimizing: false,
        results: [result],
        progress: { stage: 'completed', progress: 100, message: 'Optimization complete' },
      }));

      return { optimizedFile, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Optimization failed';
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: errorMessage,
        progress: { stage: 'error', progress: 0, error: errorMessage },
      }));
      throw error;
    }
  }, []);

  const optimizeForProfile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isOptimizing: true, error: null }));

    try {
      const validation = validateImageFile(file, 'profile');
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file');
      }

      const { optimizedFile, result } = await optimizeProfileImage(file, progress =>
        setState(prev => ({ ...prev, progress })),
      );

      setState(prev => ({
        ...prev,
        isOptimizing: false,
        results: [result],
        progress: { stage: 'completed', progress: 100, message: 'Profile optimization complete' },
      }));

      return { optimizedFile, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile optimization failed';
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: errorMessage,
        progress: { stage: 'error', progress: 0, error: errorMessage },
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    optimizeForProduct,
    optimizeForProfile,
    reset,
  };
}

export function useBatchImageOptimization() {
  const [state, setState] = useState<BatchOptimizationState>({
    isOptimizing: false,
    currentFileIndex: 0,
    currentFileProgress: null,
    overallProgress: 0,
    results: [],
    error: null,
  });

  const reset = useCallback(() => {
    setState({
      isOptimizing: false,
      currentFileIndex: 0,
      currentFileProgress: null,
      overallProgress: 0,
      results: [],
      error: null,
    });
  }, []);

  const optimizeMultipleForProduct = useCallback(async (files: File[]) => {
    setState(prev => ({ ...prev, isOptimizing: true, error: null, results: [] }));

    try {
      // Validate all files first
      for (const file of files) {
        const validation = validateImageFile(file, 'product');
        if (!validation.isValid) {
          throw new Error(`${file.name}: ${validation.error}`);
        }
      }

      const results = await optimizeProductImages(
        files,
        (fileIndex, fileProgress, overallProgress) => {
          setState(prev => ({
            ...prev,
            currentFileIndex: fileIndex,
            currentFileProgress: fileProgress,
            overallProgress,
          }));
        },
      );

      setState(prev => ({
        ...prev,
        isOptimizing: false,
        results,
        overallProgress: 100,
        currentFileProgress: { stage: 'completed', progress: 100, message: 'All images optimized' },
      }));

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch optimization failed';
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: errorMessage,
        currentFileProgress: { stage: 'error', progress: 0, error: errorMessage },
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    optimizeMultipleForProduct,
    reset,
  };
}

// Utility hook for optimization recommendations
export function useOptimizationRecommendations() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    willOptimize: boolean;
    recommendations: string[];
    estimatedSavings?: number;
  } | null>(null);

  const getRecommendations = useCallback(
    async (file: File, context: 'product' | 'profile' = 'product') => {
      setLoading(true);
      try {
        const result = await getOptimizationRecommendations(file, context);
        setRecommendations(result);
        return result;
      } catch (error) {
        console.error('Failed to get optimization recommendations:', error);
        const fallbackResult = {
          willOptimize: true,
          recommendations: ['Image will be optimized for better performance'],
        };
        setRecommendations(fallbackResult);
        return fallbackResult;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setRecommendations(null);
  }, []);

  return {
    loading,
    recommendations,
    getRecommendations,
    reset,
  };
}

// Hook for file validation
export function useFileValidation() {
  const validateFile = useCallback((file: File, context: 'product' | 'profile' = 'product') => {
    return validateImageFile(file, context);
  }, []);

  const validateFiles = useCallback((files: File[], context: 'product' | 'profile' = 'product') => {
    const results = files.map(file => ({
      file,
      validation: validateImageFile(file, context),
    }));

    const validFiles = results.filter(r => r.validation.isValid).map(r => r.file);
    const invalidFiles = results.filter(r => !r.validation.isValid);
    const warnings = results
      .filter(r => r.validation.warnings?.length)
      .flatMap(r => r.validation.warnings!.map(warning => ({ file: r.file, warning })));

    return {
      validFiles,
      invalidFiles: invalidFiles.map(r => ({
        file: r.file,
        error: r.validation.error!,
      })),
      warnings,
      allValid: invalidFiles.length === 0,
    };
  }, []);

  return {
    validateFile,
    validateFiles,
  };
}
