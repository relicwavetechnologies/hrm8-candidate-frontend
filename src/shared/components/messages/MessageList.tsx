/**
 * Message List Component
 * Displays messages in a conversation with scrollable container
 */

import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import type { MessageData } from '@/shared/types/websocket';
import { cn } from '@/shared/lib/utils';
import { format, isSameDay } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: MessageData[];
  currentUserEmail?: string;
  className?: string;
  hideSystemMessages?: boolean;
  isLoading?: boolean;
  /** 'HR' = viewing as HR/employer, 'CANDIDATE' = viewing as candidate */
  viewerType?: 'HR' | 'CANDIDATE';
}

export function MessageList({
  messages,
  
  className,
  hideSystemMessages = false,
  isLoading = false,
  viewerType = 'HR',
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full text-muted-foreground p-8',
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-sm">Loading messages...</p>
      </div>
    );
  }

  // Filter out system messages if hideSystemMessages is true
  const filteredMessages = hideSystemMessages
    ? messages.filter(m => m.senderType !== 'SYSTEM')
    : messages;

  if (filteredMessages.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full text-muted-foreground p-8',
          className
        )}
      >
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-2xl">👋</span>
        </div>
        <p className="font-medium text-foreground">No messages yet</p>
        <p className="text-sm mt-1">Start the conversation by sending a message below.</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: Date; msgs: MessageData[] }[] = [];
  filteredMessages.forEach((msg) => {
    const date = new Date(msg.createdAt);
    if (isNaN(date.getTime())) return;

    if (groupedMessages.length === 0) {
      groupedMessages.push({ date, msgs: [msg] });
    } else {
      const lastGroup = groupedMessages[groupedMessages.length - 1];
      if (isSameDay(lastGroup.date, date)) {
        lastGroup.msgs.push(msg);
      } else {
        groupedMessages.push({ date, msgs: [msg] });
      }
    }
  });

  // Determine if a message is from "own" perspective based on viewer type
  const isOwnMessage = (message: MessageData): boolean => {
    const senderType = message.senderType;

    if (viewerType === 'HR') {
      // HR view: EMPLOYER/CONSULTANT messages are "own" (right side)
      return senderType === 'EMPLOYER' || senderType === 'CONSULTANT';
    } else {
      // Candidate view: CANDIDATE messages are "own" (right side)
      return senderType === 'CANDIDATE';
    }
  };

  // Get sender label based on sender type
  const getSenderLabel = (message: MessageData): string => {
    const senderType = message.senderType;
    if (senderType === 'EMPLOYER' || senderType === 'CONSULTANT') {
      return 'HR';
    } else if (senderType === 'CANDIDATE') {
      // Extract name from email or use "Candidate"
      const email = message.senderEmail || '';
      const name = email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1) || 'Candidate';
    }
    return '';
  };

  return (
    <div className={cn('flex-1 overflow-y-auto px-4 py-4 space-y-6', className)} ref={scrollRef}>
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <div className="flex justify-center sticky top-0 z-10 py-2">
            <span className="text-[10px] font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border shadow-sm">
              {format(group.date, 'MMMM d, yyyy')}
            </span>
          </div>

          {group.msgs.map((message, i) => {
            const isOwn = isOwnMessage(message);
            const isSystem = message.senderType === 'SYSTEM';
            const prevMessage = group.msgs[i - 1];
            const isSequence = prevMessage && prevMessage.senderType === message.senderType;
            const senderLabel = getSenderLabel(message);
            const isHrMessage = message.senderType === 'EMPLOYER' || message.senderType === 'CONSULTANT';

            if (isSystem) {
              return (
                <div
                  key={message.id}
                  className="flex items-center justify-center py-2"
                >
                  <div className="px-3 py-1.5 bg-muted/50 rounded-full text-[11px] text-muted-foreground max-w-md text-center border">
                    {message.content}
                  </div>
                </div>
              );
            }

            // Get sender initials
            const email = message.senderEmail || 'unknown@user';
            const senderName = email.split('@')[0];
            const initials = senderName
              .split('.')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 group',
                  isOwn ? 'flex-row-reverse' : 'flex-row',
                  isSequence ? 'mt-1' : 'mt-4'
                )}
              >
                {!isOwn && (
                  <Avatar className={cn("h-8 w-8 shrink-0 shadow-sm border border-background", isSequence && "opacity-0")}>
                    <AvatarFallback className={cn(
                      "text-[10px]",
                      isHrMessage
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {isHrMessage ? 'HR' : initials}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    'flex flex-col gap-1 max-w-[75%]',
                    isOwn ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-2 text-sm shadow-sm relative',
                      // HR messages: green bubble
                      isHrMessage && !isOwn && 'bg-emerald-500 text-white rounded-2xl rounded-tl-sm',
                      isHrMessage && isOwn && 'bg-emerald-500 text-white rounded-2xl rounded-tr-sm',
                      // Candidate messages: blue bubble
                      !isHrMessage && !isOwn && 'bg-blue-500 text-white rounded-2xl rounded-tl-sm',
                      !isHrMessage && isOwn && 'bg-blue-500 text-white rounded-2xl rounded-tr-sm',
                      isSequence && (isOwn ? 'rounded-tr-2xl' : 'rounded-tl-2xl')
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                  </div>

                  <div className={cn("flex items-center gap-1.5 px-1", isOwn && "flex-row-reverse")}>
                    <span className={cn(
                      "text-[10px] font-medium",
                      isHrMessage ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                    )}>
                      {senderLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      •
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {(() => {
                        try {
                          return message.createdAt && !isNaN(new Date(message.createdAt).getTime())
                            ? format(new Date(message.createdAt), 'h:mm a')
                            : 'Just now';
                        } catch {
                          return 'Just now';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
