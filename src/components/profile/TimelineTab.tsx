'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  DocumentTextIcon,
  CalendarIcon,
  PlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import { TimelinePost } from '@/services/publicProfile';
import { socialContentService, TimelinePost as SocialTimelinePost } from '@/services/socialContent';
import { CreateTimelinePost } from './CreateTimelinePost';

interface TimelineTabProps {
  userId?: string;
  timelinePosts: TimelinePost[];
  isOwner?: boolean; // Whether the current user is viewing their own profile
}

export function TimelineTab({ userId, timelinePosts, isOwner = false }: TimelineTabProps) {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [socialPosts, setSocialPosts] = useState<SocialTimelinePost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const loadTimelinePosts = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await socialContentService.getUserPosts(userId);
      setSocialPosts(response.posts);
    } catch (error) {
      console.error('Failed to load timeline posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load social timeline posts when userId changes
  useEffect(() => {
    if (userId) {
      loadTimelinePosts();
    }
  }, [userId, loadTimelinePosts]);

  const handlePostCreated = () => {
    setShowCreatePost(false);
    loadTimelinePosts(); // Refresh the posts
  };

  const handleLikePost = async (postId: string) => {
    try {
      await socialContentService.likePost(postId);
      setLikedPosts(prev => new Set(prev).add(postId));
      // Refresh posts to get updated like count
      loadTimelinePosts();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      await socialContentService.sharePost(postId);
      // Refresh posts to get updated share count
      loadTimelinePosts();
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Use social posts if available, otherwise fall back to legacy timeline posts
  const postsToShow = socialPosts.length > 0 ? socialPosts : timelinePosts;

  return (
    <div className="space-y-6">
      {/* Create Post Button (only for profile owner) */}
      {isOwner && (
        <div className="bg-white rounded-lg shadow p-4">
          {showCreatePost ? (
            <CreateTimelinePost
              onPostCreated={handlePostCreated}
              onCancel={() => setShowCreatePost(false)}
            />
          ) : (
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Share something on your timeline
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* No Posts State */}
      {!isLoading && postsToShow.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No timeline posts</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isOwner
              ? 'Share your first post to get started!'
              : "This user hasn't shared anything on their timeline yet."}
          </p>
        </div>
      )}

      {/* Timeline Posts */}
      {!isLoading &&
        postsToShow.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow p-6">
            {/* Post Header */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{formatPostDate(post.created_at)}</span>
            </div>

            {/* Post Content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Post Image - handle both legacy image_url and new attachment_url */}
            {(('image_url' in post && post.image_url) ||
              ('attachment_url' in post && post.attachment_url)) && (
              <div className="mt-4">
                <div className="relative w-full max-w-lg mx-auto">
                  <Image
                    src={getAbsoluteImageUrl(
                      ('image_url' in post ? post.image_url : '') ||
                        ('attachment_url' in post ? post.attachment_url : '') ||
                        '',
                    )}
                    alt="Timeline post image"
                    width={500}
                    height={300}
                    className="rounded-lg object-cover w-full"
                  />
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-6">
                  {/* Like Button */}
                  {'like_count' in post ? (
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className="flex items-center space-x-1 hover:text-red-600 transition-colors"
                      disabled={likedPosts.has(post.id)}
                    >
                      {likedPosts.has(post.id) ? (
                        <HeartIconSolid className="h-5 w-5 text-red-600" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                      <span>{post.like_count}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="h-5 w-5" />
                      <span>0</span>
                    </div>
                  )}

                  {/* Comment Button */}
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                    <span>{'comment_count' in post ? post.comment_count : 0}</span>
                  </div>

                  {/* Share Button */}
                  {'share_count' in post ? (
                    <button
                      onClick={() => handleSharePost(post.id)}
                      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                    >
                      <ShareIcon className="h-5 w-5" />
                      <span>{post.share_count}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <ShareIcon className="h-5 w-5" />
                      <span>0</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
