// Get API base URL from environment or fallback
const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
    const response = await fetch(`${this.baseUrl}/u/${permalink}`, {
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

    return response.json();
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
