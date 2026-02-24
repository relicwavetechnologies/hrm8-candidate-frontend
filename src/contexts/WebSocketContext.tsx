/**
 * WebSocket Context
 * Manages WebSocket connection with exponential backoff reconnection
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { toast } from '@/shared/hooks/use-toast';
import type {
  ConnectionState,
  WSMessage,
  WSMessageType,
  MessageData,
  ConversationData,
  OnlineUser,
  WebSocketContextType,
} from '@/shared/types/websocket';

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
  userEmail?: string;
}

// Build one WS URL from an HTTP(S) origin/base
const buildWebSocketUrl = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);
    url.protocol = url.protocol.replace('http', 'ws');
    url.pathname = '/ws';
    return url.toString();
  } catch {
    return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
  }
};

// Build WS URL candidates in order:
// 1) API host (from env), 2) current app host.
const getWebSocketUrls = (): string[] => {
  const candidates = [
    import.meta.env.VITE_API_URL,
    window.location.origin,
  ].filter(Boolean) as string[];

  const urls = candidates.map(buildWebSocketUrl);
  return Array.from(new Set(urls));
};

// Exponential backoff configuration
const RECONNECT_CONFIG = {
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  multiplier: 2,
  jitter: 0.1, // 10% jitter
};

export function WebSocketProvider({
  children,
  isAuthenticated,
  // userEmail,
}: WebSocketProviderProps) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageData[]>>({});
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const authFailureNotifiedRef = useRef(false);

  const currentConversationIdRef = useRef<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const wsUrlsRef = useRef<string[]>(getWebSocketUrls());
  const wsUrlIndexRef = useRef(0);
  const messageHandlersRef = useRef<
    Map<string, (payload: any) => void>
  >(new Map());

  // Sync ref with state
  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  const isConnected = connectionState === 'connected';

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt: number): number => {
    const baseDelay = Math.min(
      RECONNECT_CONFIG.initialDelay *
      Math.pow(RECONNECT_CONFIG.multiplier, attempt),
      RECONNECT_CONFIG.maxDelay
    );
    const jitterAmount = baseDelay * RECONNECT_CONFIG.jitter;
    const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
    return baseDelay + jitter;
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSMessage = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', message.type, message.payload);

      // Call registered handlers
      const handler = messageHandlersRef.current.get(message.type);
      if (handler) {
        handler(message.payload);
      }

      // Handle specific message types
      switch (message.type) {
        case 'connection_established':
          console.log('✅ WebSocket connection established');
          break;

        case 'authentication_success':
          console.log('✅ WebSocket authentication successful');
          setConnectionState('connected');
          reconnectAttemptRef.current = 0; // Reset reconnect attempts
          break;

        case 'online_users_list':
          setOnlineUsers((message.payload as any).users || []);
          break;

        case 'user_online':
          setOnlineUsers((prev: OnlineUser[]) => {
            const payload = message.payload as any;
            const exists = prev.find(
              (u: OnlineUser) => u.userEmail === payload.userEmail
            );
            if (exists) return prev;
            return [
              ...prev,
              {
                userEmail: payload.userEmail,
                userName: payload.userName,
              },
            ];
          });
          break;

        case 'user_offline':
          setOnlineUsers((prev: OnlineUser[]) =>
            prev.filter(
              (u: OnlineUser) => u.userEmail !== (message.payload as any).userEmail
            )
          );
          break;

        case 'messages_loaded':
          const { conversationId, messages: loadedMessages } = message.payload as any;
          setMessages((prev: Record<string, MessageData[]>) => ({
            ...prev,
            [conversationId]: loadedMessages,
          }));
          break;

        case 'new_message':
        case 'message_sent':
          const newMessage = message.payload as MessageData;
          setMessages((prev: Record<string, MessageData[]>) => {
            const conversationMessages = prev[newMessage.conversationId] || [];
            // Check if message already exists
            const exists = conversationMessages.some((m: MessageData) => m.id === newMessage.id);

            console.log('🔄 Processing new_message/message_sent:', {
              id: newMessage.id,
              content: newMessage.content,
              conversationId: newMessage.conversationId,
              exists,
              currentCount: conversationMessages.length
            });

            if (exists) {
              console.log('⚠️ Message already exists, skipping update');
              return prev;
            }

            console.log('✅ Adding new message to state');
            return {
              ...prev,
              [newMessage.conversationId]: [...conversationMessages, newMessage],
            };
          });
          break;

        case 'error':
          console.error('❌ WebSocket error:', message.payload);
          const errorPayload = message.payload as any;

          if (errorPayload?.message === 'Authentication failed') {
            const hasAlternativeUrl = wsUrlIndexRef.current < wsUrlsRef.current.length - 1;

            if (hasAlternativeUrl) {
              // Try next WS host candidate before giving up.
              wsUrlIndexRef.current += 1;
              reconnectAttemptRef.current = 0;
              shouldReconnectRef.current = true;
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
              }
              break;
            }

            // No alternative host worked: stop reconnect storm.
            shouldReconnectRef.current = false;
            setConnectionState('error');
            if (!authFailureNotifiedRef.current) {
              authFailureNotifiedRef.current = true;
              toast({
                title: 'Realtime chat unavailable',
                description: 'Using API fallback for chat. You can still view and send messages.',
                variant: 'destructive',
              });
            }
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.close();
            }
            break;
          }

          // Show toast notification for messaging restriction errors
          if (errorPayload?.code === 4010 || errorPayload?.code === 4011) {
            toast({
              title: 'Message Not Sent',
              description: errorPayload.message,
              variant: 'destructive',
              duration: 5000,
            });
          } else if (errorPayload?.message) {
            toast({
              title: 'Error',
              description: errorPayload.message,
              variant: 'destructive',
            });
          }
          break;

        case 'notification':
          // Check if this notification corresponds to the currently OPEN and FOCUSED conversation
          const notificationPayload = message.payload as any;
          if (
            notificationPayload.type === 'NEW_MESSAGE' &&
            notificationPayload.data?.conversationId === currentConversationIdRef.current
          ) {
            console.log('🔕 Suppressing notification for active conversation:', currentConversationIdRef.current);
            return;
          }
          console.log('🔔 Notification received:', message.payload);
          break;

        case 'notifications_count':
          console.log('🔢 Notification count update:', message.payload);
          break;

        default:
          console.log('📨 Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const wsUrl =
        wsUrlsRef.current[wsUrlIndexRef.current] || wsUrlsRef.current[0] || buildWebSocketUrl(window.location.origin);
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      setConnectionState('connecting');

      // WebSocket automatically includes cookies for same-origin requests
      // No need to manually set credentials - browser handles it
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      authFailureNotifiedRef.current = false;

      ws.onopen = () => {
        console.log('✅ WebSocket opened');
        // Authentication happens automatically via cookies
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionState('error');
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setConnectionState('disconnected');
        wsRef.current = null;

        // Attempt to reconnect if we should
        if (shouldReconnectRef.current && isAuthenticated) {
          const delay = getReconnectDelay(reconnectAttemptRef.current);
          console.log(
            `🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`
          );
          setConnectionState('reconnecting');
          reconnectAttemptRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setConnectionState('error');
    }
  }, [isAuthenticated, handleMessage, getReconnectDelay]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState('disconnected');
    reconnectAttemptRef.current = 0;
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback(
    (type: WSMessageType, payload: any) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ WebSocket not connected, cannot send message');
        return;
      }

      const message: WSMessage = { type, payload };
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', type, payload);
    },
    []
  );

  // Join a conversation
  const joinConversation = useCallback(
    (conversationId: string) => {
      setCurrentConversationId(conversationId);
      currentConversationIdRef.current = conversationId; // Update ref immediately
      sendMessage('join_conversation', { conversationId });
    },
    [sendMessage]
  );

  // Set messages for a conversation (hydration)
  const setConversationMessages = useCallback(
    (conversationId: string, loadedMessages: MessageData[]) => {
      console.log(` Hydrating ${loadedMessages.length} messages for conversation: ${conversationId}`);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: loadedMessages,
      }));
    },
    []
  );

  // Add message to state (for external updates)
  const addMessage = useCallback(
    (conversationId: string, message: MessageData) => {
      setMessages((prev: Record<string, MessageData[]>) => {
        const conversationMessages = prev[conversationId] || [];
        const exists = conversationMessages.some((m: MessageData) => m.id === message.id);
        if (exists) return prev;
        return {
          ...prev,
          [conversationId]: [...conversationMessages, message],
        };
      });
    },
    []
  );

  // Register message handler
  const onMessage = useCallback(
    (type: string, handler: (payload: any) => void) => {
      messageHandlersRef.current.set(type, handler);
      return () => {
        messageHandlersRef.current.delete(type);
      };
    },
    []
  );

  // Connect/disconnect based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      wsUrlsRef.current = getWebSocketUrls();
      wsUrlIndexRef.current = 0;
      shouldReconnectRef.current = true;
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Leave current conversation
  const leaveConversation = useCallback(() => {
    setCurrentConversationId(null);
    currentConversationIdRef.current = null;
    // Optional: Notify backend if needed, or backend handles it via new join or disconnect
    // sendMessage('leave_conversation', {}); 
  }, []);

  const value: WebSocketContextType = {
    connectionState,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    setConversationMessages,
    currentConversationId,
    onlineUsers,
    messages,
    conversations,
    setConversations,
    addMessage,
    onMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
