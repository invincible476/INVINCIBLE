import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConversationsList } from './ConversationsList';
import { DemoSetup } from './DemoSetup';
import { ChatWindow } from './ChatWindow';
import { ContactsList } from './ContactsList';
import { ProfileSettings } from './ProfileSettings';
import { WelcomeMessage } from './WelcomeMessage';
import { UserDiscovery } from './UserDiscovery';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, MessageSquare, Users, Settings, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type ActiveView = 'chat' | 'contacts' | 'discover' | 'settings';

export const ChatLayout = () => {
  const [activeView, setActiveView] = useState<ActiveView>('discover');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut();
      // Force a full page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, try to clear local state
      localStorage.removeItem('authToken');
      window.location.reload();
    }
  };

  useEffect(() => {
    if (user) {
      // Fetch user profile with proper authentication
      const token = localStorage.getItem('authToken');
      if (token) {
        fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
          .then(res => {
            if (res.ok) {
              return res.json();
            }
            throw new Error('Failed to fetch profile');
          })
          .then(data => {
            setProfile(data);
          })
          .catch(error => {
            console.error("Failed to fetch profile", error);
          });
      }
    }
  }, [user]);

  // Check if user has any conversations or contacts
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds to reduce load
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: !!user,
    refetchInterval: 8000, // Refresh every 8 seconds to reduce load
    staleTime: 3000, // Consider data stale after 3 seconds
  });

  const hasData = conversations.length > 0 || contacts.length > 0;
  const isLoading = conversationsLoading || contactsLoading;

  // Auto-switch to discover view if no conversations exist, but allow manual navigation
  useEffect(() => {
    if (!isLoading && !hasData && activeView === 'chat') {
      // Only auto-switch on initial load, not when user manually selects chat
      setActiveView('discover');
    }
  }, [isLoading, hasData]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-chat-sidebar border-r border-border flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-chat-sidebar-foreground">
              Chat Rescuer
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-chat-sidebar-foreground hover:bg-chat-sidebar-hover"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current User Info */}
        {profile && (
          <div className="p-3 bg-blue-50 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatarUrl || ''} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {(profile.fullName || profile.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{profile.fullName || profile.username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="grid grid-cols-4 border-b border-border">
          <Button
            variant="ghost"
            className={cn(
              "rounded-none text-chat-sidebar-foreground hover:bg-chat-sidebar-hover",
              activeView === 'chat' && "bg-chat-sidebar-hover"
            )}
            onClick={() => setActiveView('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chats
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "rounded-none text-chat-sidebar-foreground hover:bg-chat-sidebar-hover",
              activeView === 'contacts' && "bg-chat-sidebar-hover"
            )}
            onClick={() => setActiveView('contacts')}
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "rounded-none text-chat-sidebar-foreground hover:bg-chat-sidebar-hover",
              activeView === 'discover' && "bg-chat-sidebar-hover"
            )}
            onClick={() => setActiveView('discover')}
          >
            <Search className="h-4 w-4 mr-2" />
            Discover
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "rounded-none text-chat-sidebar-foreground hover:bg-chat-sidebar-hover",
              activeView === 'settings' && "bg-chat-sidebar-hover"
            )}
            onClick={() => setActiveView('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'chat' && (
            <ConversationsList
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          )}
          {activeView === 'contacts' && (
            <ContactsList 
              onStartConversation={(conversationId) => {
                // Switch to chat view and select the conversation
                setActiveView('chat');
                setSelectedConversationId(conversationId);
              }}
            />
          )}
          {activeView === 'discover' && (
            <UserDiscovery 
              onStartConversation={(conversationId) => {
                // Switch to chat view and select the conversation
                setActiveView('chat');
                setSelectedConversationId(conversationId);
              }}
            />
          )}
          {activeView === 'settings' && <ProfileSettings />}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow conversationId={selectedConversationId} />
        ) : activeView === 'discover' ? (
          <UserDiscovery onStartConversation={(conversationId) => {
            console.log('Starting conversation:', conversationId);
            setActiveView('chat');
            setSelectedConversationId(conversationId);
          }} />
        ) : activeView === 'contacts' ? (
          <ContactsList onStartConversation={(conversationId) => {
            console.log('Starting conversation from contacts:', conversationId);
            setActiveView('chat');
            setSelectedConversationId(conversationId);
          }} />
        ) : activeView === 'settings' ? (
          <ProfileSettings />
        ) : activeView === 'chat' ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-4 max-w-md mx-auto p-6">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                No Conversations Selected
              </h2>
              <p className="text-muted-foreground mb-4">
                {conversations.length > 0 
                  ? 'Select a conversation from the sidebar to start chatting'
                  : 'Start a conversation by adding contacts or discovering new users'
                }
              </p>
              {conversations.length === 0 && (
                <div className="flex flex-col gap-2 justify-center">
                  <Button onClick={() => setActiveView('discover')} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Discover Users
                  </Button>
                  <Button onClick={() => setActiveView('contacts')} variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    View Contacts
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                Welcome to Chat Rescuer
              </h2>
              <p className="text-muted-foreground mb-4">
                Choose an option from the sidebar to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};