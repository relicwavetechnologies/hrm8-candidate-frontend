/**
 * Conversation Header Component
 * Shows participant info and online status
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { useWebSocket } from '@/contexts/WebSocketContext';
import type { ConversationData } from '@/shared/types/websocket';
import { cn } from '@/shared/lib/utils';
// import { CheckCircle2, Clock } from 'lucide-react';

interface ConversationHeaderProps {
  conversation: ConversationData;
  currentUserEmail?: string;
  className?: string;
}

export function ConversationHeader({
  conversation,
  currentUserEmail,
  className,
}: ConversationHeaderProps) {
  const { onlineUsers } = useWebSocket();

  // Get the other participant (not current user)
  const participants = conversation.participants || [];
  const otherParticipant = participants.find(
    (p) => p.participantEmail !== currentUserEmail
  );
  const otherParticipantEmail = otherParticipant?.participantEmail;
  const isOnline = otherParticipantEmail
    ? onlineUsers.some((u) => u.userEmail === otherParticipantEmail)
    : false;

  // Get display name
  let displayName = 'Unknown Contact';
  if (otherParticipant?.displayName) {
    displayName = otherParticipant.displayName;
  } else if (otherParticipantEmail) {
    displayName = otherParticipantEmail.split('@')[0];
  }

  // Get initials
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-6 py-4 bg-background/95 backdrop-blur-md border-b sticky top-0 z-10',
        className
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
          <AvatarImage src={undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
        </Avatar>
        {isOnline && conversation.status === 'ACTIVE' && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm leading-none">{displayName}</h3>
          {conversation.status !== 'ACTIVE' && (
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px] font-normal uppercase tracking-wider",
                conversation.status === 'ARCHIVED' ? "text-muted-foreground border-muted-foreground/30" : "text-destructive border-destructive/30"
              )}
            >
              {conversation.status}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          {conversation.job && (
            <span className="max-w-[200px] truncate font-medium text-foreground/80">
              {conversation.job.title}
            </span>
          )}
          {conversation.job && isOnline && <span className="text-muted-foreground/40">•</span>}
          {conversation.status === 'ACTIVE' ? (
            isOnline ? (
              <span className="text-green-600 font-medium">Active now</span>
            ) : (
              <span>Offline</span>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}






























