/**
 * Conversation List Component
 * Displays list of conversations with preview and unread indicators
 */

import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import type { ConversationData, MessageData } from '@/shared/types/websocket';
import { cn } from '@/shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: ConversationData[];
  currentConversationId?: string | null;
  currentUserEmail?: string;
  messages: Record<string, MessageData[]>;
  className?: string;
}

export function ConversationList({
  conversations,
  currentConversationId,
  currentUserEmail,
  messages,
  className,
}: ConversationListProps) {
  const navigate = useNavigate();

  const getUnreadCount = (conversationId: string): number => {
    const conversationMessages = messages[conversationId] || [];
    return conversationMessages.filter(
      (m) => !(m.readBy || []).includes(currentUserEmail || '') && m.senderEmail !== currentUserEmail
    ).length;
  };

  const getLastMessagePreview = (conversation: ConversationData): string => {
    const conversationMessages = messages[conversation.id] || [];
    if (conversationMessages.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    if (lastMessage.senderType === 'SYSTEM') {
      return 'System message';
    }
    return lastMessage.content.length > 50
      ? `${lastMessage.content.substring(0, 50)}...`
      : lastMessage.content;
  };

  const getDisplayName = (conversation: ConversationData): string => {
    const otherParticipant = conversation.participants.find(
      (p) => p.participantEmail !== currentUserEmail
    );
    return (
      otherParticipant?.displayName ||
      otherParticipant?.participantEmail?.split('@')[0] ||
      'Conversation'
    );
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (conversations.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full text-muted-foreground p-8',
          className
        )}
      >
        <p className="text-sm text-center">
          No conversations yet. Conversations will appear here when you apply to
          jobs or receive messages.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b bg-card/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold leading-tight">Messages</h2>
            <p className="text-xs text-muted-foreground">Keep in sync with recruiters</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const isActive = conversation.id === currentConversationId;
          const unreadCount = getUnreadCount(conversation.id);
          const displayName = getDisplayName(conversation);
          const lastMessagePreview = getLastMessagePreview(conversation);
          const lastMessage = conversation.lastMessage;

          return (
            <button
              key={conversation.id}
              onClick={() => {
                // Determine path based on current route context
                const pathname = window.location.pathname;
                const isCandidateRoute = pathname.startsWith('/candidate');
                const isConsultant360Route = pathname.startsWith('/consultant360');
                const isConsultantRoute = pathname.startsWith('/consultant');

                let path = `/messages/${conversation.id}`;
                if (isCandidateRoute) {
                  path = `/candidate/messages/${conversation.id}`;
                } else if (isConsultant360Route) {
                  path = `/consultant360/messages/${conversation.id}`; // Assuming consultant360 mirrors standard consultant portal structure for now
                } else if (isConsultantRoute) {
                  path = `/consultant/messages/${conversation.id}`;
                }

                navigate(path);
              }}
              className={cn(
                'w-full p-4 text-left transition-colors border-b border-border/70 hover:bg-muted/40',
                isActive && 'bg-muted/60'
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={conversation.candidate?.photo} />
                  <AvatarFallback>
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">
                      {displayName}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(lastMessage.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                  {conversation.job && (
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {conversation.job.title}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessagePreview}
                    </p>
                    {unreadCount > 0 && (
                      <Badge
                        variant="outline"
                        className="h-5 min-w-5 flex items-center justify-center px-1.5 shrink-0"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

