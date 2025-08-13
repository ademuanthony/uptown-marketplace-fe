'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  DocumentTextIcon,
  CalendarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { getAbsoluteImageUrl, getProfileImageUrl } from '@/utils/imageUtils';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { TimelinePost } from '@/services/publicProfile';
import { socialContentService, TimelinePostWithMetadata } from '@/services/socialContent';
import { CreateTimelinePostModal } from './CreateTimelinePostModal';

interface TimelineTabProps {
  userId?: string;
  timelinePosts: TimelinePost[];
  isOwner?: boolean; // Whether the current user is viewing their own profile
}

export function TimelineTab({ userId, timelinePosts, isOwner = false }: TimelineTabProps) {
  const { user: currentUser } = useAuth();
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [socialPostsWithMetadata, setSocialPostsWithMetadata] = useState<
    TimelinePostWithMetadata[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const loadTimelinePosts = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await socialContentService.getUserPosts(userId);
      // Store the full metadata structure
      setSocialPostsWithMetadata(response.posts);
      // Update liked posts based on metadata
      const liked = new Set<string>();
      response.posts.forEach(item => {
        if (item.viewer_has_liked) {
          liked.add(item.post.id);
        }
      });
      setLikedPosts(liked);
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
    setShowCreatePostModal(false);
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
  const postsToShow =
    socialPostsWithMetadata.length > 0
      ? socialPostsWithMetadata.map(item => item.post)
      : timelinePosts;

  return (
    <div className="space-y-6">
      {/* Create Post Section (only for profile owner) */}
      {isOwner && currentUser && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="flex space-x-3">
              <Avatar
                src={getProfileImageUrl(currentUser)}
                alt={`${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`}
                size={40}
                className="h-10 w-10 flex-shrink-0"
              />
              <button
                onClick={() => setShowCreatePostModal(true)}
                className="flex-1 rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-2 text-left text-gray-500 transition-colors"
              >
                What&apos;s on your mind, {currentUser?.first_name}?
              </button>
            </div>
            <div className="mt-4 border-t pt-3">
              <button
                onClick={() => setShowCreatePostModal(true)}
                className="flex items-center justify-center w-full rounded-lg hover:bg-gray-100 px-3 py-2 transition-colors"
              >
                <PhotoIcon className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {isOwner && (
        <CreateTimelinePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          onPostCreated={handlePostCreated}
        />
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
        postsToShow.map(post => {
          // Find the corresponding metadata for this post
          const postMetadata = socialPostsWithMetadata.find(item => item.post.id === post.id);

          return (
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
                      <span>
                        {postMetadata?.like_count || ('like_count' in post ? post.like_count : 0)}
                      </span>
                    </button>

                    {/* Comment Button */}
                    <div className="flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                      <span>
                        {postMetadata?.comment_count ||
                          ('comment_count' in post ? post.comment_count : 0)}
                      </span>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={() => handleSharePost(post.id)}
                      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                    >
                      <ShareIcon className="h-5 w-5" />
                      <span>
                        {postMetadata?.share_count ||
                          ('share_count' in post ? post.share_count : 0)}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
