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
      req.userId = decoded.userId;
      next();
    } catch (error) {
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
      console.log("Sign-in attempt:", req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? "yes" : "no");
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await storage.verifyPassword(password, user.password);
      console.log("Password valid:", isValid);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      console.log("Login successful for:", email);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email 
        },
        token
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ error: "Internal server error" });
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
      console.error("Get user error:", error);
      return res.status(401).json({ error: "Invalid token" });
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
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const { participants = [], ...conversationData } = req.body;
      
      // For 1:1 conversations, check if one already exists
      if (!conversationData.isGroup && participants.length === 1) {
        const existingConversation = await storage.findExistingConversation(req.userId!, participants[0]);
        if (existingConversation) {
          return res.json(existingConversation);
        }
      }
      
      const parsedData = insertConversationSchema.parse(conversationData);
      const conversation = await storage.createConversation({
        ...parsedData,
        createdBy: req.userId!,
      });
      
      // Add creator as participant
      await storage.addUserToConversation(conversation.id, req.userId!);
      
      // Add other participants
      for (const participantId of participants) {
        if (participantId !== req.userId) {
          await storage.addUserToConversation(conversation.id, participantId);
        }
      }
      
      res.json(conversation);
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
      res.json(messages);
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
      const messageData = insertMessageSchema.parse(req.body);
      
      const message = await storage.createMessage({
        ...messageData,
        conversationId: id,
        senderId: req.userId!,
      });
      
      // Note: Real-time broadcasting would go here in production
      // For now, clients will refetch via polling or manual refresh
      
      res.json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Internal server error" });
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
      const contactData = insertContactSchema.parse(req.body);
      
      // Check if contact already exists
      const existingContact = await storage.getExistingContact(req.userId!, contactData.contactId);
      if (existingContact) {
        return res.status(400).json({ error: "Contact already exists" });
      }
      
      // Check if user is trying to add themselves
      if (req.userId === contactData.contactId) {
        return res.status(400).json({ error: "Cannot add yourself as a contact" });
      }
      
      const contact = await storage.createContact({
        ...contactData,
        userId: req.userId!,
      });
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
