import React from 'react';
import { Conversation } from '@/services/messaging';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation?: () => void;
  loading?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  loading = false,
}) => {
  const { user } = useAuth();

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) {
      return conversation.title;
    }

    // For direct conversations, show the other participant's name
    if (conversation.type === 'direct') {
      // This would need to be enhanced to show actual user names
      // For now, show participant count
      const otherParticipants = conversation.participant_ids.filter(id => id !== user?.id);
      return `Chat with ${otherParticipants.length} user${otherParticipants.length !== 1 ? 's' : ''}`;
    }

    if (conversation.type === 'group') {
      return `Group (${conversation.participant_ids.length} members)`;
    }

    if (conversation.type === 'order') {
      return 'Order Discussion';
    }

    return 'Conversation';
  };

  const getConversationIcon = (conversation: Conversation) => {
    switch (conversation.type) {
      case 'direct':
        return (
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'group':
        return (
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
        );
      case 'order':
        return (
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getUserUnreadCount = (conversation: Conversation) => {
    const userUnreadCount = conversation.unread_count[user?.id || ''] || 0;
    return userUnreadCount;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          {onCreateConversation && (
            <button
              onClick={onCreateConversation}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="New conversation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm">Start a conversation to connect with others</p>
            {onCreateConversation && (
              <button
                onClick={onCreateConversation}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Conversation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const unreadCount = getUserUnreadCount(conversation);
              const isSelected = conversation.id === selectedConversationId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left ${
                    isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  {getConversationIcon(conversation)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${
                        unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {getConversationTitle(conversation)}
                      </p>
                      {conversation.last_message_at && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.message_count === 0 
                          ? 'No messages yet' 
                          : `${conversation.message_count} message${conversation.message_count !== 1 ? 's' : ''}`
                        }
                      </p>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;