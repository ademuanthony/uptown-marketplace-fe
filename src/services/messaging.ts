import api from './api';
import { isAxiosError } from 'axios';

// Message types
export type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'audio'
  | 'video'
  | 'offer'
  | 'order'
  | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'sending';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

// Conversation types
export type ConversationType = 'direct' | 'group' | 'support' | 'order';
export type ConversationStatus = 'active' | 'archived' | 'blocked' | 'muted';

// Message interface
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id?: string; // Optional for group conversations
  type: MessageType;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_size?: number;
  status: MessageStatus;
  priority: MessagePriority;
  reply_to_id?: string;
  forwarded_from_id?: string;
  edited_at?: string;
  delivered_at?: string;
  read_at?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Conversation interface
export interface Conversation {
  id: string;
  type: ConversationType;
  subject?: string;
  title?: string;
  description?: string;
  creator_id: string;
  status: ConversationStatus;
  product_id?: string;
  order_id?: string;
  participant_ids: string[];
  last_message_id?: string;
  last_message_at?: string;
  message_count: number;
  unread_count: Record<string, number>;
  muted_by: string[];
  blocked_by: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: number;
  };
  message?: string;
}

// Request/Response types
export interface SendMessageRequest {
  type: MessageType;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_size?: number;
  reply_to_id?: string;
  forwarded_from_id?: string;
  priority?: MessagePriority;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResponse {
  message: Message;
}

export interface CreateConversationRequest {
  type: ConversationType;
  subject?: string;
  title?: string;
  description?: string;
  participant_ids: string[];
  product_id?: string;
  order_id?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface ConversationHistoryResponse {
  messages: Message[];
  conversation: Conversation;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface UserConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Messaging Service Class
export class MessagingService {
  // Send a text message
  async sendMessage(conversationId: string, request: SendMessageRequest): Promise<Message> {
    try {
      const response = await api.post<ApiResponse<SendMessageResponse>>(
        `/conversations/${conversationId}/messages`,
        request,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.message;
      } else {
        throw new Error(response.data.error?.message || 'Failed to send message');
      }
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to send message');
      }
      throw new Error('Failed to send message');
    }
  }

  // Send a file message
  async sendFileMessage(conversationId: string, file: File, content?: string): Promise<Message> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (content) {
        formData.append('content', content);
      }

      const response = await api.post<ApiResponse<SendMessageResponse>>(
        `/conversations/${conversationId}/messages/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data.message;
      } else {
        throw new Error(response.data.error?.message || 'Failed to send file message');
      }
    } catch (error: unknown) {
      console.error('Error sending file message:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to send file message');
      }
      throw new Error('Failed to send file message');
    }
  }

  // Get conversation history
  async getConversationHistory(
    conversationId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ConversationHistoryResponse> {
    try {
      const response = await api.get<ApiResponse<ConversationHistoryResponse>>(
        `/conversations/${conversationId}/messages`,
        {
          params: { page, page_size: pageSize },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get conversation history');
      }
    } catch (error: unknown) {
      console.error('Error getting conversation history:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error?.message || 'Failed to get conversation history',
        );
      }
      throw new Error('Failed to get conversation history');
    }
  }

  // Create a new conversation
  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    try {
      const response = await api.post<ApiResponse<CreateConversationResponse>>(
        '/conversations',
        request,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.conversation;
      } else {
        throw new Error(response.data.error?.message || 'Failed to create conversation');
      }
    } catch (error: unknown) {
      console.error('Error creating conversation:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to create conversation');
      }
      throw new Error('Failed to create conversation');
    }
  }

  // Get user conversations
  async getUserConversations(
    page: number = 1,
    pageSize: number = 20,
    status?: ConversationStatus,
    type?: ConversationType,
  ): Promise<UserConversationsResponse> {
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (status) params.status = status;
      if (type) params.type = type;

      const response = await api.get<ApiResponse<UserConversationsResponse>>(
        '/users/conversations',
        { params },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to get conversations');
      }
    } catch (error: unknown) {
      console.error('Error getting conversations:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to get conversations');
      }
      throw new Error('Failed to get conversations');
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<Message> {
    try {
      const response = await api.post<ApiResponse<{ message: Message }>>(
        `/messages/${messageId}/read`,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.message;
      } else {
        throw new Error(response.data.error?.message || 'Failed to mark message as read');
      }
    } catch (error: unknown) {
      console.error('Error marking message as read:', error);
      if (isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to mark message as read');
      }
      throw new Error('Failed to mark message as read');
    }
  }

  // Create a direct conversation with another user
  async createDirectConversation(participantId: string, productId?: string): Promise<Conversation> {
    const request: CreateConversationRequest = {
      type: 'direct',
      participant_ids: [participantId],
      product_id: productId,
    };

    return this.createConversation(request);
  }

  // Create a group conversation
  async createGroupConversation(
    title: string,
    participantIds: string[],
    description?: string,
  ): Promise<Conversation> {
    const request: CreateConversationRequest = {
      type: 'group',
      title,
      description,
      participant_ids: participantIds,
    };

    return this.createConversation(request);
  }

  // Create an order-related conversation
  async createOrderConversation(participantId: string, orderId: string): Promise<Conversation> {
    const request: CreateConversationRequest = {
      type: 'order',
      participant_ids: [participantId],
      order_id: orderId,
    };

    return this.createConversation(request);
  }

  // Get or create a direct conversation with another user (uses dedicated backend endpoint)
  async getOrCreateDirectConversation(
    participantId: string,
    productId?: string,
  ): Promise<Conversation> {
    try {
      const requestBody: Record<string, unknown> = {};
      if (productId) {
        requestBody.product_id = productId;
      }

      const response = await api.post<ApiResponse<CreateConversationResponse>>(
        `/conversations/direct/${participantId}`,
        requestBody,
      );

      if (response.data.success && response.data.data) {
        return response.data.data.conversation;
      } else {
        throw new Error(
          response.data.error?.message || 'Failed to get or create direct conversation',
        );
      }
    } catch (error: unknown) {
      console.error('Error getting or creating direct conversation:', error);
      if (isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error?.message || 'Failed to get or create direct conversation',
        );
      }
      throw new Error('Failed to get or create direct conversation');
    }
  }

  // Get total count of conversations with unread messages
  async getUnreadConversationsCount(): Promise<number> {
    try {
      const response = await this.getUserConversations(1, 100); // Get more conversations to ensure accurate count

      if (!response.conversations) {
        return 0;
      }

      // Count conversations where current user has unread messages
      const unreadCount = response.conversations.reduce((count, conversation) => {
        // The unread_count should only contain counts for the current user
        // Backend should filter this appropriately when returning conversations
        const hasUnreadMessages = Object.values(conversation.unread_count).some(count => count > 0);
        return hasUnreadMessages ? count + 1 : count;
      }, 0);

      return unreadCount;
    } catch (error: unknown) {
      console.error('Error getting unread conversations count:', error);
      return 0; // Return 0 on error to prevent UI issues
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
export default messagingService;
