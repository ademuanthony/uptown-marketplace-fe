'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { webSocketService, MessageEvent, ConversationUpdateEvent, TypingEvent, UserStatusEvent, MessageReadEvent } from '@/services/websocket';
import { pollingService } from '@/services/polling';

interface ConnectionStatus {
  websocket: boolean;
  polling: boolean;
}

interface TypingStatus {
  [conversationId: string]: {
    [userId: string]: {
      isTyping: boolean;
      timestamp: number;
    };
  };
}

interface UserOnlineStatus {
  [userId: string]: {
    isOnline: boolean;
    lastSeen?: string;
  };
}

interface UseRealTimeMessagingOptions {
  enableWebSocket?: boolean;
  enablePolling?: boolean;
  pollingInterval?: number;
  fallbackToPolling?: boolean;
}

interface UseRealTimeMessagingReturn {
  // Connection status
  connectionStatus: ConnectionStatus;
  isConnected: boolean;

  // Event handlers
  onNewMessage: (callback: (event: MessageEvent) => void) => () => void;
  onConversationUpdate: (callback: (event: ConversationUpdateEvent) => void) => () => void;
  onTyping: (callback: (event: TypingEvent) => void) => () => void;
  onUserStatusChange: (callback: (event: UserStatusEvent) => void) => () => void;
  onMessageRead: (callback: (event: MessageReadEvent) => void) => () => void;

  // Actions
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTracking: (conversationIds: string[]) => void;
  stopTracking: () => void;

  // Status
  typingStatus: TypingStatus;
  userOnlineStatus: UserOnlineStatus;

  // Control methods
  reconnect: () => void;
  disconnect: () => void;
}

export function useRealTimeMessaging(options: UseRealTimeMessagingOptions = {}): UseRealTimeMessagingReturn {
  const {
    enableWebSocket = true,
    enablePolling = false,
    pollingInterval = 5000,
    fallbackToPolling = false,
  } = options;

  const { user, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    websocket: false,
    polling: false,
  });
  const [typingStatus, setTypingStatus] = useState<TypingStatus>({});
  const [userOnlineStatus, setUserOnlineStatus] = useState<UserOnlineStatus>({});
  
  const initialized = useRef(false);
  const wsConnectionTimeout = useRef<NodeJS.Timeout | null>(null);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Initialize services when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !initialized.current) {
      initializeServices();
      initialized.current = true;
    } else if (!isAuthenticated && initialized.current) {
      cleanup();
      initialized.current = false;
    }
  }, [isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const initializeServices = useCallback(() => {
    if (!user) return;

    // Setup WebSocket connection status listener
    const unsubscribeWsConnection = webSocketService.onConnectionChange((connected) => {
      setConnectionStatus(prev => ({ ...prev, websocket: connected }));

      if (!connected && fallbackToPolling && enablePolling) {
        console.log('WebSocket disconnected, falling back to polling');
        startPolling();
      } else if (connected && pollingService.isEnabled()) {
        console.log('WebSocket connected, stopping polling fallback');
        pollingService.stop();
        setConnectionStatus(prev => ({ ...prev, polling: false }));
      }
    });

    // Try WebSocket first if enabled
    if (enableWebSocket) {
      webSocketService.connect(user.id);
      
      // Set a timeout for WebSocket connection
      wsConnectionTimeout.current = setTimeout(() => {
        if (!webSocketService.getConnectionStatus() && fallbackToPolling && enablePolling) {
          console.log('WebSocket connection timeout, falling back to polling');
          startPolling();
        }
      }, 5000);
    } else if (enablePolling) {
      // Start polling immediately if WebSocket is disabled
      startPolling();
    }

    return () => {
      unsubscribeWsConnection();
      if (wsConnectionTimeout.current) {
        clearTimeout(wsConnectionTimeout.current);
      }
    };
  }, [user, enableWebSocket, enablePolling, fallbackToPolling]);

  const startPolling = useCallback(() => {
    if (pollingService.isEnabled()) {
      return;
    }

    pollingService.configure({
      enabled: true,
      interval: pollingInterval,
    });
    
    pollingService.start();
    setConnectionStatus(prev => ({ ...prev, polling: true }));
  }, [pollingInterval]);

  const cleanup = useCallback(() => {
    webSocketService.disconnect();
    pollingService.stop();
    setConnectionStatus({ websocket: false, polling: false });
    setTypingStatus({});
    setUserOnlineStatus({});
    
    // Clear typing timeouts
    typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
    typingTimeouts.current.clear();

    if (wsConnectionTimeout.current) {
      clearTimeout(wsConnectionTimeout.current);
      wsConnectionTimeout.current = null;
    }
  }, []);

  // Event handlers
  const onNewMessage = useCallback((callback: (event: MessageEvent) => void) => {
    const unsubscribeWs = webSocketService.onNewMessage(callback);
    const unsubscribePolling = pollingService.onNewMessage(callback);
    
    return () => {
      unsubscribeWs();
      unsubscribePolling();
    };
  }, []);

  const onConversationUpdate = useCallback((callback: (event: ConversationUpdateEvent) => void) => {
    const unsubscribeWs = webSocketService.onConversationUpdate(callback);
    const unsubscribePolling = pollingService.onConversationUpdate(callback);
    
    return () => {
      unsubscribeWs();
      unsubscribePolling();
    };
  }, []);

  const onTyping = useCallback((callback: (event: TypingEvent) => void) => {
    const wrappedCallback = (event: TypingEvent) => {
      // Update typing status
      setTypingStatus(prev => {
        const conversationTyping = prev[event.conversation_id] || {};
        const newConversationTyping = { ...conversationTyping };

        if (event.type === 'typing_start') {
          newConversationTyping[event.user_id] = {
            isTyping: true,
            timestamp: Date.now(),
          };

          // Auto-clear typing after 10 seconds
          const key = `${event.conversation_id}-${event.user_id}`;
          const existingTimeout = typingTimeouts.current.get(key);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeout = setTimeout(() => {
            setTypingStatus(currentStatus => {
              const currentConversationTyping = currentStatus[event.conversation_id] || {};
              const updatedConversationTyping = { ...currentConversationTyping };
              delete updatedConversationTyping[event.user_id];

              return {
                ...currentStatus,
                [event.conversation_id]: updatedConversationTyping,
              };
            });
            typingTimeouts.current.delete(key);
          }, 10000);

          typingTimeouts.current.set(key, timeout);
        } else {
          delete newConversationTyping[event.user_id];
          
          // Clear timeout
          const key = `${event.conversation_id}-${event.user_id}`;
          const existingTimeout = typingTimeouts.current.get(key);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingTimeouts.current.delete(key);
          }
        }

        return {
          ...prev,
          [event.conversation_id]: newConversationTyping,
        };
      });

      callback(event);
    };

    return webSocketService.onTyping(wrappedCallback);
  }, []);

  const onUserStatusChange = useCallback((callback: (event: UserStatusEvent) => void) => {
    const wrappedCallback = (event: UserStatusEvent) => {
      // Update user online status
      setUserOnlineStatus(prev => ({
        ...prev,
        [event.user_id]: {
          isOnline: event.type === 'user_online',
          lastSeen: event.last_seen,
        },
      }));

      callback(event);
    };

    return webSocketService.onUserStatusChange(wrappedCallback);
  }, []);

  const onMessageRead = useCallback((callback: (event: MessageReadEvent) => void) => {
    return webSocketService.onMessageRead(callback);
  }, []);

  // Actions
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    webSocketService.sendTyping(conversationId, isTyping);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    webSocketService.joinConversation(conversationId);
    pollingService.trackConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    webSocketService.leaveConversation(conversationId);
    pollingService.untrackConversation(conversationId);
  }, []);

  const startTracking = useCallback((conversationIds: string[]) => {
    conversationIds.forEach(id => {
      joinConversation(id);
    });
  }, [joinConversation]);

  const stopTracking = useCallback(() => {
    const trackedConversations = pollingService.getTrackedConversations();
    trackedConversations.forEach(id => {
      leaveConversation(id);
    });
  }, [leaveConversation]);

  const reconnect = useCallback(() => {
    if (user) {
      if (enableWebSocket) {
        webSocketService.connect(user.id);
      }
    }
  }, [user, enableWebSocket]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const isConnected = connectionStatus.websocket || connectionStatus.polling;

  return {
    connectionStatus,
    isConnected,
    onNewMessage,
    onConversationUpdate,
    onTyping,
    onUserStatusChange,
    onMessageRead,
    sendTyping,
    joinConversation,
    leaveConversation,
    startTracking,
    stopTracking,
    typingStatus,
    userOnlineStatus,
    reconnect,
    disconnect,
  };
}