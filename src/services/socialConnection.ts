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

// Friend request interface
export interface FriendRequest {
  id: string;
  from_user_id: string;
  from_user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    permalink: string;
  };
  message: string;
  created_at: string;
}

// Pending requests response
export interface PendingRequestsResponse {
  requests: FriendRequest[];
  total: number;
  limit: number;
  offset: number;
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

  /**
   * Send a friend request to a user
   */
  async sendFriendRequest(userId: string, message?: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<Record<string, never>>>(
        `/social/users/${userId}/friend-request`,
        { message: message || '' },
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to send friend request');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send friend request');
    }
  }

  /**
   * Accept a friend request from a user
   */
  async acceptFriendRequest(userId: string): Promise<void> {
    try {
      const response = await api.put<ApiResponse<Record<string, never>>>(
        `/social/users/${userId}/friend-request/accept`,
        {},
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to accept friend request');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to accept friend request');
    }
  }

  /**
   * Reject a friend request from a user
   */
  async rejectFriendRequest(userId: string): Promise<void> {
    try {
      const response = await api.put<ApiResponse<Record<string, never>>>(
        `/social/users/${userId}/friend-request/reject`,
        {},
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to reject friend request');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reject friend request');
    }
  }

  /**
   * Remove a friend (unfriend)
   */
  async removeFriend(userId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<Record<string, never>>>(
        `/social/users/${userId}/remove-friend`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to remove friend');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to remove friend');
    }
  }

  /**
   * Get pending friend requests for the current user
   */
  async getPendingFriendRequests(page = 1, pageSize = 20): Promise<PendingRequestsResponse> {
    try {
      const response = await api.get<ApiResponse<PendingRequestsResponse>>(
        `/social/friend-requests/pending?limit=${pageSize}&offset=${(page - 1) * pageSize}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get pending friend requests');
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get pending friend requests');
    }
  }

  /**
   * Get friends list for a user
   */
  async getFriends(userId: string, page = 1, pageSize = 20) {
    try {
      const response = await api.get<ApiResponse<unknown>>(
        `/social/users/${userId}/friends?limit=${pageSize}&offset=${(page - 1) * pageSize}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get friends');
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get friends');
    }
  }
}

export const socialConnectionService = new SocialConnectionService();
