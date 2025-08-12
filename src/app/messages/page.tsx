'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeMessaging } from '@/hooks/useRealTimeMessaging';
import { Conversation, ConversationType, messagingService } from '@/services/messaging';
import ConversationList from '@/components/messaging/ConversationList';
import ChatInterface from '@/components/messaging/ChatInterface';
import CreateConversationModal from '@/components/messaging/CreateConversationModal';
import { toast } from 'react-hot-toast';

// Loading component for Suspense fallback
const MessagesLoading: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Component that uses useSearchParams - needs to be wrapped in Suspense
const MessagesContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessingUserId, setIsProcessingUserId] = useState(false);

  // Initialize real-time messaging
  const { connectionStatus, onNewMessage, onConversationUpdate, startTracking, stopTracking } =
    useRealTimeMessaging();

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messagingService.getUserConversations(1, 50);
      setConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get or create direct conversation with specified user
  const handleUserIdFromQuery = useCallback(
    async (userId: string) => {
      if (isProcessingUserId) return; // Prevent duplicate requests

      try {
        setIsProcessingUserId(true);

        // Get or create direct conversation
        const conversation = await messagingService.getOrCreateDirectConversation(userId);

        // Reload conversations to ensure we have the latest list
        await loadConversations();

        // Wait a moment for state to update, then find and select the conversation
        setTimeout(() => {
          setConversations(prev => {
            const targetConversation = prev.find(conv => conv.id === conversation.id);
            if (targetConversation) {
              setSelectedConversation(targetConversation);
              setShowMobileChat(true);
              toast.success('Conversation ready!');
            }
            return prev;
          });
        }, 100);
      } catch (error) {
        console.error('Error handling userId from query:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start conversation';
        toast.error(errorMessage);
      } finally {
        setIsProcessingUserId(false);
      }
    },
    [isProcessingUserId, loadConversations],
  );

  // Load conversations on component mount
  useEffect(() => {
    if (user && !authLoading) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Setup real-time conversation updates
  useEffect(() => {
    const unsubscribeConversationUpdate = onConversationUpdate(event => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv.id === event.conversation_id);
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...Object.fromEntries(
              Object.entries(event.conversation).filter(([_, value]) => value !== undefined),
            ),
          } as Conversation;

          // Sort by last_message_at to keep most recent first
          updated.sort((a, b) => {
            const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
            const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
            return bTime - aTime;
          });

          return updated;
        } else if (event.conversation) {
          // Add new conversation
          return [event.conversation as Conversation, ...prev];
        }
        return prev;
      });

      // Update selected conversation if it's the one being updated
      setSelectedConversation(prev => {
        if (prev && prev.id === event.conversation_id) {
          return { ...prev, ...event.conversation };
        }
        return prev;
      });
    });

    const unsubscribeNewMessage = onNewMessage(event => {
      // Update conversation list to reflect new message
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === event.conversation_id) {
            return {
              ...conv,
              message_count: conv.message_count + 1,
              last_message_at: event.message.created_at,
              // Don't update unread count here as it should come from the backend
            };
          }
          return conv;
        });

        // Sort by last_message_at
        updated.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime;
        });

        return updated;
      });
    });

    return () => {
      unsubscribeConversationUpdate();
      unsubscribeNewMessage();
    };
  }, [onConversationUpdate, onNewMessage]);

  // Track conversations for real-time updates
  useEffect(() => {
    const conversationIds = conversations.map(conv => conv.id);
    if (conversationIds.length > 0) {
      startTracking(conversationIds);
    }

    return () => {
      stopTracking();
    };
  }, [conversations, startTracking, stopTracking]);

  // Handle conversation selection from URL parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const targetConversation = conversations.find(conv => conv.id === conversationId);
      if (targetConversation) {
        setSelectedConversation(targetConversation);
        setShowMobileChat(true);
      }
    }
  }, [searchParams, conversations]);

  // Handle userId query parameter to get or create direct conversation
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && user && !authLoading && !loading && !isProcessingUserId) {
      handleUserIdFromQuery(userId);
    }
  }, [searchParams, user, authLoading, loading, isProcessingUserId, handleUserIdFromQuery]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  const handleCreateConversation = () => {
    setShowCreateModal(true);
  };

  const handleCreateConversationSubmit = async (
    type: ConversationType,
    title?: string,
    participantIds?: string[],
  ) => {
    try {
      let conversation: Conversation;

      if (type === 'direct' && participantIds && participantIds.length > 0 && participantIds[0]) {
        conversation = await messagingService.createDirectConversation(participantIds[0]);
      } else if (type === 'group' && title) {
        conversation = await messagingService.createGroupConversation(title, participantIds || []);
      } else if (type === 'support') {
        // For support conversations, we might need a different approach
        conversation = await messagingService.createConversation({
          type: 'support',
          participant_ids: [], // Support team would be added automatically
        });
      } else {
        throw new Error('Invalid conversation parameters');
      }

      // Add to conversations list
      setConversations(prev => [conversation, ...prev]);

      // Select the new conversation
      setSelectedConversation(conversation);
      setShowMobileChat(true);

      toast.success('Conversation created successfully!');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      throw error; // Re-throw to let modal handle loading state
    }
  };

  // Show loading state
  if (authLoading || isProcessingUserId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          {isProcessingUserId && <p className="text-gray-600">Setting up your conversation...</p>}
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access your messages.</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Page header - visible on mobile */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus.websocket
                  ? 'bg-green-500'
                  : connectionStatus.polling
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-500">
              {connectionStatus.websocket ? 'Live' : connectionStatus.polling ? 'Sync' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list - sidebar on desktop, full screen on mobile */}
        <div
          className={`
          w-full md:w-80 bg-white border-r flex-shrink-0
          ${showMobileChat ? 'hidden md:block' : 'block'}
        `}
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
            loading={loading}
          />
        </div>

        {/* Chat interface - main area */}
        <div
          className={`
          flex-1 flex flex-col
          ${showMobileChat ? 'block' : 'hidden md:flex'}
        `}
        >
          {selectedConversation ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden bg-white border-b px-4 py-3 flex items-center flex-shrink-0">
                <button
                  onClick={handleBackToList}
                  className="mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedConversation.title || 'Conversation'}
                </h2>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatInterface conversation={selectedConversation} onClose={handleBackToList} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center px-6">
                <div className="text-gray-400 mb-6">
                  <svg
                    className="w-20 h-20 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Welcome to Messages</h3>
                <p className="text-gray-600 mb-6 max-w-sm">
                  Select a conversation from the sidebar to start chatting, or create a new
                  conversation.
                </p>
                <button
                  onClick={handleCreateConversation}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Conversation Modal */}
      <CreateConversationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateConversationSubmit}
      />
    </div>
  );
};

// Main page component with Suspense boundary
const MessagesPage: React.FC = () => (
  <Suspense fallback={<MessagesLoading />}>
    <MessagesContent />
  </Suspense>
);

export default MessagesPage;
