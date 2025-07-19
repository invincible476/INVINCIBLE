import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: number;
  createdAt: string;
  messageType?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
}

export const MessageBubble = ({ message, isOwn, senderName }: MessageBubbleProps) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {senderName ? senderName.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "max-w-[70%] flex flex-col",
        isOwn ? "items-end" : "items-start"
      )}>
        {!isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {senderName || 'Unknown User'}
          </span>
        )}

        <div className={cn(
          "rounded-2xl px-4 py-2 text-sm break-words",
          isOwn 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted rounded-bl-md"
        )}>
          <p>{message.content}</p>
        </div>

        <span className="text-xs text-muted-foreground mt-1 px-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};