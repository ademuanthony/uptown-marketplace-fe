'use client';

import { useState, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  PhotoIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { socialContentService, PostVisibility } from '@/services/socialContent';
import {
  optimizeMessagingImage,
  validateImageFile,
  getOptimizationRecommendations,
  getProfileImageUrl,
  type OptimizationProgress,
} from '@/utils/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import Avatar from '@/components/common/Avatar';

interface CreateTimelinePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const visibilityOptions = [
  {
    value: 'public' as PostVisibility,
    label: 'Public',
    icon: GlobeAltIcon,
    description: 'Anyone can see this post',
  },
  {
    value: 'friends' as PostVisibility,
    label: 'Friends',
    icon: UsersIcon,
    description: 'Only your friends can see',
  },
  {
    value: 'private' as PostVisibility,
    label: 'Private',
    icon: LockClosedIcon,
    description: 'Only you can see this',
  },
];

export function CreateTimelinePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreateTimelinePostModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [, setOptimizationProgress] = useState<OptimizationProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 'profile');
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid image file');
      return;
    }

    setIsOptimizingImage(true);

    try {
      // Show optimization recommendations
      const recommendations = await getOptimizationRecommendations(file, 'profile');
      if (recommendations.willOptimize) {
        toast.success('Optimizing image for timeline...', { duration: 2000 });
      }

      // Optimize the image
      const { optimizedFile, result } = await optimizeMessagingImage(file, progress =>
        setOptimizationProgress(progress),
      );

      // Show optimization results
      if (result.compressionRatio > 5) {
        toast.success(`Image optimized! ${result.compressionRatio.toFixed(1)}% smaller.`, {
          duration: 3000,
        });
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(optimizedFile);

      setSelectedImage(optimizedFile);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in to create a post');
      return;
    }

    if (!content.trim() && !selectedImage) {
      toast.error('Please add some text or an image');
      return;
    }

    setIsLoading(true);

    try {
      // Automatically determine post type based on content
      let postType: 'text' | 'image' | 'mixed' = 'text';

      if (selectedImage && content.trim()) {
        postType = 'mixed';
      } else if (selectedImage && !content.trim()) {
        postType = 'image';
      } else {
        postType = 'text';
      }

      const postData: {
        content: string;
        post_type: typeof postType;
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
          const imageUrl = await socialContentService.uploadTimelineImage(selectedImage);
          postData.image_url = imageUrl;
        } catch (error) {
          console.error('Image upload failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
          toast.error(errorMessage);
          return;
        }
      }

      await socialContentService.createPost(postData);

      toast.success('Post created successfully!');

      // Reset form
      setContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setVisibility('public');

      if (onPostCreated) {
        onPostCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const currentVisibility =
    visibilityOptions.find(option => option.value === visibility) ?? visibilityOptions[0];
  const VisibilityIcon = currentVisibility?.icon ?? GlobeAltIcon;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Create Post
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 pt-4 pb-2">
                  {/* User Info */}
                  <div className="flex items-start space-x-3 mb-4">
                    {user && (
                      <Avatar
                        src={getProfileImageUrl(user)}
                        alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                        size={40}
                        className="h-10 w-10"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </div>
                      {/* Visibility Selector */}
                      <div className="mt-1">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                          onClick={() => {
                            // Cycle through visibility options
                            const currentIndex = visibilityOptions.findIndex(
                              opt => opt.value === visibility,
                            );
                            const nextIndex = (currentIndex + 1) % visibilityOptions.length;
                            setVisibility(visibilityOptions[nextIndex]?.value ?? 'public');
                          }}
                        >
                          <VisibilityIcon className="h-3 w-3 mr-1" />
                          {currentVisibility?.label ?? 'Public'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Input */}
                  <div>
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder={`What's on your mind, ${user?.first_name}?`}
                      rows={imagePreview ? 3 : 5}
                      className="w-full resize-none border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 text-lg"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4 relative">
                      <div className="relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={imagePreview}
                          alt="Selected image"
                          width={500}
                          height={300}
                          className="w-full h-auto object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1.5 bg-gray-800 bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition-colors"
                          disabled={isLoading}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-700 mr-2">
                        Add to your post
                      </span>

                      {/* Image Button */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isLoading || isOptimizingImage}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={classNames(
                          'inline-flex items-center p-2 rounded-full transition-colors',
                          isOptimizingImage
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-100 text-green-600',
                        )}
                        disabled={isLoading || isOptimizingImage}
                        title="Add photo"
                      >
                        {isOptimizingImage ? (
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <PhotoIcon className="h-6 w-6" />
                        )}
                      </button>
                    </div>

                    {/* Post Button */}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        isLoading || isOptimizingImage || (!content.trim() && !selectedImage)
                      }
                      className={classNames(
                        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        isLoading || isOptimizingImage || (!content.trim() && !selectedImage)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700',
                      )}
                    >
                      {isLoading ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
