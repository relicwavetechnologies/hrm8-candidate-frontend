/**
 * WebSocket Type Definitions
 * Matches backend WebSocket message types and structures
 */

export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export type WSMessageType =
  | 'authenticate'
  | 'join_conversation'
  | 'authentication_success'
  | 'send_message'
  | 'user_online'
  | 'user_offline'
  | 'connection_established'
  | 'messages_loaded'
  | 'new_message'
  | 'message_sent'
  | 'user_joined'
  | 'user_left'
  | 'online_users_list'
  | 'notification'
  | 'notifications_count'
  | 'error';

export type MessageSenderType = 'CANDIDATE' | 'EMPLOYER' | 'CONSULTANT' | 'SYSTEM';
export type MessageContentType = 'TEXT' | 'FILE' | 'SYSTEM';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
}

export interface OnlineUser {
  userEmail: string;
  userName: string;
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderEmail: string;
  senderType: MessageSenderType;
  senderId?: string;
  content: string;
  contentType: MessageContentType;
  readBy?: string[];
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  isOwn?: boolean;
}

export interface ConversationParticipant {
  participantType: 'CANDIDATE' | 'EMPLOYER' | 'CONSULTANT' | 'SYSTEM';
  participantId: string;
  participantEmail: string;
  displayName?: string | null;
}

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'CLOSED';

export interface ConversationData {
  id: string;
  jobId?: string | null;
  candidateId?: string | null;
  participants: ConversationParticipant[];
  status: ConversationStatus;
  lastMessageId?: string;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
  };
  candidate?: {
    id: string;
    displayName: string;
    photo?: string;
  };
  lastMessage?: MessageData;
}

export interface AuthenticationSuccessPayload {
  userEmail: string;
  userName: string;
  userType: 'USER' | 'CANDIDATE';
  message: string;
}

export interface MessagesLoadedPayload {
  conversationId: string;
  messages: MessageData[];
}

export interface NewMessagePayload extends MessageData {
  isOwn: boolean;
}

export interface JoinConversationPayload {
  conversationId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
}

export interface ErrorPayload {
  message: string;
  code: number;
}

export interface WebSocketContextType {
  connectionState: ConnectionState;
  isConnected: boolean;
  sendMessage: (type: WSMessageType, payload: unknown) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: () => void;
  currentConversationId: string | null;
  onlineUsers: OnlineUser[];
  messages: Record<string, MessageData[]>;
  conversations: ConversationData[];
  setConversations: (conversations: ConversationData[]) => void;
  addMessage: (conversationId: string, message: MessageData) => void;
  onMessage?: (type: string, handler: (payload: unknown) => void) => () => void;
}

