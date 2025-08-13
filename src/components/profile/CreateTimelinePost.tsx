'use client';

import { useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { socialContentService, TimelinePostType, PostVisibility } from '@/services/socialContent';

interface CreateTimelinePostProps {
  onPostCreated?: () => void;
  onCancel?: () => void;
}

export function CreateTimelinePost({ onPostCreated, onCancel }: CreateTimelinePostProps) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<TimelinePostType>('text');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (content.length > 10000) {
      setError('Content cannot exceed 10,000 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await socialContentService.createPost({
        content: content.trim(),
        post_type: postType,
        visibility,
      });

      setContent('');
      setPostType('text');
      setVisibility('public');

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create a post</h3>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content Input */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isLoading}
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span></span>
            <span>{content.length}/10,000</span>
          </div>
        </div>

        {/* Post Settings */}
        <div className="mb-4 flex flex-wrap gap-4">
          {/* Post Type */}
          <div>
            <label htmlFor="post-type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="post-type"
              value={postType}
              onChange={e => setPostType(e.target.value as TimelinePostType)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isLoading}
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
              <option value="poll">Poll</option>
              <option value="event">Event</option>
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={e => setVisibility(e.target.value as PostVisibility)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isLoading}
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="followers">Followers</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Additional Options */}
        <div className="mb-6 flex items-center space-x-4">
          <button
            type="button"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <PhotoIcon className="h-5 w-5 mr-1" />
            Add Photo
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
