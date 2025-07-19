
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: number;
  createdAt: string;
  messageType: string;
  sender?: {
    id: number;
    profile: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
    };
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
}

export const MessageBubble = ({ message, isOwnMessage, showAvatar }: MessageBubbleProps) => {
  const getSenderName = () => {
    if (isOwnMessage) return 'You';
    if (message.sender?.profile) {
      return message.sender.profile.fullName || message.sender.profile.username || 'Unknown User';
    }
    return 'Unknown User';
  };

  const getSenderAvatar = () => {
    return message.sender?.profile?.avatarUrl || null;
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Unknown User') return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const senderName = getSenderName();

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%]`}>
        {showAvatar && !isOwnMessage && (
          <Avatar className="h-8 w-8 mb-1">
            <AvatarImage src={getSenderAvatar()} />
            <AvatarFallback className="text-xs bg-muted">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        {!showAvatar && !isOwnMessage && <div className="w-8" />}
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {showAvatar && !isOwnMessage && (
            <span className="text-xs text-muted-foreground mb-1 px-2">
              {senderName}
            </span>
          )}
          
          <div
            className={`px-4 py-2 rounded-2xl max-w-md break-words ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          
          <span className="text-xs text-muted-foreground mt-1 px-2">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
        </div>
      </div>
    </div>
  );
};
