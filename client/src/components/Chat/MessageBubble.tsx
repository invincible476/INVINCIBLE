import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: number;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export const MessageBubble = ({ message, isOwnMessage, showAvatar = true }: MessageBubbleProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn(
      "flex gap-3 mb-3",
      isOwnMessage ? "flex-row-reverse" : "flex-row"
    )}>
      {showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender?.avatarUrl || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(message.sender?.fullName || message.sender?.username || (isOwnMessage ? 'You' : 'U'))}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={cn(
        "flex flex-col gap-1",
        isOwnMessage ? "items-end" : "items-start",
        !showAvatar && (isOwnMessage ? "mr-11" : "ml-11")
      )}>
        {!isOwnMessage && showAvatar && (
          <p className="text-xs text-muted-foreground px-1">
            {message.sender?.fullName || message.sender?.username || 'Unknown'}
          </p>
        )}
        
        <div className={cn(
          "max-w-[300px] sm:max-w-[400px] rounded-2xl px-4 py-2 break-words",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-muted text-foreground rounded-bl-sm"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        <p className={cn(
          "text-xs text-muted-foreground px-1",
          isOwnMessage ? "text-right" : "text-left"
        )}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  );
};