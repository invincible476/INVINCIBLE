
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, Calendar, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({
  userId,
  open,
  onOpenChange
}: UserProfileDialogProps) => {
  const { user: currentUser } = useAuth();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      return apiRequest(`/api/users/${userId}/profile`);
    },
    enabled: !!userId && open,
  });

  if (!userId || !open) {
    return null;
  }

  const isOwnProfile = currentUser?.id === parseInt(userId);

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">User Profile</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profileData ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.profile?.avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {profileData.profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {profileData.profile?.status && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">
                {profileData.profile?.fullName || 'Unknown User'}
              </h2>
              <p className="text-muted-foreground">
                @{profileData.profile?.username || 'unknown'}
              </p>
              
              {profileData.profile?.status && (
                <Badge variant="secondary" className="text-xs">
                  {profileData.profile.status}
                </Badge>
              )}
            </div>

            {/* Bio */}
            {profileData.profile?.bio && (
              <div className="w-full">
                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  {profileData.profile.bio}
                </p>
              </div>
            )}

            {/* Email (only for own profile) */}
            {isOwnProfile && profileData.user?.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profileData.user.email}</span>
              </div>
            )}

            {/* Join Date */}
            {profileData.profile?.createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatJoinDate(profileData.profile.createdAt)}</span>
              </div>
            )}

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">User profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
