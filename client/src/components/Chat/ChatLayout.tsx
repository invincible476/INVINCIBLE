import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ConversationsList } from './ConversationsList';
import { ContactsList } from './ContactsList';
import { UserDiscovery } from './UserDiscovery';
import { ProfileSettings } from './ProfileSettings';
import { ChatWindow } from './ChatWindow';
import { MessageSquare, Users, Search, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import { useContacts } from '@/hooks/useContacts';

export const ChatLayout = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'chat' | 'contacts' | 'discover' | 'settings'>('discover');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const { 
    conversations, 
    loading: conversationsLoading, 
    refreshConversations 
  } = useConversations();

  const { 
    contacts, 
    loading: contactsLoading, 
    refreshContacts 
  } = useContacts();

  // Auto-refresh conversations and contacts
  useEffect(() => {
    const interval = setInterval(() => {
      refreshConversations();
      refreshContacts();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshConversations, refreshContacts]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Sign Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully',
      });
    }
  };

  const handleStartConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setActiveView('chat');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Chat Rescuer</h1>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {profile && (
            <div className="text-sm">
              <p className="font-medium">{profile.fullName}</p>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-2 border-b border-border">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={activeView === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('chat')}
              className="justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chats
            </Button>
            <Button
              variant={activeView === 'discover' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('discover')}
              className="justify-start"
            >
              <Search className="h-4 w-4 mr-2" />
              Discover
            </Button>
            <Button
              variant={activeView === 'contacts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('contacts')}
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Contacts
            </Button>
            <Button
              variant={activeView === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('settings')}
              className="justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'chat' && (
            <ConversationsList
              conversations={conversations}
              loading={conversationsLoading}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          )}
          {activeView === 'contacts' && (
            <ContactsList onStartConversation={handleStartConversation} />
          )}
          {activeView === 'discover' && (
            <UserDiscovery onStartConversation={handleStartConversation} />
          )}
          {activeView === 'settings' && <ProfileSettings />}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow conversationId={selectedConversationId} />
        ) : activeView === 'chat' ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                No Conversation Selected
              </h2>
              <p className="text-muted-foreground mb-4">
                Select a conversation from the sidebar or start a new one
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setActiveView('discover')}>
                  <Search className="h-4 w-4 mr-2" />
                  Discover Users
                </Button>
                <Button onClick={() => setActiveView('contacts')} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Contacts
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                Welcome to Chat Rescuer
              </h2>
              <p className="text-muted-foreground mb-4">
                Use the sidebar to navigate between different sections
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};