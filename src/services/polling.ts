import { messagingService } from './messaging';
import { RealtimeEvent, MessageEvent, ConversationUpdateEvent } from './websocket';

interface PollableResource {
  id: string;
  lastUpdated: string;
  type: 'conversation' | 'message';
}

interface PollingConfig {
  enabled: boolean;
  interval: number;
  maxRetries: number;
  backoffMultiplier: number;
}

export class PollingService {
  private config: PollingConfig = {
    enabled: false,
    interval: 5000, // 5 seconds default
    maxRetries: 3,
    backoffMultiplier: 1.5,
  };

  private timers: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private trackedConversations: Map<string, PollableResource> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  constructor() {
    this.setupGlobalListeners();
  }

  private setupGlobalListeners() {
    // Initialize listener sets
    this.listeners.set('new_message', new Set());
    this.listeners.set('conversation_update', new Set());
  }

  configure(config: Partial<PollingConfig>) {
    this.config = { ...this.config, ...config };
  }

  start() {
    if (this.config.enabled) {
      console.log('Polling service already enabled');
      return;
    }

    console.log('Starting polling service');
    this.config.enabled = true;
    this.startConversationListPolling();
  }

  stop() {
    console.log('Stopping polling service');
    this.config.enabled = false;
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear tracked resources
    this.trackedConversations.clear();
    this.retryAttempts.clear();
  }

  // Track a conversation for polling
  trackConversation(conversationId: string) {
    if (!this.config.enabled) {
      return;
    }

    const resource: PollableResource = {
      id: conversationId,
      lastUpdated: new Date().toISOString(),
      type: 'conversation',
    };

    this.trackedConversations.set(conversationId, resource);
    this.startConversationPolling(conversationId);
  }

  untrackConversation(conversationId: string) {
    this.trackedConversations.delete(conversationId);
    
    const timer = this.timers.get(`conversation_${conversationId}`);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(`conversation_${conversationId}`);
    }

    this.retryAttempts.delete(`conversation_${conversationId}`);
  }

  private startConversationListPolling() {
    if (!this.config.enabled) {
      return;
    }

    const pollConversationList = async () => {
      try {
        const response = await messagingService.getUserConversations(1, 50);
        // const currentTime = new Date().toISOString(); // Removed unused variable

        // Check for conversation updates
        response.conversations.forEach(conversation => {
          const tracked = this.trackedConversations.get(conversation.id);
          
          if (!tracked || conversation.updated_at > tracked.lastUpdated) {
            // Conversation was updated
            const event: ConversationUpdateEvent = {
              type: 'conversation_update',
              conversation: conversation,
              conversation_id: conversation.id,
            };

            this.notifyListeners('conversation_update', event);

            // Update tracking
            this.trackedConversations.set(conversation.id, {
              id: conversation.id,
              lastUpdated: conversation.updated_at,
              type: 'conversation',
            });
          }
        });

        // Reset retry attempts on success
        this.retryAttempts.delete('conversation_list');

        // Schedule next poll
        if (this.config.enabled) {
          const timer = setTimeout(pollConversationList, this.config.interval);
          this.timers.set('conversation_list', timer);
        }

      } catch (error) {
        console.error('Error polling conversation list:', error);
        this.handleRetry('conversation_list', pollConversationList);
      }
    };

    // Start initial poll
    setTimeout(pollConversationList, 1000);
  }

  private startConversationPolling(conversationId: string) {
    if (!this.config.enabled) {
      return;
    }

    const timerId = `conversation_${conversationId}`;
    
    // Clear existing timer
    const existingTimer = this.timers.get(timerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const pollConversationMessages = async () => {
      try {
        const response = await messagingService.getConversationHistory(conversationId, 1, 20);
        const tracked = this.trackedConversations.get(conversationId);

        if (tracked) {
          // Check for new messages
          const newMessages = response.messages.filter(
            message => message.created_at > tracked.lastUpdated
          );

          // Emit events for new messages
          newMessages.forEach(message => {
            const event: MessageEvent = {
              type: 'new_message',
              message: message,
              conversation_id: conversationId,
            };

            this.notifyListeners('new_message', event);
          });

          // Update last updated timestamp
          if (newMessages.length > 0) {
            tracked.lastUpdated = newMessages[0].created_at;
          }

          // Check for conversation updates
          if (response.conversation.updated_at > tracked.lastUpdated) {
            const event: ConversationUpdateEvent = {
              type: 'conversation_update',
              conversation: response.conversation,
              conversation_id: conversationId,
            };

            this.notifyListeners('conversation_update', event);
            tracked.lastUpdated = response.conversation.updated_at;
          }
        }

        // Reset retry attempts on success
        this.retryAttempts.delete(timerId);

        // Schedule next poll
        if (this.config.enabled && this.trackedConversations.has(conversationId)) {
          const timer = setTimeout(pollConversationMessages, this.config.interval);
          this.timers.set(timerId, timer);
        }

      } catch (error) {
        console.error(`Error polling conversation ${conversationId}:`, error);
        this.handleRetry(timerId, pollConversationMessages);
      }
    };

    // Start initial poll after a short delay
    setTimeout(pollConversationMessages, 2000);
  }

  private handleRetry(timerId: string, retryFunction: () => Promise<void>) {
    const currentAttempts = this.retryAttempts.get(timerId) || 0;

    if (currentAttempts >= this.config.maxRetries) {
      console.error(`Max retry attempts reached for ${timerId}`);
      this.retryAttempts.delete(timerId);
      return;
    }

    const nextAttempt = currentAttempts + 1;
    this.retryAttempts.set(timerId, nextAttempt);

    const delay = this.config.interval * Math.pow(this.config.backoffMultiplier, nextAttempt);
    
    console.log(`Retrying ${timerId} in ${delay}ms (attempt ${nextAttempt}/${this.config.maxRetries})`);

    const timer = setTimeout(() => {
      if (this.config.enabled) {
        retryFunction();
      }
    }, delay);

    this.timers.set(timerId, timer);
  }

  private notifyListeners(eventType: string, event: RealtimeEvent) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in polling event listener:', error);
        }
      });
    }
  }

  // Event subscription methods
  onNewMessage(callback: (event: MessageEvent) => void): () => void {
    return this.addEventListener('new_message', callback as (event: RealtimeEvent) => void);
  }

  onConversationUpdate(callback: (event: ConversationUpdateEvent) => void): () => void {
    return this.addEventListener('conversation_update', callback as (event: RealtimeEvent) => void);
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

  // Getters
  isEnabled(): boolean {
    return this.config.enabled;
  }

  getTrackedConversations(): string[] {
    return Array.from(this.trackedConversations.keys());
  }

  getConfig(): PollingConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const pollingService = new PollingService();
export default pollingService;