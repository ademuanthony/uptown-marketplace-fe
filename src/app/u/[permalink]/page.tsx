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
  UserGroupIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import { publicProfileService, PublicProfileResponse } from '@/services/publicProfile';
import {
  socialConnectionService,
  ConnectionStatus,
  ConnectionSummary,
} from '@/services/socialConnection';
import { socialProfileService, SocialProfile } from '@/services/socialProfile';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProductsTab } from '@/components/profile/ProductsTab';
import { TimelineTab } from '@/components/profile/TimelineTab';
import { FriendsTab } from '@/components/profile/FriendsTab';
import { FriendshipButton } from '@/components/common/FriendshipButton';
import { InterestsSection } from '@/components/profile/InterestsSection';
import { InterestsEditorModal } from '@/components/profile/InterestsEditorModal';

type TabType = 'products' | 'timeline' | 'friends';

export default function PublicProfilePage() {
  const params = useParams();
  const permalink = params.permalink as string;
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  // Social connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [connectionSummary, setConnectionSummary] = useState<ConnectionSummary | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Social profile state
  const [socialProfile, setSocialProfile] = useState<SocialProfile | null>(null);

  // Interests editor state
  const [isInterestsEditorOpen, setIsInterestsEditorOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!permalink) return;

      try {
        setLoading(true);
        setError(null);
        const data = await publicProfileService.getPublicProfile(permalink);
        setProfileData(data);

        // Fetch social profile data for all users (if available)
        try {
          const profileInfo = await socialProfileService.getSocialProfile(data.user.id);
          setSocialProfile(profileInfo);
        } catch (socialProfileError) {
          console.info('Social profile not available for user:', socialProfileError);
          // Social profile is optional, don't show error
        }

        // Fetch connection data if user is authenticated and viewing another user's profile
        if (currentUser && currentUser.id !== data.user.id) {
          try {
            const [status, summary] = await Promise.all([
              socialConnectionService.getConnectionStatus(data.user.id),
              socialConnectionService.getConnectionSummary(data.user.id),
            ]);
            setConnectionStatus(status);
            setConnectionSummary(summary);
          } catch (connectionError) {
            console.error('Failed to fetch connection data:', connectionError);
            // Don't fail the whole page if connection data fails
          }
        } else if (currentUser && currentUser.id === data.user.id) {
          // For own profile, just fetch summary
          try {
            const summary = await socialConnectionService.getConnectionSummary(data.user.id);
            setConnectionSummary(summary);
          } catch (connectionError) {
            console.error('Failed to fetch connection summary:', connectionError);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [permalink, currentUser]);

  // Handle follow/unfollow actions
  const handleFollowToggle = async () => {
    if (!profileData || !connectionStatus || !currentUser) return;

    setIsFollowLoading(true);

    try {
      const isCurrentlyFollowing = connectionStatus.is_following;

      if (isCurrentlyFollowing) {
        await socialConnectionService.unfollowUser(profileData.user.id);
        toast.success('Unfollowed successfully');
      } else {
        await socialConnectionService.followUser(profileData.user.id);
        toast.success('Following successfully');
      }

      // Optimistic update
      setConnectionStatus(prev =>
        prev
          ? {
              ...prev,
              is_following: !isCurrentlyFollowing,
            }
          : null,
      );

      // Update follower count optimistically
      setConnectionSummary(prev =>
        prev
          ? {
              ...prev,
              followers_count: prev.followers_count + (isCurrentlyFollowing ? -1 : 1),
            }
          : null,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update follow status';
      toast.error(errorMessage);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle friendship status changes
  const handleConnectionStatusChange = (changes: Partial<ConnectionStatus>) => {
    setConnectionStatus(prev => (prev ? { ...prev, ...changes } : null));

    // Update friends count in summary if friendship status changed
    if (changes.are_friends !== undefined) {
      setConnectionSummary(prev =>
        prev
          ? {
              ...prev,
              friends_count: prev.friends_count + (changes.are_friends ? 1 : -1),
            }
          : null,
      );
    }
  };

  // Handle interests update
  const handleUpdateInterests = async (newInterests: string[]) => {
    if (!currentUser) return;

    try {
      let updatedProfile: SocialProfile;

      try {
        // Always try to update first (in case profile exists but wasn't loaded)
        updatedProfile = await socialProfileService.updateSocialProfile({
          interests: newInterests,
        });
      } catch (updateError) {
        // If update fails with "not found", try to create a new profile
        if (updateError instanceof Error && updateError.message.includes('not found')) {
          const displayName = `${currentUser.first_name} ${currentUser.last_name}`;
          updatedProfile = await socialProfileService.createSocialProfile({
            display_name: displayName,
            interests: newInterests,
          });
        } else {
          // If it's any other error, re-throw it
          throw updateError;
        }
      }

      setSocialProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update interests:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

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
    // Only show Friends tab for profile owners
    ...(isOwner
      ? [
          {
            id: 'friends' as TabType,
            name: 'Friends',
            icon: UserGroupIcon,
            count: connectionSummary?.friends_count || 0,
          },
        ]
      : []),
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

                    {/* Connection Stats */}
                    {connectionSummary && (
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium">{connectionSummary.followers_count}</span>
                          <span className="ml-1">Followers</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">{connectionSummary.following_count}</span>
                          <span className="ml-1">Following</span>
                        </div>
                        {connectionSummary.friends_count > 0 && (
                          <div className="flex items-center">
                            <span className="font-medium">{connectionSummary.friends_count}</span>
                            <span className="ml-1">Friends</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* User Interests */}
                    <InterestsSection
                      interests={socialProfile?.interests || []}
                      className="mt-4"
                      isOwner={!!isOwner}
                      onEditInterests={() => setIsInterestsEditorOpen(true)}
                    />
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
                      // Action buttons for other viewers
                      <div className="flex items-center space-x-3">
                        {/* Follow/Unfollow Button */}
                        {currentUser && connectionStatus && (
                          <button
                            onClick={handleFollowToggle}
                            disabled={isFollowLoading}
                            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                              connectionStatus.is_following
                                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
                                : 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                            } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isFollowLoading ? (
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : connectionStatus.is_following ? (
                              <UserMinusIcon className="h-4 w-4 mr-2" />
                            ) : (
                              <UserPlusIcon className="h-4 w-4 mr-2" />
                            )}
                            {isFollowLoading
                              ? 'Loading...'
                              : connectionStatus.is_following
                                ? 'Following'
                                : 'Follow'}
                          </button>
                        )}

                        {/* Friendship Button */}
                        {currentUser && connectionStatus && (
                          <FriendshipButton
                            userId={user.id}
                            connectionStatus={connectionStatus}
                            onStatusChange={handleConnectionStatusChange}
                          />
                        )}

                        {/* Contact Button - Only show if users are friends */}
                        {connectionStatus?.are_friends && (
                          <Link
                            href={`/messages?userId=${user.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                            Contact
                          </Link>
                        )}
                      </div>
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
          {activeTab === 'friends' && isOwner && <FriendsTab userId={user.id} />}
        </div>
      </div>

      {/* Interests Editor Modal */}
      {!!isOwner && (
        <InterestsEditorModal
          isOpen={isInterestsEditorOpen}
          onClose={() => setIsInterestsEditorOpen(false)}
          currentInterests={socialProfile?.interests || []}
          onSave={handleUpdateInterests}
        />
      )}
    </div>
  );
}
