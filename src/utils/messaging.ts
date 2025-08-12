/**
 * Utility functions for messaging features
 */

import { Conversation } from '@/services/messaging';
import { User } from '@/services/auth';
import { userService } from '@/services/user';

// Interface for opponent user info
export interface OpponentInfo {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string | null;
  isOnline?: boolean;
}

// Interface for conversation display info
export interface ConversationDisplayInfo {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  isOpponentOnline?: boolean;
  opponentInfo?: OpponentInfo;
}

/**
 * Get the opponent user ID from a direct conversation
 */
export function getOpponentId(conversation: Conversation, currentUserId?: string): string | null {
  if (conversation.type !== 'direct') {
    return null;
  }

  if (!currentUserId) {
    return null;
  }

  // Find the participant who is not the current user
  const opponentId = conversation.participant_ids.find(id => id !== currentUserId);
  return opponentId || null;
}

/**
 * Get opponent information from conversation (synchronous - returns basic info)
 * Use getOpponentInfoAsync for full user details
 */
export function getOpponentInfo(
  conversation: Conversation,
  currentUserId?: string,
): OpponentInfo | null {
  const opponentId = getOpponentId(conversation, currentUserId);

  if (!opponentId) {
    return null;
  }

  // Return basic info with the ID as fallback
  return {
    id: opponentId,
    name: `User ${opponentId.slice(-8)}`, // Show last 8 chars of ID as fallback
    profileImageUrl: null,
    isOnline: false,
  };
}

/**
 * Get opponent information from conversation with full user details (async)
 */
export async function getOpponentInfoAsync(
  conversation: Conversation,
  currentUserId?: string,
): Promise<OpponentInfo | null> {
  const opponentId = getOpponentId(conversation, currentUserId);

  if (!opponentId) {
    return null;
  }

  try {
    // Fetch user details from API
    const opponentUser = await userService.getUserById(opponentId);

    return {
      id: opponentId,
      name:
        opponentUser.first_name && opponentUser.last_name
          ? `${opponentUser.first_name} ${opponentUser.last_name}`
          : opponentUser.email,
      firstName: opponentUser.first_name,
      lastName: opponentUser.last_name,
      profileImageUrl: opponentUser.profile_image_url,
      isOnline: false, // TODO: Add online status when available
    };
  } catch (error) {
    console.error('Failed to fetch opponent user details:', error);

    // Return fallback info
    return {
      id: opponentId,
      name: `User ${opponentId.slice(-8)}`,
      profileImageUrl: null,
      isOnline: false,
    };
  }
}

/**
 * Get conversation display information for lists and headers
 */
export function getConversationDisplayInfo(
  conversation: Conversation,
  currentUser?: User,
): ConversationDisplayInfo {
  // Use explicit title if available
  if (conversation.title) {
    return {
      title: conversation.title,
      subtitle: getConversationSubtitle(conversation),
    };
  }

  switch (conversation.type) {
    case 'direct': {
      const opponentInfo = getOpponentInfo(conversation, currentUser?.id);
      if (opponentInfo) {
        return {
          title: opponentInfo.name,
          subtitle: `Direct conversation`,
          avatarUrl: opponentInfo.profileImageUrl,
          isOpponentOnline: opponentInfo.isOnline,
          opponentInfo,
        };
      }
      // Fallback for direct conversations
      const otherParticipants = conversation.participant_ids.filter(id => id !== currentUser?.id);
      return {
        title: `Chat with ${otherParticipants.length} user${otherParticipants.length !== 1 ? 's' : ''}`,
        subtitle: 'Direct conversation',
      };
    }

    case 'group':
      return {
        title: conversation.title || `Group (${conversation.participant_ids.length} members)`,
        subtitle: `${conversation.participant_ids.length} participants`,
      };

    case 'order':
      return {
        title: 'Order Discussion',
        subtitle: conversation.order_id ? `Order #${conversation.order_id}` : 'Order related',
      };

    case 'support':
      return {
        title: 'Support Chat',
        subtitle: 'Customer support',
      };

    default:
      return {
        title: 'Conversation',
        subtitle: conversation.type || 'Chat',
      };
  }
}

/**
 * Get conversation subtitle (secondary info)
 */
function getConversationSubtitle(conversation: Conversation): string {
  switch (conversation.type) {
    case 'direct':
      return 'Direct message';
    case 'group':
      return `${conversation.participant_ids.length} participants`;
    case 'order':
      return conversation.order_id ? `Order #${conversation.order_id}` : 'Order discussion';
    case 'support':
      return 'Support team';
    default:
      return 'Conversation';
  }
}

/**
 * Generate fallback avatar URL based on user info
 */
export function getFallbackAvatarUrl(name: string): string {
  const initials = name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=128&background=3b82f6&color=ffffff&format=png`;
}

/**
 * Get avatar URL for opponent or fallback
 */
export function getOpponentAvatarUrl(opponentInfo: OpponentInfo | null): string {
  if (opponentInfo?.profileImageUrl) {
    return opponentInfo.profileImageUrl;
  }

  if (opponentInfo?.name) {
    return getFallbackAvatarUrl(opponentInfo.name);
  }

  // Default fallback
  return getFallbackAvatarUrl('User');
}

/**
 * Check if conversation is a direct conversation with a single opponent
 */
export function isDirectConversation(conversation: Conversation): boolean {
  return conversation.type === 'direct' && conversation.participant_ids.length === 2;
}

/**
 * Format participant count for display
 */
export function formatParticipantCount(count: number): string {
  if (count === 1) return '1 participant';
  return `${count} participants`;
}
