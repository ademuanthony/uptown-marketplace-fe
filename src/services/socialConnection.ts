import api from './api';

// Connection status interface matching backend
export interface ConnectionStatus {
  from_user_id: string;
  to_user_id: string;
  is_following: boolean;
  is_followed_by: boolean;
  are_friends: boolean;
  is_blocked: boolean;
  is_blocked_by: boolean;
  has_pending_friend_request: boolean;
  has_incoming_friend_request: boolean;
}

// Connection summary for profile stats
export interface ConnectionSummary {
  followers_count: number;
  following_count: number;
  friends_count: number;
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

class SocialConnectionService {
  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<Record<string, never>>>(
        `/social/users/${userId}/follow`,
        {},
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to follow user');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to follow user');
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<Record<string, never>>>(
        `/social/users/${userId}/unfollow`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to unfollow user');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to unfollow user');
    }
  }

  /**
   * Get connection status with a user
   */
  async getConnectionStatus(userId: string): Promise<ConnectionStatus> {
    try {
      const response = await api.get<ApiResponse<ConnectionStatus>>(
        `/social/users/${userId}/connection-status`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get connection status');
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get connection status');
    }
  }

  /**
   * Get connection summary (follower/following counts) for a user
   */
  async getConnectionSummary(userId: string): Promise<ConnectionSummary> {
    try {
      const response = await api.get<ApiResponse<ConnectionSummary>>(
        `/social/users/${userId}/connections/summary`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get connection summary');
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get connection summary');
    }
  }

  /**
   * Get followers list for a user
   */
  async getFollowers(userId: string, page = 1, pageSize = 20) {
    try {
      const response = await api.get<ApiResponse<unknown>>(
        `/social/users/${userId}/followers?page=${page}&page_size=${pageSize}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get followers');
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get followers');
    }
  }

  /**
   * Get following list for a user
   */
  async getFollowing(userId: string, page = 1, pageSize = 20) {
    try {
      const response = await api.get<ApiResponse<unknown>>(
        `/social/users/${userId}/following?page=${page}&page_size=${pageSize}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get following');
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get following');
    }
  }
}

export const socialConnectionService = new SocialConnectionService();
