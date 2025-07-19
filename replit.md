# Chat Rescuer - Replit Migration

## Project Overview
Chat Rescuer is a real-time chat application that has been successfully migrated from Lovable/Supabase to the Replit environment. The app features user authentication, real-time messaging, contact management, and conversation handling.

## Architecture
- **Frontend**: React with TypeScript, Wouter for routing, TailwindCSS + shadcn/ui for styling
- **Backend**: Express.js with TypeScript, session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket for live messaging
- **State Management**: TanStack Query for API state management

## Database Schema
The application uses the following main tables:
- `users` - Authentication and basic user data
- `profiles` - Extended user profile information
- `conversations` - Chat conversations (1:1 and group)
- `conversation_participants` - User participation in conversations
- `messages` - Chat messages with file support
- `contacts` - User contact relationships
- `message_status` - Message delivery/read status

## Security Features
- Session-based authentication with secure cookies
- Password hashing with bcrypt
- SQL injection protection via Drizzle ORM
- Input validation with Zod schemas
- Proper client/server separation

## Recent Changes (Complete Refactor - July 19, 2025)
- ✅ **Complete Database Reset**: Cleared all old data and rebuilt schema from scratch
- ✅ **Enhanced Authentication**: Fixed JWT token handling with proper error management
- ✅ **Real-time Messaging**: Implemented auto-refresh every 5 seconds for conversations
- ✅ **Contact Management**: Added user search by email with duplicate prevention
- ✅ **Modern Chat Interface**: Created message bubbles with avatars and timestamps
- ✅ **Conversation Creation**: Built "New Chat" dialog with group chat support
- ✅ **Data Structure Fix**: Corrected frontend/backend mapping for proper real-time updates
- ✅ **Demo Setup**: Added demo data creation for easy testing
- ✅ **Error Handling**: Comprehensive error management and user feedback
- ✅ **UI/UX Improvements**: Better loading states and responsive design

## Important Migration Notes
⚠️ **Authentication System Changed**: During migration from Supabase to Replit:
- **Old Supabase accounts are not transferred** - Users need to create new accounts
- **No email confirmation required** - Accounts are activated immediately upon signup
- **Secure session-based authentication** - More suitable for Replit environment
- **Original Supabase data remains safe** in your Supabase project if needed

## User Preferences
- **Real-time Updates**: User wants smooth real-time messaging without manual refresh
- **Clean Setup**: Prefers step-by-step implementation from base level
- **Multi-user Support**: Wants multiple users to be able to login/signup and chat seamlessly

## Deployment Notes
The application is configured to run on Replit with:
- Port 5000 for both API and frontend
- PostgreSQL database already provisioned
- Session storage in memory (suitable for development/demo)
- CORS and security headers configured