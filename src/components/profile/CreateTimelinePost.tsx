'use client';

import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { socialContentService, TimelinePostType, PostVisibility } from '@/services/socialContent';
import {
  optimizeMessagingImage,
  validateImageFile,
  getOptimizationRecommendations,
  type OptimizationProgress,
} from '@/utils/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface CreateTimelinePostProps {
  onPostCreated?: () => void;
  onCancel?: () => void;
}

export function CreateTimelinePost({ onPostCreated, onCancel }: CreateTimelinePostProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<TimelinePostType>('text');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [, setOptimizationProgress] = useState<OptimizationProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file (using 'profile' context - similar validation rules)
    const validation = validateImageFile(file, 'profile');
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid image file');
      return;
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        console.warn('Timeline image warning:', warning);
      });
    }

    setIsOptimizingImage(true);

    try {
      // Show optimization recommendations
      const recommendations = await getOptimizationRecommendations(file, 'profile');
      if (recommendations.willOptimize) {
        toast.success('Optimizing image for timeline...', { duration: 2000 });
      }

      // Optimize the image using messaging optimization (suitable for timeline)
      const { optimizedFile, result } = await optimizeMessagingImage(file, progress =>
        setOptimizationProgress(progress),
      );

      // Show optimization results
      if (result.compressionRatio > 5) {
        toast.success(`Image optimized! ${result.compressionRatio.toFixed(1)}% smaller.`, {
          duration: 3000,
        });
      } else {
        toast.success('Image optimized for timeline.');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(optimizedFile);

      setSelectedImage(optimizedFile);
      setPostType('image'); // Automatically switch to image type
      console.info('Image optimized successfully for timeline');
    } catch (error) {
      console.error('Image optimization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      toast.error(errorMessage);
    } finally {
      setIsOptimizingImage(false);
      setOptimizationProgress(null);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (postType === 'image') {
      setPostType('text');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication status
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create a post');
      toast.error('Please log in to create a post');
      return;
    }

    if (!content.trim() && !selectedImage) {
      setError('Content or image is required');
      return;
    }

    if (content.length > 10000) {
      setError('Content cannot exceed 10,000 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.info('Creating post with user:', user?.id);
      console.info('Authentication status:', isAuthenticated);
      console.info('Post content length:', content.trim().length);
      console.info('Selected image:', selectedImage ? 'Yes' : 'No');

      const postData: {
        content: string;
        post_type: TimelinePostType;
        visibility: PostVisibility;
        image_url?: string;
      } = {
        content: content.trim(),
        post_type: postType,
        visibility,
      };

      // Upload image if one is selected
      if (selectedImage) {
        try {
          console.info('Uploading timeline image...');
          toast.success('Uploading image...', { duration: 2000 });

          const imageUrl = await socialContentService.uploadTimelineImage(selectedImage);
          postData.image_url = imageUrl;

          // Update post type based on content
          if (content.trim()) {
            postData.post_type = 'mixed'; // Text + Image
          } else {
            postData.post_type = 'image'; // Image only
          }

          console.info('Image uploaded successfully:', imageUrl);
          toast.success('Image uploaded successfully!', { duration: 2000 });
        } catch (error) {
          console.error('Image upload failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
          toast.error(errorMessage);
          return; // Don't create the post if image upload fails
        }
      }

      console.info('Sending post data:', postData);

      const result = await socialContentService.createPost(postData);
      console.info('Post created successfully:', result);

      // Reset form
      setContent('');
      setPostType('text');
      setVisibility('public');
      setSelectedImage(null);
      setImagePreview(null);

      toast.success('Post created successfully!');

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError(null);
    setSelectedImage(null);
    setImagePreview(null);
    setPostType('text');
    if (onCancel) {
      onCancel();
    }
  };

  // Don't render the form if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Please log in to create a post.</p>
      </div>
    );
  }

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
            disabled={isLoading || isUploadingImage}
          />
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span></span>
            <span>{content.length}/10,000</span>
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <div className="relative w-full max-w-md mx-auto">
              <Image
                src={imagePreview}
                alt="Selected image"
                width={400}
                height={300}
                className="rounded-lg object-cover w-full"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                disabled={isLoading}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

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
              <option value="mixed">Text + Image</option>
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
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Additional Options */}
        <div className="mb-6 flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={isLoading || isUploadingImage}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isUploadingImage || isOptimizingImage}
          >
            {isUploadingImage || isOptimizingImage ? (
              <div className="h-5 w-5 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
            ) : (
              <PhotoIcon className="h-5 w-5 mr-1" />
            )}
            {isOptimizingImage
              ? 'Optimizing...'
              : isUploadingImage
                ? 'Uploading...'
                : selectedImage
                  ? 'Change Photo'
                  : 'Add Photo'}
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
            disabled={
              isLoading ||
              isUploadingImage ||
              isOptimizingImage ||
              (!content.trim() && !selectedImage)
            }
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
