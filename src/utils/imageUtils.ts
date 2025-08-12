/**
 * Utility functions for handling image URLs in the Uptown Marketplace
 */

import imageOptimizer, { type OptimizationResult } from './imageOptimizer';

// Get the API base URL from environment variables
const getApiBaseUrl = (): string => {
  // Check for Next.js public environment variable first
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '');
  }

  // Fallback based on environment
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Force localhost in development when running on localhost
    return 'http://localhost:8080';
  }

  // Fallback to production or development URLs
  if (process.env.NODE_ENV === 'production') {
    return 'https://uptown.ng'; // Use main domain for production
  }

  return 'http://localhost:8080';
};

/**
 * Converts a relative image path to an absolute URL
 * @param imagePath - The image path from the API (can be relative or absolute)
 * @returns Absolute image URL
 */
export const getAbsoluteImageUrl = (imagePath: string | undefined | null): string => {
  // Return empty string for null/undefined paths
  if (!imagePath) {
    return '';
  }

  // If already an absolute URL (starts with http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const baseUrl = getApiBaseUrl();

  // If it starts with /uploads, it's a relative path from the API server
  if (imagePath.startsWith('/uploads')) {
    return `${baseUrl}${imagePath}`;
  }

  // If it starts with just uploads (no leading slash), add the slash
  if (imagePath.startsWith('uploads')) {
    return `${baseUrl}/${imagePath}`;
  }

  // For any other relative path, assume it's from the API server
  return `${baseUrl}/${imagePath}`;
};

/**
 * Gets a fallback avatar URL
 * @param initial - Optional initial letter for generated avatar
 * @param name - Optional full name for better avatar generation
 * @returns Fallback avatar URL
 */
