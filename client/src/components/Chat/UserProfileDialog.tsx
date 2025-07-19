
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, Calendar, Mail } from 'lucide-react';

interface UserProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: number;
    email: string;
  };
  profile: {
    id: string;
    username: string;
    fullName: string;
    bio?: string;
    avatarUrl?: string;
    status?: string;
    createdAt: string;
  };
  onStartConversation?: (userId: number) => void;
  onAddContact?: (userId: number) => void;
  isContact?: boolean;
  currentUserId?: number;
}

export const UserProfileDialog = ({
  isOpen,
  onOpenChange,
  user,
  profile,
  onStartConversation,
  onAddContact,
  isContact = false,
  currentUserId
}: UserProfileDialogProps) => {
  const isOwnProfile = currentUserId === user.id;

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="text-2xl">
                {profile.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {profile.status && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">{profile.fullName}</h2>
            <p className="text-muted-foreground">@{profile.username}</p>
            
            {profile.status && (
              <Badge variant="secondary" className="text-xs">
                {profile.status}
              </Badge>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="w-full">
              <p className="text-sm text-center text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Email (only for own profile) */}
          {isOwnProfile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}

          {/* Join Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatJoinDate(profile.createdAt)}</span>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 w-full">
              <Button
                variant="default"
                size="sm"
                onClick={() => onStartConversation?.(user.id)}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
              
              {!isContact && onAddContact && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddContact(user.id)}
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              )}
              
              {isContact && (
                <Badge variant="default" className="flex-1 justify-center py-2">
                  Contact Added
                </Badge>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
