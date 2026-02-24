/**
 * Messaging Service
 * Handles API calls for conversations and messages
 */

import { apiClient } from '@/shared/services/api';
import type { ConversationData, MessageData } from '@/shared/types/websocket';

export interface GetConversationsResponse {
  conversations: any[];
}

export interface GetConversationResponse {
  conversation: any;
  messages?: any[];
}

export interface GetMessagesResponse {
  messages: any[];
}

class MessagingService {
  private normalizeMessage(raw: any): MessageData {
    return {
      id: raw.id,
      conversationId: raw.conversationId ?? raw.conversation_id ?? '',
      senderEmail: raw.senderEmail ?? raw.sender_email ?? '',
      senderType: raw.senderType ?? raw.sender_type ?? 'SYSTEM',
      senderId: raw.senderId ?? raw.sender_id,
      content: raw.content ?? '',
      contentType: raw.contentType ?? raw.content_type ?? 'TEXT',
      readBy: raw.readBy ?? raw.read_by ?? [],
      deliveredAt: raw.deliveredAt ?? raw.delivered_at,
      readAt: raw.readAt ?? raw.read_at,
      createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      updatedAt: raw.updatedAt ?? raw.updated_at ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      isOwn: raw.isOwn,
    };
  }

  private normalizeConversation(raw: any): ConversationData {
    const participants = Array.isArray(raw.participants) ? raw.participants : [];
    const normalizedParticipants = participants.map((p: any) => ({
      participantType: p.participantType ?? p.participant_type ?? 'SYSTEM',
      participantId: p.participantId ?? p.participant_id ?? '',
      participantEmail: p.participantEmail ?? p.participant_email ?? '',
      displayName: p.displayName ?? p.display_name ?? null,
    }));

    const rawLastMessage =
      raw.lastMessage ??
      raw.last_message ??
      (Array.isArray(raw.messages) && raw.messages.length > 0 ? raw.messages[0] : null);

    const candidateDisplayName =
      raw.candidate?.displayName ||
      [raw.candidate?.firstName ?? raw.candidate?.first_name, raw.candidate?.lastName ?? raw.candidate?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      undefined;

    return {
      id: raw.id,
      jobId: raw.jobId ?? raw.job_id ?? null,
      candidateId: raw.candidateId ?? raw.candidate_id ?? null,
      participants: normalizedParticipants,
      status: raw.status ?? 'ACTIVE',
      lastMessageId: raw.lastMessageId ?? raw.last_message_id,
      createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
      job: raw.job
        ? {
            id: raw.job.id,
            title: raw.job.title,
          }
        : undefined,
      candidate: raw.candidate
        ? {
            id: raw.candidate.id,
            displayName: candidateDisplayName || raw.candidate.email || 'Candidate',
            photo: raw.candidate.photo,
          }
        : undefined,
      lastMessage: rawLastMessage ? this.normalizeMessage(rawLastMessage) : undefined,
    };
  }

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
          data: (response.data.conversations || []).map((conversation) =>
            this.normalizeConversation(conversation)
          ),
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
    data?: { conversation: ConversationData; messages: MessageData[] };
    error?: string;
  }> {
    try {
      const response = await apiClient.get<GetConversationResponse>(
        `/api/candidate/messages/conversations/${conversationId}`
      );
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            conversation: this.normalizeConversation(response.data.conversation),
            messages: (response.data.messages || []).map((message) =>
              this.normalizeMessage(message)
            ),
          },
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
          data: (response.data.messages || []).map((message) =>
            this.normalizeMessage(message)
          ),
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
   * Send a message via HTTP fallback (used when WebSocket is disconnected)
   */
  async sendMessage(
    conversationId: string,
    content: string,
    contentType: 'TEXT' | 'FILE' | 'SYSTEM' = 'TEXT',
    attachments?: any
  ): Promise<{ success: boolean; data?: MessageData; error?: string }> {
    try {
      const response = await apiClient.post<{ message: any }>(
        '/api/candidate/messages/send',
        { conversationId, content, contentType, attachments }
      );
      if (response.success && response.data?.message) {
        return {
          success: true,
          data: this.normalizeMessage(response.data.message),
        };
      }
      return {
        success: false,
        error: response.error || 'Failed to send message',
      };
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











































