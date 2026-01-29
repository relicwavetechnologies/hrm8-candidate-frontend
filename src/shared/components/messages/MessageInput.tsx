/**
 * Message Input Component
 * Input field for sending messages in a conversation
 */

import { useState, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Paperclip, Send } from 'lucide-react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { cn } from '@/shared/lib/utils';
import { apiClient } from '@/shared/services/api';

interface MessageInputProps {
  conversationId: string;
  conversationStatus?: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
  disabled?: boolean;
  className?: string;
  isMarkingRead?: boolean;
}

export function MessageInput({
  conversationId,
  conversationStatus = 'ACTIVE',
  disabled = false,
  className,
  isMarkingRead = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { sendMessage, isConnected } = useWebSocket();

  const isArchivedOrClosed = conversationStatus === 'ARCHIVED' || conversationStatus === 'CLOSED';
  const isInputDisabled = disabled || !isConnected || isArchivedOrClosed;

  const handleSend = () => {
    if (!message.trim() || !isConnected || disabled || isArchivedOrClosed) return;

    sendMessage('send_message', {
      conversationId,
      content: message.trim(),
    });

    setMessage('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      const uploadRes = await apiClient.upload<{ url: string }>('/api/upload', formData);
      if (uploadRes.success && uploadRes.data?.url) {
        sendMessage('send_message', {
          conversationId,
          content: uploadRes.data.url,
        });
      }
    } catch (error) {
      console.error('File upload failed', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || !isConnected || (!message.trim() && !uploading);

  return (
    <div className={cn('flex flex-col gap-2 p-4 pt-2 border-t bg-background/95 backdrop-blur-md', className)}>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isInputDisabled || uploading}
      />

      <div className="flex items-end gap-2 bg-muted/30 p-1.5 rounded-3xl border border-border/40 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          disabled={isInputDisabled || uploading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isArchivedOrClosed
              ? `Conversation is ${conversationStatus.toLowerCase()}.`
              : isConnected
                ? 'Message...'
                : 'Connecting...'
          }
          disabled={isInputDisabled}
          rows={1}
          className="min-h-[40px] max-h-[140px] py-2.5 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
        />

        <Button
          onClick={handleSend}
          disabled={isDisabled || isArchivedOrClosed}
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full shrink-0 transition-all duration-200",
            message.trim() ? "bg-primary text-primary-foreground shadow-md hover:scale-105" : "bg-muted text-muted-foreground hover:bg-muted/80 shadow-none"
          )}
        >
          <Send className="h-5 w-5 ml-0.5" />
        </Button>
      </div>

      {isMarkingRead && (
        <div className="flex justify-end px-2">
          <span className="text-[10px] text-muted-foreground/60 transition-opacity duration-500">Seen</span>
        </div>
      )}
    </div>
  );
}






























