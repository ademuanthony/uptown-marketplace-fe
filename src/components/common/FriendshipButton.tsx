'use client';

import { useState } from 'react';
import {
  UserPlusIcon,
  UserMinusIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { socialConnectionService, ConnectionStatus } from '@/services/socialConnection';
import toast from 'react-hot-toast';

interface FriendshipButtonProps {
  userId: string;
  connectionStatus: ConnectionStatus;
  onStatusChange: (newStatus: Partial<ConnectionStatus>) => void;
  className?: string;
}

export function FriendshipButton({
  userId,
  connectionStatus,
  onStatusChange,
  className = '',
}: FriendshipButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Determine current friendship state
  const getCurrentState = () => {
    if (connectionStatus.are_friends) return 'friends';
    if (connectionStatus.has_pending_friend_request) return 'pending_sent';
    if (connectionStatus.has_incoming_friend_request) return 'pending_received';
    return 'none';
  };

  const friendshipState = getCurrentState();

  const handleSendFriendRequest = async () => {
    setIsLoading(true);
    try {
      await socialConnectionService.sendFriendRequest(userId);
      toast.success('Friend request sent!');
      onStatusChange({ has_pending_friend_request: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send friend request';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    setIsLoading(true);
    try {
      await socialConnectionService.acceptFriendRequest(userId);
      toast.success('Friend request accepted!');
      onStatusChange({
        are_friends: true,
        has_incoming_friend_request: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to accept friend request';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    setIsLoading(true);
    try {
      await socialConnectionService.rejectFriendRequest(userId);
      toast.success('Friend request rejected');
      onStatusChange({ has_incoming_friend_request: false });
      setShowRejectConfirm(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reject friend request';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setIsLoading(true);
    try {
      await socialConnectionService.removeFriend(userId);
      toast.success('Friend removed');
      onStatusChange({ are_friends: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove friend';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const baseButtonClass = `inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${className}`;
  const loadingClass = isLoading ? 'opacity-50 cursor-not-allowed' : '';

  // Different button states based on friendship status
  switch (friendshipState) {
    case 'friends':
      return (
        <button
          onClick={handleRemoveFriend}
          disabled={isLoading}
          className={`${baseButtonClass} border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500 ${loadingClass}`}
        >
          {isLoading ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <UserMinusIcon className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Removing...' : 'Remove Friend'}
        </button>
      );

    case 'pending_sent':
      return (
        <button
          disabled
          className={`${baseButtonClass} border-yellow-300 text-yellow-700 bg-yellow-50 cursor-not-allowed`}
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Friend Request Sent
        </button>
      );

    case 'pending_received':
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAcceptFriendRequest}
            disabled={isLoading}
            className={`${baseButtonClass} border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 ${loadingClass}`}
          >
            {isLoading ? (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <CheckIcon className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Accepting...' : 'Accept'}
          </button>

          {!showRejectConfirm ? (
            <button
              onClick={() => setShowRejectConfirm(true)}
              className={`${baseButtonClass} border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500`}
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Reject
            </button>
          ) : (
            <button
              onClick={handleRejectFriendRequest}
              disabled={isLoading}
              className={`${baseButtonClass} border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500 ${loadingClass}`}
            >
              {isLoading ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          )}
        </div>
      );

    case 'none':
    default:
      return (
        <button
          onClick={handleSendFriendRequest}
          disabled={isLoading}
          className={`${baseButtonClass} border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 ${loadingClass}`}
        >
          {isLoading ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <UserPlusIcon className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Sending...' : 'Add Friend'}
        </button>
      );
  }
}
