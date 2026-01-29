/**
 * Messaging Service
 * Handles API calls for conversations and messages
 */

import { apiClient } from '@/shared/services/api';
import type { ConversationData, MessageData } from '@/shared/types/websocket';

export interface GetConversationsResponse {
  conversations: ConversationData[];
}

export interface GetConversationResponse {
  conversation: ConversationData;
}

export interface GetMessagesResponse {
  messages: MessageData[];
}

class MessagingService {
  /**
   * Get all conversations for the current user (CANDIDATE endpoint)
   */
  async getConversations(): Promise<{
    success: boolean;
    data?: ConversationData[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get<GetConversationsResponse>(
        '/api/candidate/messages/conversations'
      );
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.conversations,
        };
      }
      return {
        success: false,
        error: response.error || 'Failed to fetch conversations',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get all conversations for admin/HR users (EMPLOYER endpoint)
   */
  async getAdminConversations(): Promise<{
    success: boolean;
    data?: ConversationData[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get<ConversationData[]>(
        '/api/messages/conversations'
      );
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }
      return {
        success: false,
        error: response.error || 'Failed to fetch conversations',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get a specific conversation for admin/HR users (EMPLOYER endpoint)
   */
  async getAdminConversation(
    conversationId: string
  ): Promise<{
    success: boolean;
    data?: ConversationData;
    error?: string;
  }> {
    try {
      const response = await apiClient.get<ConversationData>(
        `/api/messages/conversations/${conversationId}`
      );
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }
      return {
        success: false,
        error: response.error || 'Failed to fetch conversation',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }


  /**
   * Get a specific conversation by ID (CANDIDATE endpoint)
   */
  async getConversation(
    conversationId: string
  ): Promise<{
    success: boolean;
    data?: ConversationData;
    error?: string;
  }> {
    try {
      const response = await apiClient.get<GetConversationResponse>(
        `/api/candidate/messages/conversations/${conversationId}`
      );
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.conversation,
        };
      }
      return {
        success: false,
        error: response.error || 'Failed to fetch conversation',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string
  ): Promise<{
    success: boolean;
    data?: MessageData[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get<GetMessagesResponse>(
        `/api/candidate/messages/conversations/${conversationId}`
      );
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.messages,
        };
      }
      return {
        success: false,
        error: response.error || 'Failed to fetch messages',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Mark a conversation as read
   */
  async markConversationRead(
    conversationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.put(
        `/api/candidate/messages/conversations/${conversationId}/read`
      );
      if (response.success) {
        return { success: true };
      }
      return { success: false, error: response.error || 'Failed to mark as read' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get conversation by job and candidate (for candidates)
   */
  async getConversationByJobAndCandidate(
    jobId: string,
    candidateId: string
  ): Promise<{
    success: boolean;
    data?: ConversationData;
    error?: string;
  }> {
    try {
      const response = await apiClient.get<GetConversationResponse>(
        `/api/conversations/job/${jobId}/candidate/${candidateId}`
      );
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.conversation,
        };
      }
      return {
        success: false,
        error: response.error || 'Failed to fetch conversation',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const messagingService = new MessagingService();












































