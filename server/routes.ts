import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertProfileSchema, insertConversationSchema, insertMessageSchema, insertContactSchema } from "@shared/schema";
import { z } from "zod";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-for-replit-chat-app';

interface JWTPayload {
  userId: number;
  email: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      console.log("Auth middleware - Token valid for user:", decoded.userId);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      console.error("Auth middleware - Invalid token:", error);
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const signupSchema = insertUserSchema.extend({
        fullName: z.string().min(1),
        username: z.string().min(1),
      });

      const { email, password, fullName, username } = signupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Check if username already exists
      const existingProfile = await storage.getProfileByUsername(username);
      if (existingProfile) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Create user and profile in transaction-like manner
      try {
        const user = await storage.createUser({ email, password });

        const profile = await storage.createProfile({
          userId: user.id,
          username,
          fullName,
        });

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({ 
          user: { 
            id: user.id, 
            email: user.email 
          },
          profile,
          token
        });
      } catch (profileError) {
        // If profile creation fails, clean up the user
        try {
          await storage.deleteUser(user.id);
        } catch (cleanupError) {
          console.error("Error cleaning up user:", cleanupError);
        }
        throw profileError;
      }

    } catch (error) {
      console.error("Signup error:", error);
      if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
        res.status(400).json({ error: "Username or email already taken" });
      } else {
        res.status(400).json({ error: "Registration failed. Please try again." });
      }
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Sign-in attempt for:', email);

      // Validate input
      if (!email || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (typeof email !== 'string' || typeof password !== 'string') {
        console.log('Invalid credential types');
        return res.status(400).json({ error: 'Invalid credential format' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email.trim());
      console.log('User lookup result:', user ? `Found user ${user.id}` : 'User not found');

      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await storage.verifyPassword(password.trim(), user.password);
      console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');

      if (!isValid) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Get user profile
      const profile = await storage.getProfileByUserId(user.id);
      console.log('Profile lookup:', profile ? `Found profile ${profile.id}` : 'Profile not found');

      if (!profile) {
        console.error('Profile not found for user:', user.id);
        return res.status(500).json({ error: 'User profile not found' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log("Sign-in successful for:", email, "User ID:", user.id);

      // Send response
      const response = { 
        user: { 
          id: user.id, 
          email: user.email 
        },
        profile: {
          id: profile.id,
          userId: profile.userId,
          username: profile.username,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
          status: profile.status,
          lastSeen: profile.lastSeen,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        },
        token
      };

      res.json(response);
    } catch (error) {
      console.error("Signin error details:", error);
      res.status(500).json({ error: "Internal server error during sign in" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    // With JWT, signout is handled client-side by removing token
    res.json({ message: "Signed out successfully" });
  });

  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const user = await storage.getUserById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const profile = await storage.getProfileByUserId(decoded.userId);

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email 
        },
        profile 
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // Profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.userId!);
      res.json(profile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

   // Get user profile by ID
   app.get('/api/users/:userId/profile', requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const parsedUserId = parseInt(userId);

      if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await storage.getUserById(parsedUserId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profile = await storage.getProfileByUserId(parsedUserId);

      res.json({ 
        user: {
          id: user.id,
          email: user.email
        },
        profile: profile || null
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const updateData = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(req.userId!, updateData);
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(req.userId!);

      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          // Get participants with profiles
          const participantData = await storage.getConversationParticipants(conv.id)

          // Get last message with sender profile
          const lastMessage = await storage.getLastMessageWithSenderProfile(conv.id);

          return {
            ...conv,
            participants: participantData,
            lastMessage: lastMessage || null
          };
        })
      );

      res.json(conversationsWithDetails);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const { participants = [], ...conversationData } = req.body;

      console.log('Creating conversation:', { participants, conversationData, userId: req.userId });

      // For 1:1 conversations, check if one already exists
      if (!conversationData.isGroup && participants.length === 1) {
        try {
          const existingConversation = await storage.findExistingConversation(req.userId!, participants[0]);
          if (existingConversation) {
            console.log('Found existing conversation:', existingConversation.id);
            return res.json(existingConversation);
          }
        } catch (findError) {
          console.log('No existing conversation found, creating new one');
        }
      }

      const parsedData = insertConversationSchema.parse({
        ...conversationData,
        isGroup: conversationData.isGroup || false,
      });

      const conversation = await storage.createConversation({
        ...parsedData,
        createdBy: req.userId!,
      });

      console.log('Created conversation:', conversation.id);

      // Add creator as participant
      await storage.addUserToConversation(conversation.id, req.userId!);

      // Add other participants
      for (const participantId of participants) {
        if (participantId !== req.userId) {
          await storage.addUserToConversation(conversation.id, participantId);
        }
      }

      // Return conversation with full details
      const fullConversation = await storage.getConversationDetails(conversation.id);
      res.json(fullConversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Message routes
  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversationId(id);

      // Enrich messages with sender profile information
      const enrichedMessages = await Promise.all(
        messages.map(async (message: any) => {
          const senderProfile = await storage.getProfileByUserId(message.senderId);
          return {
            ...message,
            senderProfile
          };
        })
      );

      res.json(enrichedMessages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/conversations/:id/details", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversationDetails(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Get conversation details error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { content, messageType = 'text' } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      console.log(`Creating message for conversation ${id} from user ${req.userId}`);

      // Create the complete message object with conversationId and senderId
      const messageData = {
        content: content.trim(),
        messageType,
        conversationId: id,
        senderId: req.userId!,
      };

      // Parse with the complete data
      const parsedMessageData = insertMessageSchema.parse(messageData);

      const message = await storage.createMessage(parsedMessageData);

      console.log(`Message created successfully:`, message.id);

      // Note: Real-time broadcasting would go here in production
      // For now, clients will refetch via polling or manual refresh

      res.json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Failed to create message. Please try again." });
    }
  });

  // Contact routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContactsByUserId(req.userId!);
      res.json(contacts);
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all users route
  app.get("/api/users/all", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithProfiles();
      res.json(users);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User search route
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { email } = req.query;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email parameter is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const profile = await storage.getProfileByUserId(user.id);

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email 
        },
        profile 
      });
    } catch (error) {
      console.error("Search user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const { contactId } = req.body;

      if (!contactId || typeof contactId !== 'number') {
        return res.status(400).json({ error: "Contact ID is required and must be a number" });
      }

      // Check if contact already exists
      const existingContact = await storage.getExistingContact(req.userId!, contactId);
      if (existingContact) {
        return res.status(400).json({ error: "Contact already exists" });
      }

      // Check if user is trying to add themselves
      if (req.userId === contactId) {
        return res.status(400).json({ error: "Cannot add yourself as a contact" });
      }

      // Create contact data object
      const contactData = {
        userId: req.userId!,
        contactId,
        status: "accepted"
      };

      const contact = await storage.createContact(contactData);
      res.json(contact);
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // Note: WebSocket setup for real-time messaging is commented out to avoid conflicts with Vite
  // In production, you can enable this for real-time features
  /*
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: any) => {
    console.log('WebSocket client connected');
    // WebSocket logic here
  });
  */

  return httpServer;
}