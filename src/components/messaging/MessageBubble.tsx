import React from 'react';
import { Message, MessageStatus } from '@/services/messaging';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { processMessageContent } from '@/utils/messageUtils';

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  onMarkAsRead?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onReply, onMarkAsRead }) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;
  const isRead = message.status === 'read';

  const handleMarkAsRead = () => {
    if (!isRead && !isOwnMessage && onMarkAsRead) {
      onMarkAsRead(message.id);
    }
  };

  const getStatusIcon = (status: MessageStatus | 'sending') => {
    switch (status) {
      case 'sending':
        return <span className="text-gray-400">⏳</span>;
      case 'sent':
        return <span className="text-gray-400">✓</span>;
      case 'delivered':
        return <span className="text-gray-500">✓✓</span>;
      case 'read':
        return <span className="text-blue-500">✓✓</span>;
      case 'failed':
        return <span className="text-red-500">✗</span>;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div
      className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      onClick={handleMarkAsRead}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
        }`}
      >
        {/* Reply indicator */}
        {message.reply_to_id && (
          <div className="text-xs opacity-70 mb-1 italic border-l-2 pl-2 border-gray-300">
            Replying to message
          </div>
        )}

        {/* Message content */}
        <div className="break-words">
          {message.type === 'text' && <div>{processMessageContent(message.content)}</div>}

          {message.type === 'image' && (
            <div>
              {message.attachment_url ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.attachment_url}
                    alt="Shared image"
                    className="rounded max-w-full h-auto mb-2"
                    loading="lazy"
                  />
                  {message.status === 'sending' && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 rounded flex items-center justify-center">
                      <div className="bg-white rounded-full p-2">
                        <div className="w-6 h-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-64 h-32 bg-gray-200 rounded flex items-center justify-center mb-2">
                  <div className="w-6 h-6 animate-spin rounded-full border-b-2 border-gray-600"></div>
                </div>
              )}
              {message.content && (
                <div className="text-sm">{processMessageContent(message.content)}</div>
              )}
            </div>
          )}

          {message.type === 'file' && message.attachment_url && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-2 bg-gray-100 rounded">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">File attachment</p>
                  <p className="text-xs text-gray-500">
                    {message.attachment_type}
                    {message.attachment_size &&
                      ` • ${(message.attachment_size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Download
                </a>
              </div>
              {message.content && (
                <div className="text-sm">{processMessageContent(message.content)}</div>
              )}
            </div>
          )}
        </div>

        {/* Message metadata */}
        <div
          className={`flex justify-between items-center mt-2 text-xs ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          <div className="flex items-center space-x-1">
            {message.edited_at && <span className="italic">edited</span>}
            {isOwnMessage && getStatusIcon(message.status)}
          </div>
        </div>

        {/* Action buttons */}
        {onReply && !isOwnMessage && (
          <button
            onClick={e => {
              e.stopPropagation();
              onReply(message);
            }}
            className={`mt-2 text-xs underline ${isOwnMessage ? 'text-blue-100' : 'text-blue-600'}`}
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
