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

## Recent Changes (Migration from Lovable)
- ✅ Replaced Supabase with PostgreSQL + Drizzle ORM
- ✅ Migrated from react-router-dom to Wouter
- ✅ Implemented session-based authentication instead of Supabase Auth
- ✅ Created comprehensive API routes for all functionality
- ✅ Set up WebSocket for real-time messaging
- ✅ Removed all Supabase dependencies and code
- ✅ Updated all components to use new API endpoints

## Important Migration Notes
⚠️ **Authentication System Changed**: During migration from Supabase to Replit:
- **Old Supabase accounts are not transferred** - Users need to create new accounts
- **No email confirmation required** - Accounts are activated immediately upon signup
- **Secure session-based authentication** - More suitable for Replit environment
- **Original Supabase data remains safe** in your Supabase project if needed

## User Preferences
*None documented yet*

## Deployment Notes
The application is configured to run on Replit with:
- Port 5000 for both API and frontend
- PostgreSQL database already provisioned
- Session storage in memory (suitable for development/demo)
- CORS and security headers configured