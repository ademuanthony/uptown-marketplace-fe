// Get API base URL from environment or fallback
const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Import product service for fetching product counts
import { productService } from './product';

export interface PublicUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  permalink: string;
  bio?: string;
  profile_image_url?: string;
  joined_at: string;
}

export interface StoreProfile {
  total_products: number;
  active_products: number;
}

export interface TimelinePost {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export interface PublicProfileResponse {
  user: PublicUserProfile;
  store: StoreProfile;
  timeline?: TimelinePost[];
  message: string;
}

class PublicProfileService {
  private readonly baseUrl = getApiBaseUrl();

  async getPublicProfile(permalink: string): Promise<PublicProfileResponse> {
    try {
      // Fetch user profile first
      const response = await fetch(`${this.baseUrl}/users/${permalink}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Failed to fetch public profile: ${response.statusText}`);
      }

      const result = await response.json();

      // Users endpoint returns {success: true, data: {user: UserObject}}
      if (!result.success || !result.data || !result.data.user) {
        throw new Error(result.error?.message || 'Failed to fetch public profile');
      }

      const user = result.data.user;

      // Transform the full user object to match the public profile format
      const publicUser: PublicUserProfile = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        permalink: user.permalink,
        bio: user.bio || undefined,
        profile_image_url: user.profile_image_url || undefined,
        joined_at: user.created_at
          ? user.created_at.split('T')[0]
          : new Date().toISOString().split('T')[0], // Extract date part
      };

      // Fetch the user's published product count in parallel (after we have the user ID)
      let store: StoreProfile = {
        total_products: 0,
        active_products: 0,
      };

      try {
        // Get published products count for this user
        const productsResponse = await productService.listProducts({
          seller_id: user.id,
          status: 'published',
          page: 1,
          page_size: 1, // We only need the count, not the actual products
        });

        store = {
          total_products: productsResponse.total,
          active_products: productsResponse.total, // Published products are considered active
        };
      } catch (error) {
        console.error('Failed to fetch product count for public profile:', error);
        // Keep default values (0, 0) if fetching fails
      }

      return {
        user: publicUser,
        store,
        message: 'Profile retrieved successfully',
      };
    } catch (error) {
      console.error('Error in getPublicProfile:', error);
      throw error;
    }
  }

  // Helper method to get full name
  getFullName(user: PublicUserProfile): string {
    return `${user.first_name} ${user.last_name}`.trim();
  }

  // Helper method to format join date
  formatJoinDate(joinedAt: string): string {
    const date = new Date(joinedAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }
}

export const publicProfileService = new PublicProfileService();
