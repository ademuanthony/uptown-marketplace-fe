'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserIcon, CheckIcon, XMarkIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';
import {
  socialConnectionService,
  FriendRequest,
  PendingRequestsResponse,
} from '@/services/socialConnection';
import { getAbsoluteImageUrl } from '@/utils/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function FriendRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  // Filter valid requests (those with from_user data)
  const validRequests = requests.filter(request => request.from_user);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await socialConnectionService.getPendingFriendRequests(1, 50);
        const data = response as PendingRequestsResponse;
        setRequests(data.requests || []);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
        toast.error('Failed to load friend requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleAcceptRequest = async (userId: string) => {
    setProcessingRequests(prev => new Set(prev).add(userId));

    try {
      await socialConnectionService.acceptFriendRequest(userId);
      toast.success('Friend request accepted!');

      // Remove from the list
      setRequests(prev => prev.filter(req => req.from_user_id !== userId));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to accept friend request';
      toast.error(errorMessage);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setProcessingRequests(prev => new Set(prev).add(userId));

    try {
      await socialConnectionService.rejectFriendRequest(userId);
      toast.success('Friend request rejected');

      // Remove from the list
      setRequests(prev => prev.filter(req => req.from_user_id !== userId));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reject friend request';
      toast.error(errorMessage);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Please log in</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be logged in to view friend requests
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Friend Requests</h1>
              <p className="text-gray-600">
                {validRequests.length === 0
                  ? 'No pending friend requests'
                  : `${validRequests.length} pending request${validRequests.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Friend Requests List */}
        {validRequests.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <UsersIcon className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No friend requests</h3>
            <p className="mt-2 text-gray-500">
              When people send you friend requests, they&apos;ll appear here.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Browse Users
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {validRequests.map(request => (
              <div key={request.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      <div className="relative w-12 h-12">
                        {request.from_user?.profile_image_url ? (
                          <Image
                            src={getAbsoluteImageUrl(request.from_user.profile_image_url)}
                            alt={`${request.from_user?.first_name || ''} ${request.from_user?.last_name || ''}`}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">
                              {request.from_user?.first_name?.[0] || 'U'}
                              {request.from_user?.last_name?.[0] || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/u/${request.from_user?.permalink || ''}`}
                          className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {request.from_user?.first_name || 'Unknown'}{' '}
                          {request.from_user?.last_name || 'User'}
                        </Link>
                      </div>
                      {request.message && (
                        <p className="mt-1 text-sm text-gray-600">
                          &ldquo;{request.message}&rdquo;
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleAcceptRequest(request.from_user_id)}
                      disabled={processingRequests.has(request.from_user_id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingRequests.has(request.from_user_id) ? (
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <CheckIcon className="h-4 w-4 mr-2" />
                      )}
                      Accept
                    </button>

                    <button
                      onClick={() => handleRejectRequest(request.from_user_id)}
                      disabled={processingRequests.has(request.from_user_id)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingRequests.has(request.from_user_id) ? (
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <XMarkIcon className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </button>
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
