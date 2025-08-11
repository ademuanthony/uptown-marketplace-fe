'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CameraIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  StarIcon,
  CalendarIcon,
  ShoppingBagIcon,
  HeartIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { profileSchema, type ProfileFormData } from '@/schemas/auth';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user';
import { getProfileImageUrl } from '@/utils/imageUtils';
import Avatar from '@/components/common/Avatar';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user, reset]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const profileData = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone_number || undefined,
      };

      const updatedUser = await userService.updateProfile(profileData);

      // Update the auth context with the new user data
      updateUser(updatedUser);

      // Update the form with the latest data
      reset({
        firstName: updatedUser.first_name || '',
        lastName: updatedUser.last_name || '',
        email: updatedUser.email || '',
        phone_number: updatedUser.phone_number || '',
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setAvatarPreview(null);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to API
      const updatedUser = await userService.uploadAvatar(file);

      // Update the auth context with the new user data
      updateUser(updatedUser);

      // Clear preview since we now have the real avatar
      setAvatarPreview(null);

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload profile picture';
      toast.error(errorMessage);
      console.error('Avatar upload error:', error);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);

    try {
      // Remove from API
      const updatedUser = await userService.removeAvatar();

      // Update the auth context with the new user data
      updateUser(updatedUser);

      setAvatarPreview(null);
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to remove profile picture';
      toast.error(errorMessage);
      console.error('Avatar removal error:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 transition-all duration-300"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:space-x-8">
              {/* Profile Picture Section */}
              <div className="flex-shrink-0 mb-6 lg:mb-0">
                <div className="relative">
                  {/* Avatar Display */}
                  <div className="relative">
                    {user && (
                      <Avatar
                        key={`${user.first_name}-${user.last_name}-${user.profile_image_url}`}
                        src={avatarPreview || getProfileImageUrl(user)}
                        alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                        size={120}
                        className="w-30 h-30 border-4 border-gray-200"
                      />
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  {isEditing && (
                    <div className="absolute bottom-0 right-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                        disabled={isUploadingAvatar}
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow border border-gray-300 cursor-pointer block"
                      >
                        <CameraIcon className="h-5 w-5 text-gray-600" />
                      </label>
                    </div>
                  )}
                </div>

                {/* Avatar Actions */}
                {isEditing && (avatarPreview || user?.profile_image_url) && (
                  <div className="mt-2 text-center">
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700">4.8</span>
                    <span className="text-sm text-gray-500">(24 reviews)</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Joined January 2024</span>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="flex-1">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          {...register('firstName')}
                          type="text"
                          className={`w-full px-3 py-2 border ${
                            errors.firstName ? 'border-red-300' : 'border-gray-300'
                          } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{user?.first_name || 'Not set'}</p>
                      )}
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          {...register('lastName')}
                          type="text"
                          className={`w-full px-3 py-2 border ${
                            errors.lastName ? 'border-red-300' : 'border-gray-300'
                          } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{user?.last_name || 'Not set'}</p>
                      )}
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        {...register('email')}
                        type="email"
                        className={`w-full px-3 py-2 border ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user?.email}</p>
                    )}
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        {...register('phone_number')}
                        type="tel"
                        className={`w-full px-3 py-2 border ${
                          errors.phone_number ? 'border-red-300' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                        placeholder="+1 (555) 123-4567"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user?.phone_number || 'Not set'}</p>
                    )}
                    {errors.phone_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <ShoppingBagIcon className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Store</h3>
            <p className="text-gray-600 text-sm mb-4">Manage your store and listings</p>
            <button
              onClick={() => router.push('/my-store')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View Store →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <HeartIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Favorites</h3>
            <p className="text-gray-600 text-sm mb-4">Items you&apos;ve saved</p>
            <button
              onClick={() => router.push('/favorites')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View Favorites →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <Cog6ToothIcon className="h-6 w-6 text-accent-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600 text-sm mb-4">Account preferences</p>
            <button
              onClick={() => router.push('/settings')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View Settings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
