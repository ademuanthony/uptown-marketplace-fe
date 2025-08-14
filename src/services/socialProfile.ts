import api from './api';
import { isAxiosError } from 'axios';

// Social profile visibility levels
export type SocialProfileVisibility = 'public' | 'friends' | 'private';

// Social verification levels
export type SocialVerificationLevel = 'none' | 'basic' | 'verified' | 'elite';

// Social profile settings
export interface SocialProfileSettings {
  allow_friend_requests: boolean;
  allow_followers: boolean;
  show_online_status: boolean;
  show_elite_status: boolean;
  allow_product_sharing: boolean;
  allow_tagging: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_notifications: boolean;
  show_in_discovery: boolean;
  allow_private_messages: boolean;
  show_profile_views: boolean;
}

// Social stats
export interface SocialStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
  friends_count: number;
  likes_received: number;
  comments_received: number;
  shares_received: number;
  influence_score: number;
}

// Social profile interface
export interface SocialProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  website?: string;
  location?: string;
  avatar_url?: string;
  cover_url?: string;
  interests: string[];
  visibility: SocialProfileVisibility;
  verification: SocialVerificationLevel;
  stats: SocialStats;
  settings: SocialProfileSettings;
  created_at: string;
  updated_at: string;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: number;
  };
}

// Create profile request
export interface CreateSocialProfileRequest {
  display_name: string;
  bio?: string;
  website?: string;
  location?: string;
  interests?: string[];
  visibility?: SocialProfileVisibility;
}

// Update profile request
export interface UpdateSocialProfileRequest {
  display_name?: string;
  bio?: string;
  website?: string;
  location?: string;
  interests?: string[];
  visibility?: SocialProfileVisibility;
  settings?: Partial<SocialProfileSettings>;
}

class SocialProfileService {
  /**
   * Get current user's social profile
   */
  async getMySocialProfile(): Promise<SocialProfile> {
    try {
      const response = await api.get<ApiResponse<SocialProfile>>('/social/profile/me');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get social profile');
      }

      return response.data.data;
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Social profile not found');
        }
        if (error.response?.data?.error?.message) {
          throw new Error(error.response.data.error.message);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to get social profile');
    }
  }

  /**
   * Get social profile by user ID
   */
  async getSocialProfile(userId: string): Promise<SocialProfile> {
    try {
      const response = await api.get<ApiResponse<SocialProfile>>(`/social/profile/${userId}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get social profile');
      }

      return response.data.data;
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Social profile not found');
        }
        if (error.response?.data?.error?.message) {
          throw new Error(error.response.data.error.message);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to get social profile');
    }
  }

  /**
   * Create a new social profile
   */
  async createSocialProfile(profileData: CreateSocialProfileRequest): Promise<SocialProfile> {
    try {
      const response = await api.post<ApiResponse<SocialProfile>>('/social/profile', profileData);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to create social profile');
      }

      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to create social profile');
    }
  }

  /**
   * Update social profile
   */
  async updateSocialProfile(profileData: UpdateSocialProfileRequest): Promise<SocialProfile> {
    try {
      const response = await api.put<ApiResponse<SocialProfile>>('/social/profile', profileData);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to update social profile');
      }

      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to update social profile');
    }
  }

  /**
   * Delete social profile
   */
  async deleteSocialProfile(): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<Record<string, never>>>('/social/profile');

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to delete social profile');
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to delete social profile');
    }
  }

  /**
   * Get social profile stats for a user
   */
  async getSocialProfileStats(userId: string): Promise<SocialStats> {
    try {
      const response = await api.get<ApiResponse<SocialStats>>(`/social/profile/${userId}/stats`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get profile stats');
      }

      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to get profile stats');
    }
  }

  /**
   * Search social profiles
   */
  async searchSocialProfiles(params: {
    query?: string;
    interests?: string[];
    location?: string;
    verification?: SocialVerificationLevel;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: SocialProfile[]; total: number }> {
    try {
      const searchParams = new URLSearchParams();

      if (params.query) searchParams.append('query', params.query);
      if (params.location) searchParams.append('location', params.location);
      if (params.verification) searchParams.append('verification', params.verification);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.interests?.length) {
        params.interests.forEach(interest => searchParams.append('interests', interest));
      }

      const response = await api.get<ApiResponse<{ profiles: SocialProfile[]; total: number }>>(
        `/social/profiles/search?${searchParams.toString()}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to search profiles');
      }

      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to search profiles');
    }
  }
}

export const socialProfileService = new SocialProfileService();
