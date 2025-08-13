'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserIcon,
  CalendarIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  StarIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { publicProfileService, PublicProfileResponse } from '@/services/publicProfile';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProductsTab } from '@/components/profile/ProductsTab';
import { TimelineTab } from '@/components/profile/TimelineTab';
import { ReviewsTab } from '@/components/profile/ReviewsTab';

type TabType = 'products' | 'timeline' | 'reviews';

export default function PublicProfilePage() {
  const params = useParams();
  const permalink = params.permalink as string;
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('products');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!permalink) return;

      try {
        setLoading(true);
        setError(null);
        const data = await publicProfileService.getPublicProfile(permalink);
        setProfileData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [permalink]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const { user, store } = profileData;
  const fullName = publicProfileService.getFullName(user);
  const joinDate = publicProfileService.formatJoinDate(user.joined_at);

  // Check if current user is viewing their own profile
  const isOwner = currentUser && currentUser.id === user.id;

  const tabs = [
    {
      id: 'timeline' as TabType,
      name: 'Timeline',
      icon: DocumentTextIcon,
      count: profileData.timeline?.length || 0,
    },
    {
      id: 'products' as TabType,
      name: 'Products',
      icon: ShoppingBagIcon,
      count: store.active_products,
    },
    {
      id: 'reviews' as TabType,
      name: 'Reviews',
      icon: StarIcon,
      count: 0, // TODO: Add review count from API
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  {user.profile_image_url ? (
                    <Image
                      src={getAbsoluteImageUrl(user.profile_image_url)}
                      alt={fullName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center">
                      <span className="text-white text-2xl sm:text-3xl font-bold">
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="mt-4 sm:mt-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{fullName}</h1>
                    {user.bio && <p className="mt-2 text-gray-600 max-w-2xl">{user.bio}</p>}
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>Joined {joinDate}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    {isOwner ? (
                      // Edit Profile Button (for profile owner)
                      <Link
                        href="/profile"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    ) : (
                      // Contact Button (for other viewers)
                      <Link
                        href={`/messages?userId=${user.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                        Contact
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Store URL */}
            <div className="mt-4 text-sm text-gray-500">
              <span className="font-medium">Store URL:</span>{' '}
              <span className="text-primary-600">uptown.ng/u/{user.permalink}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={tabId => setActiveTab(tabId as TabType)}
        />

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'products' && <ProductsTab userId={user.id} />}
          {activeTab === 'timeline' && (
            <TimelineTab
              userId={user.id}
              timelinePosts={profileData.timeline || []}
              isOwner={isOwner || false}
            />
          )}
          {activeTab === 'reviews' && <ReviewsTab userId={user.id} />}
        </div>
      </div>
    </div>
  );
}
