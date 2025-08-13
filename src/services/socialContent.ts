import api from './api';
import { isAxiosError } from 'axios';

// Timeline post types
export type TimelinePostType = 'text' | 'image' | 'video' | 'link' | 'poll' | 'event';
export type PostVisibility = 'public' | 'friends' | 'private' | 'followers';
export type InteractionType = 'like' | 'comment' | 'share';

// Timeline post interface
export interface TimelinePost {
  id: string;
  user_id: string;
  content: string;
  post_type: TimelinePostType;
  visibility: PostVisibility;
  attachment_url?: string;
  attachment_type?: string;
  attachment_size?: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Post interaction interface
export interface PostInteraction {
  id: string;
  post_id: string;
  user_id: string;
  interaction_type: InteractionType;
  content?: string;
  parent_comment_id?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: number;
  };
  message?: string;
}

// Request/Response types
export interface CreateTimelinePostRequest {
  content: string;
  post_type?: TimelinePostType;
  visibility?: PostVisibility;
  attachment_url?: string;
  attachment_type?: string;
  attachment_size?: number;
}

export interface CreateTimelinePostResponse {
  post: TimelinePost;
}

export interface GetTimelinePostResponse {
  post: TimelinePost;
  viewer_has_liked?: boolean;
  viewer_has_shared?: boolean;
  recent_comments?: PostInteraction[];
}

export interface UpdateTimelinePostRequest {
  content?: string;
  visibility?: PostVisibility;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface UpdateTimelinePostResponse {
  post: TimelinePost;
}

export interface DeleteTimelinePostResponse {
  message: string;
}

export interface ListUserTimelinePostsRequest {
  page?: number;
  page_size?: number;
  only_pinned?: boolean;
}

export interface ListUserTimelinePostsResponse {
  posts: TimelinePost[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreatePostInteractionRequest {
  interaction_type: InteractionType;
  content?: string;
  parent_comment_id?: string;
}

export interface CreatePostInteractionResponse {
  interaction: PostInteraction;
}

// Social Content Service Class
export class SocialContentService {
  // Create a new timeline post
  async createPost(request: CreateTimelinePostRequest): Promise<TimelinePost> {
    try {
      const response = await api.post<ApiResponse<CreateTimelinePostResponse>>(
        '/social/posts',
        request,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.post;
      } else {
        throw new Error(response.data.error?.message || 'Failed to create timeline post');
      }
    } catch (error: unknown) {
      console.error('Error creating timeline post:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to create timeline post');
      }
      throw new Error('Failed to create timeline post');
    }
  }

  // Get a specific timeline post
  async getPost(postId: string): Promise<GetTimelinePostResponse> {
    try {
      const response = await api.get<ApiResponse<GetTimelinePostResponse>>(
        `/social/posts/${postId}`,
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get timeline post');
      }
    } catch (error: unknown) {
      console.error('Error getting timeline post:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to get timeline post');
      }
      throw new Error('Failed to get timeline post');
    }
  }

  // Update a timeline post
  async updatePost(postId: string, request: UpdateTimelinePostRequest): Promise<TimelinePost> {
    try {
      const response = await api.put<ApiResponse<UpdateTimelinePostResponse>>(
        `/social/posts/${postId}`,
        request,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.post;
      } else {
        throw new Error(response.data.error?.message || 'Failed to update timeline post');
      }
    } catch (error: unknown) {
      console.error('Error updating timeline post:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to update timeline post');
      }
      throw new Error('Failed to update timeline post');
    }
  }

  // Delete a timeline post
  async deletePost(postId: string): Promise<string> {
    try {
      const response = await api.delete<ApiResponse<DeleteTimelinePostResponse>>(
        `/social/posts/${postId}`,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.message;
      } else {
        throw new Error(response.data.error?.message || 'Failed to delete timeline post');
      }
    } catch (error: unknown) {
      console.error('Error deleting timeline post:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to delete timeline post');
      }
      throw new Error('Failed to delete timeline post');
    }
  }

  // Get timeline posts for a specific user
  async getUserPosts(
    userId: string,
    options: ListUserTimelinePostsRequest = {},
  ): Promise<ListUserTimelinePostsResponse> {
    try {
      const params: Record<string, unknown> = {
        page: options.page || 1,
        page_size: options.page_size || 20,
      };

      if (options.only_pinned) {
        params.only_pinned = true;
      }

      const response = await api.get<ApiResponse<ListUserTimelinePostsResponse>>(
        `/social/users/${userId}/posts`,
        { params },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get user timeline posts');
      }
    } catch (error: unknown) {
      console.error('Error getting user timeline posts:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error?.message || 'Failed to get user timeline posts',
        );
      }
      throw new Error('Failed to get user timeline posts');
    }
  }

  // Create an interaction on a post (like, comment, share)
  async createInteraction(
    postId: string,
    request: CreatePostInteractionRequest,
  ): Promise<PostInteraction> {
    try {
      const response = await api.post<ApiResponse<CreatePostInteractionResponse>>(
        `/social/posts/${postId}/interactions`,
        request,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.interaction;
      } else {
        throw new Error(response.data.error?.message || 'Failed to create post interaction');
      }
    } catch (error: unknown) {
      console.error('Error creating post interaction:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error?.message || 'Failed to create post interaction',
        );
      }
      throw new Error('Failed to create post interaction');
    }
  }

  // Like a post
  async likePost(postId: string): Promise<PostInteraction> {
    return this.createInteraction(postId, {
      interaction_type: 'like',
    });
  }

  // Comment on a post
  async commentOnPost(
    postId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<PostInteraction> {
    return this.createInteraction(postId, {
      interaction_type: 'comment',
      content,
      parent_comment_id: parentCommentId,
    });
  }

  // Share a post
  async sharePost(postId: string, content?: string): Promise<PostInteraction> {
    return this.createInteraction(postId, {
      interaction_type: 'share',
      content,
    });
  }

  // Get pinned posts for a user
  async getPinnedPosts(userId: string): Promise<ListUserTimelinePostsResponse> {
    return this.getUserPosts(userId, { only_pinned: true });
  }
}

// Export singleton instance
export const socialContentService = new SocialContentService();
export default socialContentService;