export const getFallbackAvatarUrl = (initial?: string, name?: string): string => {
  if (initial) {
    // Use full name for better avatar generation if available
    const displayName = name || initial;
    // Use PNG format instead of SVG for better Next.js compatibility
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=3b82f6&color=ffffff&format=png`;
  }

  // Default avatar
  return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=face';
};

/**
 * Gets the profile image URL with fallback
 * @param user - User object with profile_image_url
 * @returns Profile image URL or fallback
 */
export const getProfileImageUrl = (user: {
  profile_image_url?: string | null;
  first_name?: string;
  last_name?: string;
}): string => {
  // Try to get the absolute URL from the profile image
  const profileImageUrl = getAbsoluteImageUrl(user.profile_image_url);

  if (profileImageUrl) {
    return profileImageUrl;
  }

  // Generate fallback with user initials
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const initials = firstName.charAt(0) + lastName.charAt(0) || '?';
  const name = `${firstName} ${lastName}`.trim() || 'User';

  return getFallbackAvatarUrl(initials, name);
};

/**
 * Gets the product image URL with fallback
 * @param imagePath - Product image path
 * @returns Product image URL or placeholder
 */
export const getProductImageUrl = (imagePath: string | undefined | null): string => {
  const absoluteUrl = getAbsoluteImageUrl(imagePath);

  if (absoluteUrl) {
    return absoluteUrl;
  }

  // Fallback product image
  return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';
};

/**
 * Optimizes image URL for Next.js Image component
 * @param imagePath - Original image path
 * @param width - Desired width
 * @param quality - Image quality (1-100)
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  imagePath: string | undefined | null,

  _width: number = 400,

  _quality: number = 75,
): string => {
  const absoluteUrl = getAbsoluteImageUrl(imagePath);

  if (!absoluteUrl) {
    return getProductImageUrl(imagePath);
  }

  // For external URLs (like Unsplash), return as-is since Next.js will handle optimization
  if (absoluteUrl.includes('unsplash.com') || absoluteUrl.includes('ui-avatars.com')) {
    return absoluteUrl;
  }

  // For our API URLs, Next.js Image component will handle the optimization
  return absoluteUrl;
};

/**
 * Validates if an image URL is from an allowed domain
 * @param imageUrl - Image URL to validate
 * @returns Whether the URL is from an allowed domain
 */
export const isAllowedImageDomain = (imageUrl: string): boolean => {
  try {
    const url = new URL(imageUrl);
    const allowedDomains = [
      'localhost',
      'uptown.ng',
      'api.uptown.ng',
      'amazonaws.com',
      'unsplash.com',
      'ui-avatars.com',
      'res.cloudinary.com',
    ];

    return allowedDomains.some(
      domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
};

// ============================================================================
// CLIENT-SIDE IMAGE OPTIMIZATION FUNCTIONS
// ============================================================================

/**
 * Interface for optimization progress callback
 */
export interface OptimizationProgress {
  stage: 'validating' | 'processing' | 'compressing' | 'completed' | 'error';
  progress: number; // 0-100
  message?: string;
  error?: string;
}

/**
 * Context-aware image optimization for product images
 * Automatically applies product-specific optimization settings
 */
export async function optimizeProductImage(
  file: File,
  onProgress?: (progress: OptimizationProgress) => void,
): Promise<{ optimizedFile: File; result: OptimizationResult }> {
  try {
    // Validation stage
    onProgress?.({ stage: 'validating', progress: 10, message: 'Validating image...' });

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Processing stage
    onProgress?.({ stage: 'processing', progress: 30, message: 'Processing image...' });

    // Compression stage
    onProgress?.({
      stage: 'compressing',
      progress: 60,
      message: 'Optimizing for product upload...',
    });

    // Apply product-specific optimization
    const optimizedFile = await imageOptimizer.optimizeForProductUpload(file);

    // Get optimization results
    const result = await imageOptimizer.getOptimizationPreview(file, optimizedFile);

    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: `Optimized: ${result.compressionRatio.toFixed(1)}% smaller`,
    });

    return { optimizedFile, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Optimization failed';
    onProgress?.({
      stage: 'error',
      progress: 0,
      error: errorMessage,
    });
    throw error;
  }
}

/**
 * Context-aware image optimization for profile pictures
 * Automatically applies profile-specific optimization settings including square cropping
 */
export async function optimizeProfileImage(
  file: File,
  onProgress?: (progress: OptimizationProgress) => void,
): Promise<{ optimizedFile: File; result: OptimizationResult }> {
  try {
    // Validation stage
    onProgress?.({ stage: 'validating', progress: 10, message: 'Validating profile image...' });

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Processing stage
    onProgress?.({ stage: 'processing', progress: 30, message: 'Processing profile image...' });

    // Compression stage
    onProgress?.({
      stage: 'compressing',
      progress: 60,
      message: 'Optimizing for profile picture...',
    });

    // Apply profile-specific optimization (includes square cropping)
    const optimizedFile = await imageOptimizer.optimizeForProfilePicture(file);

    // Get optimization results
    const result = await imageOptimizer.getOptimizationPreview(file, optimizedFile);

    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: `Profile image optimized: ${result.compressionRatio.toFixed(1)}% smaller`,
    });

    return { optimizedFile, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Profile optimization failed';
    onProgress?.({
      stage: 'error',
      progress: 0,
      error: errorMessage,
    });
    throw error;
  }
}

/**
 * Context-aware image optimization for messaging attachments
 * Automatically applies messaging-specific optimization settings
 */
export async function optimizeMessagingImage(
  file: File,
  onProgress?: (progress: OptimizationProgress) => void,
): Promise<{ optimizedFile: File; result: OptimizationResult }> {
  try {
    // Validation stage
    onProgress?.({ stage: 'validating', progress: 10, message: 'Validating image...' });

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Processing stage
    onProgress?.({ stage: 'processing', progress: 30, message: 'Processing image...' });

    // Compression stage
    onProgress?.({
      stage: 'compressing',
      progress: 60,
      message: 'Optimizing for messaging...',
    });

    // Apply messaging-specific optimization
    const optimizedFile = await imageOptimizer.optimizeForMessaging(file);

    // Get optimization results
    const result = await imageOptimizer.getOptimizationPreview(file, optimizedFile);

    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: `Optimized: ${result.compressionRatio.toFixed(1)}% smaller`,
    });

    return { optimizedFile, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Optimization failed';
    onProgress?.({
      stage: 'error',
      progress: 0,
      error: errorMessage,
    });
    throw error;
  }
}

/**
 * Batch optimize multiple product images with progress tracking
 * Useful for product listings with multiple photos
 */
export async function optimizeProductImages(
  files: File[],
  onProgress?: (
    fileIndex: number,
    fileProgress: OptimizationProgress,
    overallProgress: number,
  ) => void,
): Promise<Array<{ original: File; optimizedFile: File; result: OptimizationResult }>> {
  const results: Array<{ original: File; optimizedFile: File; result: OptimizationResult }> = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    if (!file) continue; // Skip undefined files

    try {
      const { optimizedFile, result } = await optimizeProductImage(file, progress => {
        const fileOverallProgress = ((i + progress.progress / 100) / total) * 100;
        onProgress?.(i, progress, fileOverallProgress);
      });

      results.push({
        original: file,
        optimizedFile,
        result,
      });
    } catch (error) {
      console.error(`Failed to optimize ${file.name}:`, error);
      // Continue with other files, but log the error
      results.push({
        original: file,
        optimizedFile: file, // Use original file as fallback
        result: {
          originalSize: file.size,
          optimizedSize: file.size,
          compressionRatio: 0,
          originalDimensions: { width: 0, height: 0 },
          optimizedDimensions: { width: 0, height: 0 },
        },
      });
    }

    // Update overall progress
    onProgress?.(i, { stage: 'completed', progress: 100 }, ((i + 1) / total) * 100);
  }

  return results;
}

/**
 * Smart image validation with detailed error messages
 * Provides user-friendly feedback for common image issues
 */
export function validateImageFile(
  file: File,
  context: 'product' | 'profile' = 'product',
): {
  isValid: boolean;
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // Basic file validation
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please select an image file (JPG, PNG, GIF, WebP)',
    };
  }

  // Context-specific validation
  const maxSize = context === 'profile' ? 10 * 1024 * 1024 : 20 * 1024 * 1024; // 10MB for profile, 20MB for product
  const recommendedSize = context === 'profile' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for profile, 5MB for product

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${maxSize / 1024 / 1024}MB.`,
    };
  }

  // Warnings for large but acceptable files
  if (file.size > recommendedSize) {
    warnings.push(
      `Large image detected (${(file.size / 1024 / 1024).toFixed(1)}MB). Consider using a smaller image for faster uploads.`,
    );
  }

  // Format-specific warnings
  if (file.type === 'image/bmp') {
    warnings.push('BMP format detected. Consider using JPG or PNG for better compression.');
  }

  if (file.type === 'image/tiff') {
    warnings.push('TIFF format detected. Consider using JPG or PNG for web compatibility.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Get optimization recommendations based on file analysis
 * Helps users understand what optimizations will be applied
 */
export async function getOptimizationRecommendations(
  file: File,
  context: 'product' | 'profile' = 'product',
): Promise<{
  willOptimize: boolean;
  recommendations: string[];
  estimatedSavings?: number; // Percentage
}> {
  const recommendations: string[] = [];
  let willOptimize = false;

  try {
    const dimensions = await imageOptimizer.getImageDimensions(file);
    const maxDimensions = context === 'profile' ? 512 : 1920;
    const targetSize = context === 'profile' ? 500 * 1024 : 2 * 1024 * 1024;

    // Size optimization
    if (file.size > targetSize) {
      willOptimize = true;
      recommendations.push(
        `File size will be reduced from ${(file.size / 1024 / 1024).toFixed(1)}MB to approximately ${(targetSize / 1024 / 1024).toFixed(1)}MB`,
      );
    }

    // Dimension optimization
    if (dimensions.width > maxDimensions || dimensions.height > maxDimensions) {
      willOptimize = true;
      recommendations.push(
        `Image will be resized from ${dimensions.width}×${dimensions.height} to fit within ${maxDimensions}×${maxDimensions}`,
      );
    }

    // Profile-specific optimizations
    if (context === 'profile') {
      if (dimensions.width !== dimensions.height) {
        willOptimize = true;
        recommendations.push('Image will be cropped to square format for profile picture');
      }
    }

    // Format optimization
    if (file.type !== 'image/jpeg') {
      willOptimize = true;
      recommendations.push(
        `Image format will be converted from ${file.type.replace('image/', '')} to JPEG for better compression`,
      );
    }

    // Estimate savings
    let estimatedSavings = 0;
    if (file.size > targetSize) {
      estimatedSavings = Math.min(70, ((file.size - targetSize) / file.size) * 100);
    }

    return {
      willOptimize,
      recommendations:
        recommendations.length > 0 ? recommendations : ['Image is already optimized'],
      estimatedSavings: estimatedSavings > 0 ? estimatedSavings : undefined,
    };
  } catch (error) {
    console.error('Failed to analyze image:', error);
    return {
      willOptimize: true,
      recommendations: ['Image will be optimized for better performance'],
    };
  }
}

/**
 * Create a preview of optimized vs original image for user feedback
 * Returns data URLs for before/after comparison
 */
export async function createOptimizationPreview(
  originalFile: File,
  optimizedFile: File,
): Promise<{
  originalPreview: string;
  optimizedPreview: string;
  comparison: OptimizationResult;
}> {
  const [originalPreview, optimizedPreview, comparison] = await Promise.all([
    createImagePreview(originalFile),
    createImagePreview(optimizedFile),
    imageOptimizer.getOptimizationPreview(originalFile, optimizedFile),
  ]);

  return {
    originalPreview,
    optimizedPreview,
    comparison,
  };
}

/**
 * Helper function to create image preview data URL
 */
function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to create preview'));
    reader.readAsDataURL(file);
  });
}
