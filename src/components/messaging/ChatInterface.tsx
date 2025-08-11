import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Conversation, messagingService, MessageType } from '@/services/messaging';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeMessaging } from '@/hooks/useRealTimeMessaging';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { toast } from 'react-hot-toast';

interface ChatInterfaceProps {
  conversation: Conversation;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  onClose,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const isTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousScrollHeight = useRef<number>(0);
  
  // Initialize real-time messaging
  const {
    connectionStatus,
    onNewMessage,
    onTyping,
    onMessageRead,
    sendTyping,
    joinConversation,
    leaveConversation,
    typingStatus,
  } = useRealTimeMessaging();

  // Load conversation messages and setup real-time
  useEffect(() => {
    setMessages([]); // Clear previous messages
    setShouldAutoScroll(true); // Reset auto-scroll for new conversation
    loadMessages();
    
    // Join conversation for real-time updates
    joinConversation(conversation.id);
    
    // Cleanup when conversation changes
    return () => {
      leaveConversation(conversation.id);
      setTypingUsers([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, joinConversation, leaveConversation]);

  // Handle scroll behavior based on context
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      if (shouldAutoScroll) {
        // For initial load, scroll immediately. For new messages, scroll smoothly
        const isInitialLoad = page === 1;
        scrollToBottom(!isInitialLoad);
      }
    }
  }, [messages, loading, shouldAutoScroll, page]);

