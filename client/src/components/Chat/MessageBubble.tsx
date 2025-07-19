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
      "flex items-end space-x-2 mb-4",
      isOwnMessage && "flex-row-reverse space-x-reverse"
    )}>
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender?.avatarUrl || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {getInitials(message.sender?.fullName || message.sender?.username || 'U')}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2 relative",
        isOwnMessage 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted rounded-bl-md"
      )}>
        {!isOwnMessage && showAvatar && (
          <p className="text-xs opacity-70 mb-1">
            {message.sender?.fullName || message.sender?.username || 'Unknown'}
          </p>
        )}
        
        <p className="text-sm leading-relaxed">{message.content}</p>
        
        <p className={cn(
          "text-xs mt-1 opacity-70",
          isOwnMessage ? "text-right" : "text-left"
        )}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>
      </div>
      
      {showAvatar && isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender?.avatarUrl || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {getInitials(message.sender?.fullName || message.sender?.username || 'You')}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};