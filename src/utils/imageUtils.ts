/**
 * Utility functions for handling image URLs in the Uptown Marketplace
 */

// Get the API base URL from environment variables
const getApiBaseUrl = (): string => {
  // Check for Next.js public environment variable first
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '');
  }
  
  // Fallback to production or development URLs
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.uptown.ng';
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

  // If it starts with /uploads, it's a relative path from the API server
  if (imagePath.startsWith('/uploads')) {
    return `${getApiBaseUrl()}${imagePath}`;
  }

  // If it starts with just uploads (no leading slash), add the slash
  if (imagePath.startsWith('uploads')) {
    return `${getApiBaseUrl()}/${imagePath}`;
  }

  // For any other relative path, assume it's from the API server
  return `${getApiBaseUrl()}/${imagePath}`;
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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=3b82f6&color=ffffff&format=svg`;
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
  const initials = (firstName.charAt(0) + lastName.charAt(0)) || '?';
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
      'api.uptown.ng',
      'amazonaws.com',
      'unsplash.com',
      'ui-avatars.com',
      'res.cloudinary.com',
    ];

    return allowedDomains.some(domain => 
      url.hostname === domain || 
      url.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
};