'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPinIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { MatchScore, interestMatchingService } from '@/services/interestMatching';
import { socialConnectionService, ConnectionStatus } from '@/services/socialConnection';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import { FriendshipButton } from '@/components/common/FriendshipButton';
import toast from 'react-hot-toast';

interface UserCardProps {
  matchScore: MatchScore;
  className?: string;
  showFullProfile?: boolean;
}

// Interest categories for color coding (consistent with InterestsSection)
const categorizeInterest = (interest: string): string => {
  const lowerInterest = interest.toLowerCase();

  const INTEREST_CATEGORIES = {
    lifestyle: 'bg-purple-100 text-purple-700 border-purple-200',
    sports: 'bg-green-100 text-green-700 border-green-200',
    music: 'bg-pink-100 text-pink-700 border-pink-200',
    food: 'bg-orange-100 text-orange-700 border-orange-200',
    travel: 'bg-blue-100 text-blue-700 border-blue-200',
    technology: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    entertainment: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    social: 'bg-red-100 text-red-700 border-red-200',
  };

  const keywords = {
    lifestyle: [
      'yoga',
      'meditation',
      'wellness',
      'mindfulness',
      'spirituality',
      'self-care',
      'health',
      'fitness',
    ],
    sports: [
      'gym',
      'running',
      'hiking',
      'cycling',
      'swimming',
      'football',
      'basketball',
      'tennis',
      'soccer',
      'workout',
      'crossfit',
      'marathon',
      'climbing',
      'surfing',
      'skiing',
    ],
    music: [
      'music',
      'concerts',
      'art',
      'painting',
      'dancing',
      'singing',
      'guitar',
      'piano',
      'jazz',
      'rock',
      'classical',
      'hip-hop',
      'electronic',
      'festivals',
    ],
    food: [
      'cooking',
      'restaurants',
      'wine',
      'coffee',
      'baking',
      'foodie',
      'cuisine',
      'dining',
      'craft beer',
      'cocktails',
      'barbecue',
      'vegan',
      'vegetarian',
    ],
    travel: [
      'travel',
      'adventure',
      'backpacking',
      'exploration',
      'wanderlust',
      'culture',
      'photography',
      'nature',
      'camping',
      'road trips',
      'beaches',
      'mountains',
    ],
    technology: [
      'technology',
      'startups',
      'ai',
      'gaming',
      'coding',
      'programming',
      'blockchain',
      'cryptocurrency',
      'innovation',
      'gadgets',
      'software',
      'apps',
      'tech',
    ],
    entertainment: [
      'movies',
      'books',
      'shows',
      'netflix',
      'reading',
      'cinema',
      'tv series',
      'podcasts',
      'anime',
      'comedy',
      'theater',
      'streaming',
    ],
    social: [
      'volunteering',
      'networking',
      'community',
      'charity',
      'social impact',
      'activism',
      'mentoring',
      'leadership',
      'teamwork',
      'public speaking',
    ],
  };

  for (const [category, categoryKeywords] of Object.entries(keywords)) {
    if (categoryKeywords.some(keyword => lowerInterest.includes(keyword))) {
      return INTEREST_CATEGORIES[category as keyof typeof INTEREST_CATEGORIES];
    }
  }

  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export function UserCard({ matchScore, className = '', showFullProfile = false }: UserCardProps) {
  const { user: currentUser } = useAuth();
  const { profile, sharedInterests, matchPercentage } = matchScore;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isLoadingConnection, setIsLoadingConnection] = useState(true);

  // Get user display info
  const userDisplayName = profile.display_name || `${profile.user_id}`;
  const userLocation = profile.location;
  const matchColorClass = interestMatchingService.getMatchColorClass(matchPercentage);
  const matchQuality = interestMatchingService.getMatchQuality(matchPercentage);

  // Fetch connection status
  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!currentUser || !profile.user_id) return;

      try {
        setIsLoadingConnection(true);
        const status = await socialConnectionService.getConnectionStatus(profile.user_id);
        setConnectionStatus(status);
      } catch (error) {
        console.error('Failed to fetch connection status:', error);
        // Set default status if fetch fails
        setConnectionStatus({
          from_user_id: currentUser.id,
          to_user_id: profile.user_id,
          is_following: false,
          is_followed_by: false,
          are_friends: false,
          is_blocked: false,
          is_blocked_by: false,
          has_pending_friend_request: false,
          has_incoming_friend_request: false,
        });
      } finally {
        setIsLoadingConnection(false);
      }
    };

    fetchConnectionStatus();
  }, [currentUser, profile.user_id]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!connectionStatus || !currentUser) return;

    setIsFollowLoading(true);
    try {
      const isCurrentlyFollowing = connectionStatus.is_following;

      if (isCurrentlyFollowing) {
        await socialConnectionService.unfollowUser(profile.user_id);
        toast.success('Unfollowed successfully');
      } else {
        await socialConnectionService.followUser(profile.user_id);
        toast.success('Following successfully');
      }

      // Update local state
      setConnectionStatus(prev =>
        prev
          ? {
              ...prev,
              is_following: !isCurrentlyFollowing,
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

  // Handle connection status changes from FriendshipButton
  const handleConnectionStatusChange = (changes: Partial<ConnectionStatus>) => {
    setConnectionStatus(prev => (prev ? { ...prev, ...changes } : null));
  };

  // Get verification badge
  const getVerificationBadge = () => {
    switch (profile.verification) {
      case 'verified':
        return (
          <div className="flex items-center text-xs text-blue-600">
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            Verified
          </div>
        );
      case 'elite':
        return (
          <div className="flex items-center text-xs text-yellow-600">
            <StarIcon className="h-3 w-3 mr-1" />
            Elite
          </div>
        );
      default:
        return null;
    }
  };

  const displayInterests = showFullProfile ? sharedInterests : sharedInterests.slice(0, 3);
  const hasMoreInterests = sharedInterests.length > 3 && !showFullProfile;

  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header with Match Score */}
      <div
        className={`px-4 py-2 border-l-4 ${matchQuality === 'excellent' ? 'border-emerald-500 bg-emerald-50' : matchQuality === 'great' ? 'border-green-500 bg-green-50' : matchQuality === 'good' ? 'border-blue-500 bg-blue-50' : 'border-gray-500 bg-gray-50'}`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${matchColorClass}`}
          >
            {interestMatchingService.formatMatchPercentage(matchPercentage)}
          </span>
          {getVerificationBadge()}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-start space-x-3 mb-4">
          {/* Profile Image */}
          <Link href={`/u/${profile.user_id}`} className="flex-shrink-0">
            <div className="relative w-12 h-12">
              {profile.avatar_url ? (
                <Image
                  src={getAbsoluteImageUrl(profile.avatar_url)}
                  alt={userDisplayName}
                  fill
                  className="rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <Link href={`/u/${profile.user_id}`} className="block">
              <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors">
                {userDisplayName}
              </h3>
            </Link>

            {userLocation && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate">{userLocation}</span>
              </div>
            )}

            {profile.bio && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2" title={profile.bio}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Shared Interests */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">
            Shared Interests ({sharedInterests.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {displayInterests.map((interest, index) => (
              <span
                key={`${interest}-${index}`}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${categorizeInterest(interest)}`}
                title={`Shared interest: ${interest}`}
              >
                {interest.charAt(0).toUpperCase() + interest.slice(1)}
              </span>
            ))}
            {hasMoreInterests && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-600 bg-gray-50">
                +{sharedInterests.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between space-x-2">
          {/* Follow Button */}
          {!isLoadingConnection && connectionStatus && (
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className={`flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                connectionStatus.is_following
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  : 'border-transparent text-white bg-blue-600 hover:bg-blue-700'
              } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFollowLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : connectionStatus.is_following ? (
                <>
                  <UserMinusIcon className="h-3 w-3 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </button>
          )}

          {/* Friendship Button */}
          {!isLoadingConnection && connectionStatus && (
            <div className="flex-1">
              <FriendshipButton
                userId={profile.user_id}
                connectionStatus={connectionStatus}
                onStatusChange={handleConnectionStatusChange}
                className="w-full text-xs px-3 py-1.5"
              />
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoadingConnection && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
