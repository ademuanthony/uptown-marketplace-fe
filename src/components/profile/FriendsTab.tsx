'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { socialConnectionService, FriendRequest } from '@/services/socialConnection';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import toast from 'react-hot-toast';

interface FriendUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  permalink: string;
  bio?: string;
}

interface FriendConnection {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  friend: FriendUser;
}

interface FriendsResponse {
  friends: FriendConnection[];
  total: number;
  limit: number;
  offset: number;
}

interface FriendsTabProps {
  userId: string;
}

export function FriendsTab({ userId }: FriendsTabProps) {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch pending friend requests and friends list in parallel
        const [requestsData, friendsData] = await Promise.all([
          socialConnectionService.getPendingFriendRequests(1, 20),
          socialConnectionService.getFriends(userId, 1, 20),
        ]);

        setFriendRequests(requestsData.requests || []);
        setFriends((friendsData as FriendsResponse)?.friends || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load friends data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleAcceptRequest = async (requestId: string, fromUserId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      await socialConnectionService.acceptFriendRequest(fromUserId);

      // Remove from pending requests
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));

      // Optionally refresh friends list to include new friend
      const friendsData = await socialConnectionService.getFriends(userId, 1, 20);
      setFriends((friendsData as FriendsResponse)?.friends || []);

      toast.success('Friend request accepted');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to accept friend request';
      toast.error(errorMessage);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string, fromUserId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      await socialConnectionService.rejectFriendRequest(fromUserId);

      // Remove from pending requests
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));

      toast.success('Friend request rejected');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reject friend request';
      toast.error(errorMessage);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="flex space-x-2">
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading friends</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Friend Requests ({friendRequests.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {friendRequests.map(request => (
              <div key={request.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href={`/u/${request.from_user.permalink}`}>
                      <div className="relative w-12 h-12 cursor-pointer">
                        {request.from_user.profile_image_url ? (
                          <Image
                            src={getAbsoluteImageUrl(request.from_user.profile_image_url)}
                            alt={`${request.from_user.first_name} ${request.from_user.last_name}`}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {request.from_user.first_name?.[0] || '?'}
                              {request.from_user.last_name?.[0] || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/u/${request.from_user.permalink}`}>
                        <p className="font-medium text-gray-900 hover:text-primary-600 cursor-pointer">
                          {request.from_user.first_name} {request.from_user.last_name}
                        </p>
                      </Link>
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Sent {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id, request.from_user_id)}
                      disabled={processingRequests.has(request.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id, request.from_user_id)}
                      disabled={processingRequests.has(request.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Friends ({friends.length})</h3>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No friends yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start connecting with people to build your network.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {friends.map(friendship => (
              <div key={friendship.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href={`/u/${friendship.friend.permalink}`}>
                      <div className="relative w-12 h-12 cursor-pointer">
                        {friendship.friend.profile_image_url ? (
                          <Image
                            src={getAbsoluteImageUrl(friendship.friend.profile_image_url)}
                            alt={`${friendship.friend.first_name} ${friendship.friend.last_name}`}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {friendship.friend.first_name?.[0] || '?'}
                              {friendship.friend.last_name?.[0] || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/u/${friendship.friend.permalink}`}>
                        <p className="font-medium text-gray-900 hover:text-primary-600 cursor-pointer">
                          {friendship.friend.first_name} {friendship.friend.last_name}
                        </p>
                      </Link>
                      {friendship.friend.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {friendship.friend.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/messages?userId=${friendship.friend.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      Message
                    </Link>
                    <Link
                      href={`/u/${friendship.friend.permalink}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
