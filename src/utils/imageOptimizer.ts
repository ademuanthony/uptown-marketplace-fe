/**
 * Image Optimization Utility
 * Provides client-side image compression and optimization for uploads
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSize?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
  cropToSquare?: boolean;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  originalDimensions: { width: number; height: number };
  optimizedDimensions: { width: number; height: number };
}

// Context-specific optimization presets
export const OPTIMIZATION_PRESETS = {
  product: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    format: 'jpeg' as const,
    maintainAspectRatio: true,
    cropToSquare: false,
  },
  profile: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.8,
    maxFileSize: 500 * 1024, // 500KB
    format: 'jpeg' as const,
    maintainAspectRatio: true,
    cropToSquare: true,
  },
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.75,
    maxFileSize: 100 * 1024, // 100KB
    format: 'jpeg' as const,
    maintainAspectRatio: true,
    cropToSquare: false,
  },
  messaging: {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.8,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    format: 'jpeg' as const,
    maintainAspectRatio: true,
    cropToSquare: false,
  },
} as const;

class ImageOptimizer {
  /**
   * Get image dimensions from a file
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    cropToSquare = false,
  ): { width: number; height: number } {
    if (cropToSquare) {
      const size = Math.min(maxWidth, maxHeight);
      return { width: size, height: size };
    }

    const aspectRatio = originalWidth / originalHeight;

    let newWidth = Math.min(originalWidth, maxWidth);
    let newHeight = Math.min(originalHeight, maxHeight);

    // Maintain aspect ratio
    if (newWidth / newHeight > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  /**
   * Resize and compress image using Canvas API
   */
  async resizeAndCompressImage(
    file: File,
    targetWidth: number,
    targetHeight: number,
    quality: number,
    format: string,
    cropToSquare = false,
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        const { naturalWidth, naturalHeight } = img;

        // Set canvas dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate source dimensions for cropping
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = naturalWidth;
        let sourceHeight = naturalHeight;

        if (cropToSquare) {
          // Center crop to square
          const minDimension = Math.min(naturalWidth, naturalHeight);
          sourceX = (naturalWidth - minDimension) / 2;
          sourceY = (naturalHeight - minDimension) / 2;
          sourceWidth = minDimension;
          sourceHeight = minDimension;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw and resize image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight,
        );

        // Convert to blob
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }

            // Create new file with optimized content
            const optimizedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          `image/${format}`,
          quality,
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing'));
      };

      // Create object URL and load image
      const url = URL.createObjectURL(file);
      img.src = url;

      // Set up handlers and load image
      const originalOnLoad = img.onload;
      const originalOnError = img.onerror;

      img.onload = () => {
        URL.revokeObjectURL(url);
        if (originalOnLoad) originalOnLoad.call(img, new Event('load'));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        if (originalOnError) originalOnError.call(img, new Event('error'));
      };
    });
  }

  /**
   * Determine optimal quality based on file size
   */
  getOptimalQuality(fileSize: number, baseQuality: number): number {
    const MB = 1024 * 1024;

    if (fileSize < 0.5 * MB) return Math.min(baseQuality + 0.1, 0.95); // High quality for small files
    if (fileSize < 2 * MB) return baseQuality; // Base quality for medium files
    if (fileSize < 5 * MB) return Math.max(baseQuality - 0.1, 0.6); // Lower quality for large files
    return Math.max(baseQuality - 0.2, 0.5); // Much lower quality for very large files
  }

  /**
   * Core image compression function
   */
  async compressImage(file: File, options: OptimizationOptions): Promise<File> {
    // Validate input
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    // Check browser support
    if (typeof document === 'undefined' || !document.createElement) {
      throw new Error('Canvas API not available');
    }

    try {
      const originalDimensions = await this.getImageDimensions(file);
      const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 0.8,
        format = 'jpeg',
        cropToSquare = false,
      } = options;

      // Calculate optimal dimensions
      const targetDimensions = this.calculateOptimalDimensions(
        originalDimensions.width,
        originalDimensions.height,
        maxWidth,
        maxHeight,
        cropToSquare,
      );

      // Determine optimal quality based on file size
      const optimalQuality = this.getOptimalQuality(file.size, quality);

      // Skip optimization if file is already small and doesn't need resizing
      const needsResizing =
        originalDimensions.width > maxWidth ||
        originalDimensions.height > maxHeight ||
        cropToSquare;

      const needsCompression = file.size > (options.maxFileSize || 2 * 1024 * 1024);

      if (!needsResizing && !needsCompression && file.type === `image/${format}`) {
        console.info('Image already optimized, returning original');
        return file;
      }

      // Perform optimization
      const optimizedFile = await this.resizeAndCompressImage(
        file,
        targetDimensions.width,
        targetDimensions.height,
        optimalQuality,
        format,
        cropToSquare,
      );

      console.info('Image optimization completed:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        optimizedSize: `${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
        compressionRatio: `${((1 - optimizedFile.size / file.size) * 100).toFixed(1)}%`,
        originalDimensions,
        targetDimensions,
      });

      return optimizedFile;
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw error;
    }
  }

  /**
   * Optimize image for product uploads
   */
  async optimizeForProductUpload(file: File): Promise<File> {
    return this.compressImage(file, OPTIMIZATION_PRESETS.product);
  }

  /**
   * Optimize image for profile pictures
   */
  async optimizeForProfilePicture(file: File): Promise<File> {
    return this.compressImage(file, OPTIMIZATION_PRESETS.profile);
  }

  /**
   * Optimize image for thumbnails
   */
  async optimizeForThumbnail(file: File): Promise<File> {
    return this.compressImage(file, OPTIMIZATION_PRESETS.thumbnail);
  }

  /**
   * Optimize image for messaging uploads
   */
  async optimizeForMessaging(file: File): Promise<File> {
    return this.compressImage(file, OPTIMIZATION_PRESETS.messaging);
  }

  /**
   * Get optimization result details
   */
  async getOptimizationPreview(
    originalFile: File,
    optimizedFile: File,
  ): Promise<OptimizationResult> {
    const originalDimensions = await this.getImageDimensions(originalFile);
    const optimizedDimensions = await this.getImageDimensions(optimizedFile);

    return {
      originalSize: originalFile.size,
      optimizedSize: optimizedFile.size,
      compressionRatio: (1 - optimizedFile.size / originalFile.size) * 100,
      originalDimensions,
      optimizedDimensions,
    };
  }

  /**
   * Validate if file meets size requirements after optimization
   */
  validateOptimizedFile(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Convert image format
   */
  async convertFormat(file: File, format: string, quality = 0.8): Promise<File> {
    if (file.type === `image/${format}`) {
      return file; // Already in desired format
    }

    const dimensions = await this.getImageDimensions(file);
    return this.resizeAndCompressImage(file, dimensions.width, dimensions.height, quality, format);
  }

  /**
   * Check if browser supports WebP format
   */
  supportsWebP(): boolean {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer();
export default imageOptimizer;
