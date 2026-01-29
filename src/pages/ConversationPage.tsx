/**
 * Candidate Conversation Page
 * Individual conversation view for candidates
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { messagingService } from '@/shared/services/messagingService';
import { ConversationHeader } from '@/shared/components/messages/ConversationHeader';
import { MessageList } from '@/shared/components/messages/MessageList';
import { MessageInput } from '@/shared/components/messages/MessageInput';
import type { ConversationData } from '@/shared/types/websocket';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';

export default function CandidateConversationPage() {
  // All hooks must be called unconditionally at the top level
  const { conversationId } = useParams<{ conversationId: string }>();
  const { candidate } = useCandidateAuth();
  const { messages, joinConversation, leaveConversation, isConnected } = useWebSocket();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  // Memoize loadConversation to prevent recreation on every render
  const loadConversation = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      const response = await messagingService.getConversation(conversationId);
      if (response.success && response.data) {
        setConversation(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Load conversation and join WebSocket room
  useEffect(() => {
    if (conversationId) {
      loadConversation();
      joinConversation(conversationId);
    }

    return () => {
      if (leaveConversation) {
        leaveConversation();
      }
    };
  }, [conversationId, loadConversation, joinConversation, leaveConversation]);

  // Mark messages as read on load/focus
  useEffect(() => {
    const markRead = async () => {
      if (!conversationId || !candidate?.id) return;
      try {
        setIsMarkingRead(true);
        await messagingService.markConversationRead(conversationId);
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      } finally {
        setIsMarkingRead(false);
      }
    };
    markRead();
  }, [conversationId, candidate?.id]);

  // Memoize sorted messages to prevent recalculation on every render
  const conversationMessages = useMemo(() => {
    if (!conversationId) return [];
    const arr = messages[conversationId] || [];
    return [...arr].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, conversationId]);

  if (!conversationId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Conversation not found</p>
          <Button
            variant="outline"
            onClick={() => navigate('/candidate/messages')}
            className="mt-4"
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6 h-full bg-gradient-to-b from-background via-background to-muted/40">
        <AtsPageHeader
          title="Messages"
          subtitle="Conversation"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/candidate/messages')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </AtsPageHeader>
        <div className="h-[calc(100vh-200px)] flex flex-col rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b bg-muted/20 backdrop-blur-sm">
            <ConversationHeader
              conversation={conversation}
              currentUserEmail={candidate?.email}
            />
          </div>
          <MessageList
            messages={conversationMessages}
            currentUserEmail={candidate?.email}
            className="flex-1 bg-background/60"
            viewerType="CANDIDATE"
          />
          <MessageInput
            conversationId={conversationId}
            conversationStatus={conversation?.status}
            disabled={!isConnected}
            isMarkingRead={isMarkingRead}
            className="bg-muted/20 backdrop-blur-sm"
          />
        </div>
      </div>
    </CandidatePageLayout>
  );
}