  // Check if user is near the bottom of the chat to decide on auto-scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShouldAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Setup real-time message listener
  useEffect(() => {
    const unsubscribe = onNewMessage(event => {
      if (event.conversation_id === conversation.id) {
        setMessages(prev => {
          // Check if this is a message from the current user (sender)
          const isOwnMessage = event.message.sender_id === user?.id;
          
          if (isOwnMessage) {
            // For own messages, check if we have an optimistic message to replace
            // Use multiple strategies to find the matching optimistic message
            let optimisticIndex = -1;
            
            // Strategy 1: Find the most recent optimistic message of the same type
            for (let i = prev.length - 1; i >= 0; i--) {
              const msg = prev[i];
              if (!msg.id.startsWith('temp-') || msg.sender_id !== user?.id) continue;
              
              // For text messages, match by content and type
              if (msg.type === 'text' && event.message.type === 'text' && msg.content === event.message.content) {
                optimisticIndex = i;
                break;
              }
              
              // For file/image messages, match by type and size
              if ((msg.type === 'image' || msg.type === 'file') && 
                  (event.message.type === 'image' || event.message.type === 'file') &&
                  msg.attachment_type === event.message.attachment_type &&
                  msg.attachment_size === event.message.attachment_size) {
                optimisticIndex = i;
                break;
              }
            }
            
            // Strategy 2: If no exact match, find the newest temp message of the same type
            if (optimisticIndex === -1) {
              for (let i = prev.length - 1; i >= 0; i--) {
                const msg = prev[i];
                if (!msg.id.startsWith('temp-') || msg.sender_id !== user?.id) continue;
                
                if (msg.type === event.message.type) {
                  optimisticIndex = i;
                  break;
                }
              }
            }
            
            if (optimisticIndex !== -1) {
              // Replace optimistic message with real message and clean up blob URL
              const newMessages = [...prev];
              const optimisticMessage = newMessages[optimisticIndex];
              
              // Clean up blob URL if it exists
              if (optimisticMessage.attachment_url && optimisticMessage.attachment_url.startsWith('blob:')) {
                URL.revokeObjectURL(optimisticMessage.attachment_url);
              }
              
              newMessages[optimisticIndex] = { ...event.message, status: 'delivered' };
              return newMessages;
            } else {
              // If no optimistic message found, avoid adding duplicate own messages
              // This prevents the "blink" effect where our own message appears twice
              console.log('No optimistic message found for own message, checking for duplicates');
              const isDuplicate = prev.some(msg => msg.id === event.message.id);
              if (isDuplicate) {
                console.log('Duplicate own message detected, ignoring');
                return prev;
              }
            }
          }
          
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.id === event.message.id);
          if (exists) {
            return prev;
          }
          
          // Add new message from other participants
          const newMessages = [...prev, event.message];
          
          // Sort to ensure proper order
          return newMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        });
      }
    });

    return unsubscribe;
  }, [conversation.id, onNewMessage, user?.id]);

  // Setup typing indicator listener
  useEffect(() => {
    const unsubscribe = onTyping(event => {
      if (event.conversation_id === conversation.id && event.user_id !== user?.id) {
        setTypingUsers(prev => {
          if (event.type === 'typing_start') {
            return prev.includes(event.user_id) ? prev : [...prev, event.user_id];
          } else {
            return prev.filter(userId => userId !== event.user_id);
          }
        });
      }
    });

    return unsubscribe;
  }, [conversation.id, user?.id, onTyping]);

  // Setup message read listener
  useEffect(() => {
    const unsubscribe = onMessageRead(event => {
      if (event.conversation_id === conversation.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === event.message_id 
            ? { ...msg, status: 'read', read_at: event.read_at }
            : msg,
        ));
      }
    });

    return unsubscribe;
  }, [conversation.id, onMessageRead]);

  // Update typing status based on real-time data
  useEffect(() => {
    const conversationTyping = typingStatus[conversation.id] || {};
    const typingUserIds = Object.entries(conversationTyping)
      .filter(([userId, status]) => status.isTyping && userId !== user?.id)
      .map(([userId]) => userId);
    
    setTypingUsers(typingUserIds);
  }, [typingStatus, conversation.id, user?.id]);

  const loadMessages = useCallback(async (pageNum = 1, reset = true) => {
    try {
      setLoading(pageNum === 1);
      
      const response = await messagingService.getConversationHistory(
        conversation.id,
        pageNum,
        20,
      );
      
      // Sort messages by created_at to ensure chronological order (oldest to newest)
      const sortedMessages = response.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      
      if (reset) {
        // Initial load: set messages with recent ones at the bottom
        setMessages(sortedMessages);
      } else {
        // Load more (older messages): prepend to the beginning
        setMessages(prev => [...sortedMessages, ...prev]);
      }
      
      setHasMore(response.has_more);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    const endElement = messagesEndRef.current;
    
    if (container) {
      if (smooth) {
        endElement?.scrollIntoView({ behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  const handleSendMessage = async (content: string, type: MessageType) => {
    if (!content.trim() || sending) return;

    try {
      setSending(true);
      
      // Stop typing indicator
      sendTyping(conversation.id, false);
      
      // Enable auto-scroll when user sends a message
      setShouldAutoScroll(true);
      
      // Generate a unique key for this message that we can use for matching
      const optimisticKey = `${user!.id}-${Date.now()}-${content.substring(0, 10)}`;
      
      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        conversation_id: conversation.id,
        sender_id: user!.id,
        recipient_id: conversation.participant_ids?.find(id => id !== user!.id) || '',
        type,
        content,
        status: 'sending', // Show as sending
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { optimistic_key: optimisticKey }, // Add key for matching
      };
      
      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      const response = await messagingService.sendMessage(conversation.id, {
        type,
        content,
        metadata: { optimistic_key: optimisticKey },
      });
      
      // Replace optimistic message with actual message from server
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? response : msg,
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Mark optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.id.startsWith('temp-') ? { ...msg, status: 'failed' } : msg,
      ));
    } finally {
      setSending(false);
    }
  };

  const handleSendFile = async (file: File, content?: string) => {
    if (sending) return;

    try {
      setSending(true);
      
      // Stop typing indicator
      sendTyping(conversation.id, false);
      
      // Enable auto-scroll when user sends a file
      setShouldAutoScroll(true);
      
      // Determine message type based on file type
      const isImage = file.type.startsWith('image/');
      const messageType = isImage ? 'image' : 'file';
      
      // Generate a unique key for this file message
      const optimisticKey = `${user!.id}-${Date.now()}-${file.name}-${file.size}`;
      
      // Create optimistic message with local preview for images
      const fileUrl = isImage ? URL.createObjectURL(file) : null;
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: user!.id,
        recipient_id: conversation.participant_ids?.find(id => id !== user!.id) || '',
        type: messageType,
        content: content || '',
        attachment_url: fileUrl || undefined,
        attachment_type: file.type,
        attachment_size: file.size,
        status: 'sending',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { optimistic_key: optimisticKey }, // Add key for matching
      };
      
      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      const response = await messagingService.sendFileMessage(
        conversation.id,
        file,
        content,
      );
      
      // Replace optimistic message with actual message from server
      setMessages(prev => prev.map(msg => {
        if (msg.id === optimisticMessage.id) {
          // Clean up the blob URL if it was used
          if (fileUrl) {
            URL.revokeObjectURL(fileUrl);
          }
          return response;
        }
        return msg;
      }));
      
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error(`Failed to send ${file.type.startsWith('image/') ? 'image' : 'file'}`);
      
      // Mark optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.id.startsWith('temp-') ? { ...msg, status: 'failed' } : msg,
      ));
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messagingService.markMessageAsRead(messageId);
      
      // Update message status in local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'read', read_at: new Date().toISOString() }
          : msg,
      ));
      
    } catch (error) {
      console.error('Error marking message as read:', error);
      // Don't show toast for this error as it's not critical
    }
  };

  const handleReply = (message: Message) => {
    // This would need to be implemented to set reply context
    console.log('Reply to message:', message);
    // For now, just scroll to bottom to focus input
    scrollToBottom();
  };

  const loadMoreMessages = async () => {
    if (hasMore && !loading) {
      const container = messagesContainerRef.current;
      if (container) {
        // Store scroll position before loading more messages
        previousScrollHeight.current = container.scrollHeight;
      }
      
      await loadMessages(page + 1, false);
      
      // Restore scroll position after loading older messages
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeight.current;
        container.scrollTop = container.scrollTop + scrollDiff;
      }
    }
  };

  // Handle typing indicator
  const handleTyping = useCallback((isTyping: boolean) => {
    if (isTypingTimeoutRef.current) {
      clearTimeout(isTypingTimeoutRef.current);
    }

    sendTyping(conversation.id, isTyping);

    if (isTyping) {
      // Auto-stop typing after 3 seconds of inactivity
      isTypingTimeoutRef.current = setTimeout(() => {
        sendTyping(conversation.id, false);
      }, 3000);
    }
  }, [conversation.id, sendTyping]);

  const getConversationTitle = () => {
    if (conversation.title) {
      return conversation.title;
    }

    switch (conversation.type) {
      case 'direct':
        const otherParticipants = conversation.participant_ids.filter(id => id !== user?.id);
        return `Chat with ${otherParticipants.length} user${otherParticipants.length !== 1 ? 's' : ''}`;
      case 'group':
        return `Group (${conversation.participant_ids.length} members)`;
      case 'order':
        return 'Order Discussion';
      case 'support':
        return 'Support Chat';
      default:
        return 'Conversation';
    }
  };

  const getConnectionStatusText = () => {
    if (connectionStatus.websocket) {
      return 'Connected';
    } else if (connectionStatus.polling) {
      return 'Syncing';
    } else {
      return 'Offline';
    }
  };

  const getConnectionStatusColor = () => {
    if (connectionStatus.websocket) {
      return 'text-green-600';
    } else if (connectionStatus.polling) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getConversationTitle()}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${
                conversation.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {conversation.status}
              </span>
              <span className={`text-xs ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
              {typingUsers.length > 0 && (
                <span className="text-xs text-blue-600 italic">
                  {typingUsers.length === 1 
                    ? 'Someone is typing...' 
                    : `${typingUsers.length} people are typing...`}
                </span>
              )}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative min-h-0"
        style={{ maxHeight: '100%' }}
      >
        {/* Load more button */}
        {hasMore && !loading && messages.length > 0 && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Load more messages
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Messages */}
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            onReply={handleReply}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}

        {/* No messages state */}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500">Start the conversation by sending a message below</p>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
        
        {/* Scroll to bottom button */}
        {!shouldAutoScroll && (
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={() => {
                setShouldAutoScroll(true);
                scrollToBottom();
              }}
              className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
              title="Scroll to bottom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onTyping={handleTyping}
          disabled={sending || conversation.status !== 'active'}
          uploading={sending}
          placeholder={
            conversation.status !== 'active' 
              ? 'This conversation is not active'
              : 'Type your message...'
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface;