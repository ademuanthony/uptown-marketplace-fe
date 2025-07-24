import { Message, Conversation } from './messaging';
import { auth } from '@/lib/firebase';

export interface WebSocketMessage {
  type: 'message' | 'conversation_update' | 'user_online' | 'user_offline' | 'typing' | 'message_read';
  data: any;
  timestamp: string;
}

export interface MessageEvent {
  type: 'new_message';
  message: Message;
  conversation_id: string;
}

export interface ConversationUpdateEvent {
  type: 'conversation_update';
  conversation: Partial<Conversation>;
  conversation_id: string;
}

export interface UserStatusEvent {
  type: 'user_online' | 'user_offline';
  user_id: string;
  last_seen?: string;
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop';
  user_id: string;
  conversation_id: string;
}

export interface MessageReadEvent {
  type: 'message_read';
  message_id: string;
  user_id: string;
  conversation_id: string;
  read_at: string;
}

export type RealtimeEvent = MessageEvent | ConversationUpdateEvent | UserStatusEvent | TypingEvent | MessageReadEvent;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private isConnected = false;
  private userId: string | null = null;
  
  // Queue for pending actions while disconnected
  private pendingActions: Array<() => void> = [];
  private joinedConversations: Set<string> = new Set();

  constructor() {
    this.setupGlobalListeners();
  }

  private setupGlobalListeners() {
    // Listen for new message events
    this.listeners.set('new_message', new Set());
    this.listeners.set('conversation_update', new Set());
    this.listeners.set('user_online', new Set());
    this.listeners.set('user_offline', new Set());
    this.listeners.set('typing_start', new Set());
    this.listeners.set('typing_stop', new Set());
    this.listeners.set('message_read', new Set());
  }

  async connect(userId: string) {
    this.userId = userId;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No current user found');
      return;
    }
    const token = await currentUser.getIdToken();
    if (!token) {
      console.error('No token found');
      return;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    if (!wsUrl) {
      console.warn('WebSocket URL not configured, skipping WebSocket connection');
      return;
    }

    try {
      this.ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}&user_id=${encodeURIComponent(userId)}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.notifyConnectionListeners(true);
        
        // Process pending actions
        this.processPendingActions();
      };

      this.ws.onmessage = (event) => {
        try {
          const wsMessage: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(wsMessage);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();
        this.notifyConnectionListeners(false);

        if (event.code !== 1000) { // Not a normal closure
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.notifyConnectionListeners(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private getWebSocketUrl(): string | null {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return null;
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = baseUrl.replace(/^https?:/, baseUrl.startsWith('https') ? 'wss:' : 'ws:');
    // Remove /api/v1 from the WebSocket URL as the endpoint is registered at /ws
    const wsBaseUrl = wsUrl.replace('/api/v1', '');
    return `${wsBaseUrl}/ws`;
  }

  private handleMessage(wsMessage: WebSocketMessage) {
    const { type, data } = wsMessage;
    console.log('Received WebSocket message:', wsMessage);

    let event: RealtimeEvent;

    switch (type) {
      case 'message':
        event = {
          type: 'new_message',
          message: data.message,
          conversation_id: data.conversation_id,
        };
        break;

      case 'conversation_update':
        event = {
          type: 'conversation_update',
          conversation: data.conversation,
          conversation_id: data.conversation_id,
        };
        break;

      case 'user_online':
        event = {
          type: 'user_online',
          user_id: data.user_id,
          last_seen: data.last_seen,
        };
        break;

      case 'user_offline':
        event = {
          type: 'user_offline',
          user_id: data.user_id,
          last_seen: data.last_seen,
        };
        break;

      case 'typing':
        event = {
          type: data.is_typing ? 'typing_start' : 'typing_stop',
          user_id: data.user_id,
          conversation_id: data.conversation_id,
        };
        break;

      case 'message_read':
        event = {
          type: 'message_read',
          message_id: data.message_id,
          user_id: data.user_id,
          conversation_id: data.conversation_id,
          read_at: data.read_at,
        };
        break;
        
      case 'pong':
        // Handle pong response from server
        console.log('🏓 Received pong from server');
        return;

      default:
        console.warn('Unknown WebSocket message type:', type);
        return;
    }

    this.notifyListeners(event.type, event);
  }

  private notifyListeners(eventType: string, event: RealtimeEvent) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.userId = null;
    
    // Clear pending actions and joined conversations on explicit disconnect
    this.pendingActions = [];
    this.joinedConversations.clear();
    
    this.notifyConnectionListeners(false);
  }

  // Event subscription methods
  onNewMessage(callback: (event: MessageEvent) => void): () => void {
    return this.addEventListener('new_message', callback as any);
  }

  onConversationUpdate(callback: (event: ConversationUpdateEvent) => void): () => void {
    return this.addEventListener('conversation_update', callback as any);
  }

  onUserStatusChange(callback: (event: UserStatusEvent) => void): () => void {
    const unsubscribeOnline = this.addEventListener('user_online', callback as any);
    const unsubscribeOffline = this.addEventListener('user_offline', callback as any);
    
    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }

  onTyping(callback: (event: TypingEvent) => void): () => void {
    const unsubscribeStart = this.addEventListener('typing_start', callback as any);
    const unsubscribeStop = this.addEventListener('typing_stop', callback as any);
    
    return () => {
      unsubscribeStart();
      unsubscribeStop();
    };
  }

  onMessageRead(callback: (event: MessageReadEvent) => void): () => void {
    return this.addEventListener('message_read', callback as any);
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private addEventListener(eventType: string, callback: (event: RealtimeEvent) => void): () => void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.add(callback);
      
      return () => {
        listeners.delete(callback);
      };
    }
    
    return () => {};
  }

  // Send methods
  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        data: {
          conversation_id: conversationId,
          is_typing: isTyping,
        }
      }));
    }
  }

  joinConversation(conversationId: string) {
    console.log('🔗 Attempting to join conversation:', conversationId);
    
    // Add to joined conversations set
    this.joinedConversations.add(conversationId);
    
    const joinAction = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('📤 Sending join_conversation message for:', conversationId);
        this.ws.send(JSON.stringify({
          type: 'join_conversation',
          data: {
            conversation_id: conversationId,
          }
        }));
      }
    };

    if (this.isConnected) {
      joinAction();
    } else {
      console.log('⏳ WebSocket not connected, queuing join request for:', conversationId);
      this.pendingActions.push(joinAction);
    }
  }

  leaveConversation(conversationId: string) {
    console.log('👋 Leaving conversation:', conversationId);
    
    // Remove from joined conversations set
    this.joinedConversations.delete(conversationId);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'leave_conversation',
        data: {
          conversation_id: conversationId,
        }
      }));
    }
  }
  
  private processPendingActions() {
    console.log('🔄 Processing pending actions:', this.pendingActions.length);
    
    // Execute all pending actions
    const actions = [...this.pendingActions];
    this.pendingActions = [];
    
    actions.forEach(action => {
      try {
        action();
      } catch (error) {
        console.error('Error executing pending action:', error);
      }
    });
    
    console.log('✅ Pending actions processed');
  }

  // Getters
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  isWebSocketSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;