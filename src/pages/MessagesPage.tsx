/**
 * Candidate Messages Page
 * List view of all conversations for candidates
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { messagingService } from '@/shared/services/messagingService';
import { ConversationList } from '@/shared/components/messages/ConversationList';
import { Card } from '@/shared/components/ui/card';
import { Loader2, MessageSquare } from 'lucide-react';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

export default function CandidateMessagesPage() {
  const { candidate, isAuthenticated } = useCandidateAuth();
  const { conversations, setConversations, messages } = useWebSocket();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await messagingService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6 h-full bg-gradient-to-b from-background via-background to-muted/40">
        <AtsPageHeader
          title="Messages"
          subtitle="Communicate with recruiters about your applications"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/jobs')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Find jobs
          </Button>
        </AtsPageHeader>
        <div className="h-[calc(100vh-200px)] flex rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-muted/20 backdrop-blur-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                currentConversationId={null}
                currentUserEmail={candidate?.email}
                messages={messages}
              />
            )}
          </div>
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <Card className="p-10 text-center max-w-md shadow-none border-dashed">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
              <p className="text-sm text-muted-foreground">
                Select a conversation from the list to start messaging.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </CandidatePageLayout>
  );
}

