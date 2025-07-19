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
      "flex gap-2 mb-4 max-w-full",
      isOwnMessage ? "flex-row-reverse" : "flex-row"
    )}>
      {showAvatar && (
        <div className="flex-shrink-0 self-end">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender?.avatarUrl || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(message.sender?.fullName || message.sender?.username || (isOwnMessage ? 'You' : 'U'))}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={cn(
        "flex flex-col gap-1 min-w-0 flex-1",
        isOwnMessage ? "items-end" : "items-start",
        !showAvatar && (isOwnMessage ? "mr-10" : "ml-10")
      )}>
        {!isOwnMessage && showAvatar && (
          <p className="text-xs text-muted-foreground px-2 font-medium">
            {message.sender?.fullName || message.sender?.username || 'Unknown'}
          </p>
        )}
        
        <div className={cn(
          "max-w-[70%] rounded-lg px-3 py-2 break-words shadow-sm",
          isOwnMessage 
            ? "bg-blue-500 text-white rounded-br-none" 
            : "bg-gray-100 text-gray-900 rounded-bl-none border"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        
        <p className={cn(
          "text-xs text-gray-500 px-1 mt-1",
          isOwnMessage ? "text-right" : "text-left"
        )}>
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  );
};